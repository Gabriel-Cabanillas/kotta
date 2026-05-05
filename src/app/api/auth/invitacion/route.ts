import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { enviarInvitacion } from '@/lib/email'
import { randomBytes } from 'crypto'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, nombre, role, houseNumber, orgId } = await req.json()

    // Verificar que quien invita es admin
    const admin = await getSession()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (admin.orgId !== orgId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar si el correo ya existe
    const existing = await (prisma as any).user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 400 }
      )
    }

    const org = await (prisma as any).organization.findUnique({
      where: { id: orgId },
    })

    // Crear usuario inactivo con contraseña temporal
    const tempPassword = await bcrypt.hash(randomBytes(16).toString('hex'), 12)

    await (prisma as any).user.create({
      data: {
        email,
        password:    tempPassword,
        name:        nombre,
        role,
        orgId,
        houseNumber: houseNumber || null,
        isActive:    false,
      },
    })

    // Generar token de invitación
    const token  = randomBytes(32).toString('hex')
    const expira = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hrs

    await (prisma as any).verificationCode.create({
      data: {
        email,
        code:      token,
        type:      'INVITACION',
        expiresAt: expira,
      },
    })

    await enviarInvitacion(email, nombre, org.name, token)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error enviando invitación:', error)
    return NextResponse.json(
      { error: error.message ?? 'Error interno' },
      { status: 500 }
    )
  }
}