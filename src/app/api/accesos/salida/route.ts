import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'GUARDIA') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { accessLogId } = await req.json()
  if (typeof accessLogId !== 'string' || !accessLogId) {
    return NextResponse.json({ error: 'Acceso requerido' }, { status: 400 })
  }

  const accessLog = await prisma.accessLog.findUnique({
    where: { id: accessLogId },
  })

  if (!accessLog) {
    return NextResponse.json({ error: 'Acceso no encontrado' }, { status: 404 })
  }

  if (accessLog.orgId !== user.orgId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await prisma.accessLog.update({
    where: { id: accessLogId },
    data: { exitTime: new Date() },
  })

  return NextResponse.json({ ok: true })
}
