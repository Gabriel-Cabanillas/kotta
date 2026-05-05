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