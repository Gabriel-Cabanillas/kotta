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