/**
 * Atiende el primer paso del inicio de sesión de Kotta.
 *
 * Contiene la validación de credenciales, la verificación de usuario activo, la
 * generación de un código temporal de login y el envío del código por correo.
 *
 * Se relaciona con `src/app/sign-in/page.tsx`, `src/app/verificar/page.tsx`,
 * `src/lib/prisma.ts`, `src/lib/email.ts` y `VerificationCode` en Prisma.
 *
 * Existe para separar la validación de contraseña de la creación de sesión, que
 * ocurre solo después de confirmar el código enviado al usuario.
 */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { enviarCodigoVerificacion } from '@/lib/email'
import { emitirCodigo, setOtpChallenge } from '@/lib/otp'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Correo y contraseña son requeridos' }, { status: 400 })
    }

    const user = await (prisma as any).user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Tu cuenta no está activada. Revisa tu correo.' }, { status: 401 })
    }

    const passwordValido = await bcrypt.compare(password, user.password)
    if (!passwordValido) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 })
    }

    const issued = await prisma.$transaction(async (tx) => {
      // No emitir un código si una desactivación ocurrió durante el login.
      const active = await tx.user.updateMany({ where: { id: user.id, isActive: true }, data: { isActive: true } })
      if (active.count !== 1) return false
      return emitirCodigo(tx, email, 'LOGIN')
    })
    if (!issued) return NextResponse.json({ error: 'Tu cuenta no está activada.' }, { status: 401 })
    if ('retryAfter' in issued) {
      return NextResponse.json({ error: 'Espera antes de solicitar otro código.' }, {
        status: 429, headers: { 'Retry-After': String(issued.retryAfter) },
      })
    }

    // Intentar enviar correo — si falla, igual dejamos pasar (modo desarrollo)
    try {
      await enviarCodigoVerificacion(email, issued.code, 'login')
    } catch (emailError) {
      console.warn('⚠️ No se pudo enviar el correo (usa /api/auth/dev-codigo para obtener el código):', email)
    }

    const response = NextResponse.json({ ok: true, email })
    setOtpChallenge(response, issued.id)
    return response
  } catch (error: any) {
    console.error('Error en login:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
