/**
 * Ruta API para actualizar ordenes de trabajo en Kotta.
 * Contiene la funcionalidad administrativa que modifica estado, costo, notas y
 * cierre de una orden, sincronizando tambien el estado del ticket relacionado.
 * Se relaciona con getSession, prisma, tickets y los paneles administrativos de
 * ordenes o proveedores.
 * Existe para mantener consistente el flujo ticket-orden dentro de cada coto,
 * validando que el ADMIN opere solo ordenes de su organizacion.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN' || !admin.orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { ordenId, status, cost, notes, closedAt } = await req.json()

  if (typeof ordenId !== 'string' || !ordenId) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const orden = await prisma.workOrder.findFirst({ where: { id: ordenId, orgId: admin.orgId, provider: { orgId: admin.orgId, role: 'PROVEEDOR' }, ticket: { orgId: admin.orgId, reportedBy: { orgId: admin.orgId } } } })
  if (!orden) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id: ordenId, orgId: admin.orgId },
      data: { status, cost: cost ? Number(cost) : null, notes: notes || null, closedAt: closedAt ? new Date(closedAt) : null },
    })
    if (status === 'COMPLETADA') await tx.ticket.update({ where: { id: orden.ticketId, orgId: admin.orgId }, data: { status: 'RESUELTO', resolvedAt: new Date() } })
    if (status === 'CANCELADA')  await tx.ticket.update({ where: { id: orden.ticketId, orgId: admin.orgId }, data: { status: 'EN_REVISION' } })
  })

  return NextResponse.json({ ok: true })
}
