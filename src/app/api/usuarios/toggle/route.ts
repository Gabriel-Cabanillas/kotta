import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { userId: targetUserId, isActive } = await req.json()
  const target = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!target || target.orgId !== admin.orgId) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  await prisma.user.update({ where: { id: targetUserId }, data: { isActive } })
  return NextResponse.json({ ok: true })
}