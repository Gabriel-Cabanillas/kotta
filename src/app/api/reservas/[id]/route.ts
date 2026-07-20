/**
 * Ruta API para que el administrador apruebe o rechace una reserva de
 * amenidad que está en estado PENDIENTE (amenidades con requiresApproval).
 * Contiene la validacion de que la reserva pertenezca a una amenidad de su
 * propia organizacion antes de modificar el estado.
 * Se relaciona con getSession, prisma y el panel de Solicitudes de reserva
 * dentro de la seccion de Amenidades del admin.
 * Existe para cerrar el flujo de aprobacion manual definido por el admin al
 * configurar una amenidad con requiresApproval activo.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import type { ReservationStatus } from '@prisma/client'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { action } = await req.json()
  if (action !== 'aprobar' && action !== 'rechazar') {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  const reserva = await prisma.amenityReservation.findUnique({
    where: { id: params.id },
    include: { amenity: true },
  })
  if (!reserva || reserva.amenity.orgId !== admin.orgId) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  if (reserva.status !== 'PENDIENTE') {
    return NextResponse.json({ error: 'Esta reserva ya fue procesada' }, { status: 409 })
  }

  const nuevoStatus = (action === 'aprobar' ? 'CONFIRMADA' : 'CANCELADA') as ReservationStatus

  const actualizada = await prisma.amenityReservation.update({
    where: { id: params.id },
    data: { status: nuevoStatus },
  })

  return NextResponse.json({ ok: true, reserva: actualizada })
}