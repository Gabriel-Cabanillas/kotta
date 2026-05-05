import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'VECINO') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { title, description, category, orgId } = await req.json()
  if (user.orgId !== orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const count = await prisma.ticket.count({ where: { orgId } })
  const folio = String(count + 1).padStart(4, '0')

  await prisma.ticket.create({ data: { orgId, folio, title, description, category, status: 'NUEVO', reportedById: user.id } })
  return NextResponse.json({ ok: true })
}