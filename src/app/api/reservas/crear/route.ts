/**
 * Ruta API para crear reservas de amenidades dentro de Kotta.
 * Contiene la funcionalidad que permite a un VECINO registrar una reserva,
 * validando que la amenidad exista, esté activa, pertenezca a su coto, que la
 * fecha caiga en un día habilitado, que el horario esté dentro del rango de la
 * amenidad, que no se traslape con otra reserva y definiendo el estado inicial
 * (PENDIENTE o CONFIRMADA) según si la amenidad requiere aprobación del admin.
 * Se relaciona con getSession, prisma y las páginas de reservas del vecino.
 * Existe para centralizar la operación de reservas como parte del dominio
 * multi-rol del SaaS, validando que solo residentes autenticados puedan crearla.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import type { ReservationStatus } from '@prisma/client'

function minutosDesde(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'VECINO' || !user.orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { amenityId, date, startTime, endTime, notes } = await req.json()

  if (typeof amenityId !== 'string' || !amenityId || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof startTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
      typeof endTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  return prisma.$transaction(async (tx) => {
    // Bloquear la amenidad también cuando aún no tiene reservas. Todas las
    // creaciones de esa amenidad esperan este lock hasta commit/rollback.
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "amenities"
      WHERE "id" = ${amenityId} AND "orgId" = ${user.orgId}
      FOR UPDATE
    `
    if (locked.length === 0) return NextResponse.json({ error: 'Amenidad no encontrada' }, { status: 404 })

    const amenidad = await tx.amenity.findUnique({ where: { id: amenityId } })
    if (!amenidad || amenidad.orgId !== user.orgId) {
      return NextResponse.json({ error: 'Amenidad no encontrada' }, { status: 404 })
    }
    if (amenidad.status !== 'ACTIVA') {
      return NextResponse.json({ error: 'Esta amenidad no está disponible actualmente' }, { status: 400 })
    }

    // Día de la semana válido (0=domingo ... 6=sábado), calculado en horario local
    // para evitar el corrimiento de un día que da `new Date(date).getDay()` con UTC.
    const [y, m, d] = date.split('-').map(Number)
    const fechaLocal = new Date(y, m - 1, d)
    if (fechaLocal.getFullYear() !== y || fechaLocal.getMonth() !== m - 1 || fechaLocal.getDate() !== d) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
    }
    const diaSemana  = fechaLocal.getDay()

    if (!amenidad.weekDays.includes(diaSemana)) {
      return NextResponse.json({ error: 'La amenidad no está disponible ese día' }, { status: 400 })
    }
    if (fechaLocal < new Date(new Date().toDateString())) {
      return NextResponse.json({ error: 'No se puede reservar una fecha pasada' }, { status: 400 })
    }

    // Horario dentro del rango permitido por la amenidad
    const inicioMin = minutosDesde(startTime)
    const finMin     = minutosDesde(endTime)
    if (finMin <= inicioMin) {
      return NextResponse.json({ error: 'La hora de fin debe ser posterior a la de inicio' }, { status: 400 })
    }
    if (inicioMin < minutosDesde(amenidad.startTime) || finMin > minutosDesde(amenidad.endTime)) {
      return NextResponse.json({ error: 'El horario debe estar dentro del rango disponible de la amenidad' }, { status: 400 })
    }

    // Traslape con otra reserva activa de la misma amenidad y fecha
    const reservasDelDia = await tx.amenityReservation.findMany({
      where: {
        amenityId,
        date: fechaLocal,
        status: { in: ['PENDIENTE', 'CONFIRMADA'] },
      },
    })
    const hayTraslape = reservasDelDia.some((r) => {
      const otroInicio = minutosDesde(r.startTime)
      const otroFin     = minutosDesde(r.endTime)
      return inicioMin < otroFin && finMin > otroInicio
    })
    if (hayTraslape) {
      return NextResponse.json({ error: 'Ese horario ya está reservado, elige otro' }, { status: 409 })
    }

    const status = (amenidad.requiresApproval ? 'PENDIENTE' : 'CONFIRMADA') as ReservationStatus

    const reserva = await tx.amenityReservation.create({
      data: { amenityId, userId: user.id, date: fechaLocal, startTime, endTime, notes: notes || null, status },
    })

    return NextResponse.json({ ok: true, reserva, status })
    // Cada consulta posterior al lock ve las reservas que acaba de confirmar
    // la transacción anterior, aunque esta solicitud haya empezado antes.
  }, { isolationLevel: 'ReadCommitted', maxWait: 10000, timeout: 10000 })
}
