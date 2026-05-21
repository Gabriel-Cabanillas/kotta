/**
 * Ruta API para actualizar activos del condominio en Kotta.
 * Contiene la funcionalidad administrativa que modifica datos de inventario,
 * estado, ubicacion, descripcion y fechas de mantenimiento.
 * Se relaciona con getSession, prisma y las pantallas de activos del admin.
 * Existe para mantener el dominio de activos dentro del coto correcto,
 * validando que el ADMIN pertenezca a la misma organizacion del activo.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { activoId, name, category, status, location, description, lastMaintenance, nextMaintenance } = await req.json()

  const activo = await prisma.asset.findUnique({ where: { id: activoId } })
  if (!activo || activo.orgId !== admin.orgId) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.asset.update({
    where: { id: activoId },
    data: { name, category, status, location: location || null, description: description || null,
      lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
      nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null },
  })

  return NextResponse.json({ ok: true })
}
