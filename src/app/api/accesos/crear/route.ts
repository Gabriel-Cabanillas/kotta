import { NextResponse } from 'next/server'
import type { VisitorType } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_VISITOR_TYPES = new Set<VisitorType>([
  'PROVEEDOR',
  'VISITA',
  'DELIVERY',
  'OTRO',
])

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'GUARDIA') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (!user.orgId) {
    return NextResponse.json({ error: 'Organizacion no encontrada' }, { status: 400 })
  }

  const { visitorName, visitorType, notes } = await req.json()
  const cleanVisitorName = typeof visitorName === 'string' ? visitorName.trim() : ''
  const cleanNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : null

  if (!cleanVisitorName) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  }

  if (!VALID_VISITOR_TYPES.has(visitorType)) {
    return NextResponse.json({ error: 'Tipo de visitante invalido' }, { status: 400 })
  }

  await prisma.accessLog.create({
    data: {
      visitorName: cleanVisitorName,
      visitorType,
      notes: cleanNotes,
      orgId: user.orgId,
      guardId: user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
