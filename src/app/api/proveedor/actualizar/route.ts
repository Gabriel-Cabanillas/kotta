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