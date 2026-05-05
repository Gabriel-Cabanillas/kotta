import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { enviarInvitacion } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { name, email, phone, houseNumber, role, orgId } = await req.json()

  if (admin.orgId !== orgId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const existing = await (prisma as any).user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 400 })
  }

  const org = await (prisma as any).organization.findUnique({ where: { id: orgId } })

  const tempPassword = await bcrypt.hash(randomBytes(16).toString('hex'), 12)

  await (prisma as any).user.create({
    data: {
      email,
      password:    tempPassword,
      name,
      phone:       phone || null,
      houseNumber: houseNumber || null,
      role,
      orgId,
      isActive:    false,
    },
  })

  const token  = randomBytes(32).toString('hex')
  const expira = new Date(Date.now() + 48 * 60 * 60 * 1000)

  await (prisma as any).verificationCode.create({
    data: { email, code: token, type: 'INVITACION', expiresAt: expira },
  })

  await enviarInvitacion(email, name, org.name, token)

  return NextResponse.json({ ok: true })
}