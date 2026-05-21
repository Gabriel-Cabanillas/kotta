/**
 * Ruta API para actualizar el estado de un pago en Kotta.
 * Contiene la funcionalidad administrativa que cambia el status y la fecha de
 * pago de un registro existente.
 * Se relaciona con getSession, prisma y las pantallas de cobranza del admin.
 * Existe para controlar cambios financieros por organizacion, validando que el
 * pago pertenezca al mismo coto del ADMIN autenticado.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { pagoId, status, paidAt } = await req.json()

  const pago = await prisma.payment.findUnique({ where: { id: pagoId } })
  if (!pago || pago.orgId !== admin.orgId) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.payment.update({ where: { id: pagoId }, data: { status, paidAt: paidAt ? new Date(paidAt) : null } })
  return NextResponse.json({ ok: true })
}
