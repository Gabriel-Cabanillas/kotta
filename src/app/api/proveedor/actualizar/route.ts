/**
 * Ruta API para que un proveedor actualice una orden asignada en Kotta.
 * Contiene la funcionalidad que permite cambiar el estado de una orden cuando
 * pertenece al proveedor autenticado, y capturar el precio cotizado junto con
 * su justificación en el momento en que la orden se marca como iniciada.
 * Se relaciona con getSession, prisma y el panel del proveedor.
 * Existe para separar las acciones del rol PROVEEDOR dentro del dominio de
 * ordenes, validando que solo pueda modificar sus propias asignaciones.
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'PROVEEDOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { ordenId, status, cost, costNote } = await req.json()

  const orden = await (prisma as any).workOrder.findUnique({ where: { id: ordenId } })
  if (!orden || orden.providerId !== user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  // El precio y su justificación solo se capturan (y son obligatorios) en el
  // momento en que la orden pasa de PENDIENTE a EN_PROCESO.
  const definiendoPrecio = orden.status === 'PENDIENTE' && status === 'EN_PROCESO'
  if (definiendoPrecio) {
    if (cost == null || Number(cost) <= 0) {
      return NextResponse.json({ error: 'El precio es obligatorio' }, { status: 400 })
    }
    if (!costNote || !String(costNote).trim()) {
      return NextResponse.json({ error: 'La justificación del precio es obligatoria' }, { status: 400 })
    }
  }

  await (prisma as any).workOrder.update({
    where: { id: ordenId },
    data: {
      status,
      ...(definiendoPrecio
        ? { cost: Number(cost), costNote: String(costNote).trim() }
        : {}),
    },
  })

  return NextResponse.json({ ok: true })
}