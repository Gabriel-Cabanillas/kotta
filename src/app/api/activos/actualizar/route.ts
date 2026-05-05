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