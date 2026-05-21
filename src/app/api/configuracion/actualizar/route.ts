/**
 * Ruta API para actualizar configuracion basica de una organizacion en Kotta.
 * Contiene la funcionalidad administrativa que modifica el nombre del coto u
 * organizacion asociada al admin autenticado.
 * Se relaciona con getSession, prisma y las pantallas de configuracion del
 * panel administrativo.
 * Existe para encapsular cambios de configuracion por coto, validando que el
 * ADMIN solo actualice la organizacion a la que pertenece.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { orgId, name } = await req.json()
  if (admin.orgId !== orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  await prisma.organization.update({ where: { id: orgId }, data: { name } })
  return NextResponse.json({ ok: true })
}
