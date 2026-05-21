/**
 * Ruta API para crear reservas de amenidades dentro de Kotta.
 * Contiene la funcionalidad que permite a un VECINO registrar una reserva
 * pendiente con fecha, horario y notas opcionales.
 * Se relaciona con getSession, prisma y las paginas de reservas del vecino.
 * Existe para centralizar la operacion de reservas como parte del dominio
 * multi-rol del SaaS, validando que solo residentes autenticados puedan crearla.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'VECINO') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { amenityId, date, startTime, endTime, notes } = await req.json()

  await prisma.amenityReservation.create({
    data: { amenityId, userId: user.id, date: new Date(date), startTime, endTime, notes: notes || null, status: 'PENDIENTE' },
  })
  return NextResponse.json({ ok: true })
}
