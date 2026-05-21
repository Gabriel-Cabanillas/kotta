/**
 * Ruta API para asignar tickets a proveedores dentro de Kotta.
 * Contiene la funcionalidad administrativa que crea una orden de trabajo y
 * cambia el ticket a estado ASIGNADO en una transaccion.
 * Se relaciona con getSession, prisma, tickets administrativos y ordenes de
 * trabajo del proveedor.
 * Existe para conectar el dominio de reportes con el dominio de ordenes,
 * validando que solo admins del mismo coto puedan asignar tickets.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { ticketId, providerId } = await req.json()
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket || ticket.orgId !== user.orgId) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })

  await prisma.$transaction([
    prisma.workOrder.create({ data: { orgId: user.orgId!, ticketId, providerId, status: 'PENDIENTE' } }),
    prisma.ticket.update({ where: { id: ticketId }, data: { status: 'ASIGNADO' } }),
  ])
  return NextResponse.json({ ok: true })
}
