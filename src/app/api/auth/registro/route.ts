/**
 * Atiende el registro público de un nuevo condominio en Kotta.
 *
 * Contiene la creación transaccional de la organización y su usuario ADMIN
 * inicial, el hash de contraseña, la generación del slug del coto y el envío del
 * código de verificación de registro.
 *
 * Se relaciona con `src/app/sign-up/page.tsx`, `src/app/verificar/page.tsx`,
 * `src/lib/prisma.ts`, `src/lib/email.ts` y los modelos `Organization`, `User`
 * y `VerificationCode`.
 *
 * Existe para iniciar el alta de un nuevo coto dejando al administrador inactivo
 * hasta que confirme su correo.
 */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { enviarCodigoVerificacion } from '@/lib/email'
import { emitirCodigo, setOtpChallenge } from '@/lib/otp'

function generarSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export async function POST(req: Request) {
  try {
    const { nombreCoto, email, password } = await req.json()

    if (!nombreCoto || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Verificar si el correo ya existe
    const existingUser = await (prisma as any).user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 400 }
      )
    }

    // Verificar si el slug del coto ya existe
    const slug = generarSlug(nombreCoto)
    const existingOrg = await (prisma as any).organization.findUnique({
      where: { slug },
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Ya existe un condominio con ese nombre' },
        { status: 400 }
      )
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear organización y admin en transacción
    const { issued } = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { slug, name: nombreCoto, isActive: true },
      })

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name:     email.split('@')[0],
          role:     'ADMIN',
          orgId:    org.id,
          isActive: false, // inactivo hasta verificar
        },
      })

      const subscription = await tx.kottaSubscription.create({
        data: { organizationId: org.id, status: 'PENDING_ACTIVATION' },
      })
      await tx.kottaSubscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          type: 'SUBSCRIPTION_CREATED',
          newStatus: 'PENDING_ACTIVATION',
          reason: 'Suscripción comercial creada automáticamente durante el registro.',
        },
      })

      const issued = await emitirCodigo(tx, email, 'REGISTRO')
      if ('retryAfter' in issued) throw new Error('Límite de emisión de códigos alcanzado')
      return { issued }
    })

    // El registro y el código ya quedaron persistidos. Si Resend no permite
    // entregar al destinatario en desarrollo, el flujo continúa hacia
    // /verificar y el código puede consultarse mediante /api/auth/dev-codigo.
    try {
      await enviarCodigoVerificacion(email, issued.code, 'registro')
    } catch {
      console.warn('No se pudo enviar el correo de registro; usa /api/auth/dev-codigo en desarrollo:', email)
    }

    const response = NextResponse.json({ ok: true, email })
    setOtpChallenge(response, issued.id)
    return response
  } catch (error: any) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
