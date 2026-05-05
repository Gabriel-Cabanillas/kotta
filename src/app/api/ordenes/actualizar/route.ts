import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { ordenId, status, cost, notes, closedAt } = await req.json()

  const orden = await prisma.workOrder.findUnique({ where: { id: ordenId } })
  if (!orden || orden.orgId !== admin.orgId) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id: ordenId },
      data: { status, cost: cost ? Number(cost) : null, notes: notes || null, closedAt: closedAt ? new Date(closedAt) : null },
    })
    if (status === 'COMPLETADA') await tx.ticket.update({ where: { id: orden.ticketId }, data: { status: 'RESUELTO', resolvedAt: new Date() } })
    if (status === 'CANCELADA')  await tx.ticket.update({ where: { id: orden.ticketId }, data: { status: 'EN_REVISION' } })
  })

  return NextResponse.json({ ok: true })
}