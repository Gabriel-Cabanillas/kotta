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

function minutosDesde(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN' || !admin.orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { action } = await req.json()
  if (action !== 'aprobar' && action !== 'rechazar') {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  return prisma.$transaction(async (tx) => {
    // El mismo lock de creación: primero amenidad, después reserva. La lectura
    // siguiente ve los cambios confirmados mientras esta solicitud esperaba.
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT a."id" FROM "amenities" a
      JOIN "amenity_reservations" r ON r."amenityId" = a."id"
      WHERE r."id" = ${params.id} AND a."orgId" = ${admin.orgId}
      FOR UPDATE OF a
    `
    if (locked.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const reserva = await tx.amenityReservation.findUnique({
      where: { id: params.id }, include: { amenity: true },
    })
    if (!reserva || reserva.amenity.orgId !== admin.orgId || reserva.amenityId !== locked[0].id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }
    if (reserva.status !== 'PENDIENTE') {
      return NextResponse.json({ error: 'Esta reserva ya fue procesada' }, { status: 409 })
    }

    if (action === 'aprobar') {
      const otras = await tx.amenityReservation.findMany({
        where: { id: { not: reserva.id }, amenityId: reserva.amenityId, date: reserva.date,
          status: { in: ['PENDIENTE', 'CONFIRMADA'] } },
        select: { startTime: true, endTime: true },
      })
      const inicio = minutosDesde(reserva.startTime)
      const fin = minutosDesde(reserva.endTime)
      if (otras.some((otra) => inicio < minutosDesde(otra.endTime) && fin > minutosDesde(otra.startTime))) {
        return NextResponse.json({ error: 'Ese horario ya está reservado, resuelve el conflicto antes de aprobar' }, { status: 409 })
      }
    }

    const nuevoStatus = (action === 'aprobar' ? 'CONFIRMADA' : 'CANCELADA') as ReservationStatus
    // Cancelación no necesita bloquear la amenidad. Este predicado se evalúa
    // al actualizar la fila e impide revivirla si se canceló tras la lectura.
    const changed = await tx.amenityReservation.updateMany({
      where: { id: reserva.id, amenityId: reserva.amenityId, status: 'PENDIENTE' },
      data: { status: nuevoStatus },
    })
    if (changed.count !== 1) {
      return NextResponse.json({ error: 'Esta reserva ya fue procesada' }, { status: 409 })
    }
    const actualizada = await tx.amenityReservation.findUniqueOrThrow({ where: { id: reserva.id } })

    return NextResponse.json({ ok: true, reserva: actualizada })
  }, { isolationLevel: 'ReadCommitted', maxWait: 10000, timeout: 10000 })
}
