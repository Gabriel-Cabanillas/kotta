import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { orgId, name } = await req.json()
  if (admin.orgId !== orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  await prisma.organization.update({ where: { id: orgId }, data: { name } })
  return NextResponse.json({ ok: true })
}