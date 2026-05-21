/**
 * Ruta API para que un proveedor actualice una orden asignada en Kotta.
 * Contiene la funcionalidad que permite cambiar el estado de una orden cuando
 * pertenece al proveedor autenticado.
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

  const { ordenId, status } = await req.json()

  const orden = await (prisma as any).workOrder.findUnique({ where: { id: ordenId } })
  if (!orden || orden.providerId !== user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await (prisma as any).workOrder.update({
    where: { id: ordenId },
    data:  { status },
  })

  return NextResponse.json({ ok: true })
}
