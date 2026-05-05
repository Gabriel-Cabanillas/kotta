import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { enviarCodigoVerificacion } from '@/lib/email'

function generarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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
    const { user } = await (prisma as any).$transaction(async (tx: any) => {
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

      return { org, user }
    })

    // Generar y guardar código 2FA
    const codigo = generarCodigo()
    const expira = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    await (prisma as any).verificationCode.create({
      data: {
        email,
        code:      codigo,
        type:      'REGISTRO',
        expiresAt: expira,
      },
    })

    // Enviar correo
    await enviarCodigoVerificacion(email, codigo, 'registro')

    return NextResponse.json({ ok: true, email })
  } catch (error: any) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}