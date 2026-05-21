/**
 * Ruta API para crear activos del condominio en Kotta.
 * Contiene la funcionalidad administrativa que registra un activo con categoria,
 * estado, ubicacion, descripcion y fechas de mantenimiento opcionales.
 * Se relaciona con getSession, prisma y las pantallas de administracion de
 * activos.
 * Existe para alimentar el inventario operativo de cada coto, validando que el
 * ADMIN solo cree activos dentro de su propia organizacion.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { name, category, status, location, description, lastMaintenance, nextMaintenance, orgId } = await req.json()

  if (admin.orgId !== orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  await prisma.asset.create({
    data: { orgId, name, category, status, location: location || null, description: description || null,
      lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
      nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null },
  })

  return NextResponse.json({ ok: true })
}
