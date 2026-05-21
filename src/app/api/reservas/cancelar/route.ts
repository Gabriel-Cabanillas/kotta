/**
 * Ruta API para cancelar reservas de amenidades en Kotta.
 * Contiene la funcionalidad que marca una reserva como CANCELADA cuando la
 * solicita el mismo usuario que la creo.
 * Se relaciona con getSession, prisma y las vistas de reservas del vecino.
 * Existe para proteger el flujo de cancelacion del dominio de reservas,
 * asegurando que cada vecino solo pueda cancelar sus propias reservas.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { reservaId } = await req.json()
  const reserva = await prisma.amenityReservation.findUnique({ where: { id: reservaId } })
  if (!reserva || reserva.userId !== user.id) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.amenityReservation.update({ where: { id: reservaId }, data: { status: 'CANCELADA' } })
  return NextResponse.json({ ok: true })
}
