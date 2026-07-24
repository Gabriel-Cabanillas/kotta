import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import BitacoraDocument from '@/lib/pdf/BitacoraDocument'
import { VISITOR_LABELS } from '@/lib/constants/visitorTypes'

export const runtime = 'nodejs' // obligatorio, @react-pdf no corre en Edge

function formatTime(value: Date | null) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  })
}

export async function GET(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'GUARDIA') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (!user.orgId) {
    return NextResponse.json({ error: 'Organizacion no encontrada' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get('month') // formato "YYYY-MM"

  let year: number
  let month: number

  if (monthParam) {
    if (!/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json({ error: 'Mes invalido' }, { status: 400 })
    }
    const parts = monthParam.split('-').map(Number)
    year = parts[0]
    month = parts[1]
  } else {
    const now = new Date()
    year = now.getFullYear()
    month = now.getMonth() + 1
  }

  // Parseo manual de fecha (nunca new Date(dateString)) para evitar
  // el corrimiento por UTC. Dia 0 del mes siguiente = ultimo dia del mes actual.
  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

  if (Number.isNaN(startOfMonth.getTime()) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Mes invalido' }, { status: 400 })
  }

  const accessLogs = await prisma.accessLog.findMany({
    where: {
      orgId: user.orgId,
      entryTime: { gte: startOfMonth, lte: endOfMonth },
    },
    orderBy: { entryTime: 'asc' },
    include: {
      guard: { select: { name: true } },
    },
  })

  const rows = accessLogs.map((log) => ({
    date: formatDate(log.entryTime),
    visitorName: log.visitorName,
    visitorTypeLabel: VISITOR_LABELS[log.visitorType] ?? log.visitorType,
    entryTime: formatTime(log.entryTime),
    exitTime: log.exitTime ? formatTime(log.exitTime) : 'Dentro',
    notes: log.notes ?? '—',
    guardName: log.guard?.name ?? '—',
  }))

  const totalDentro = accessLogs.filter((log) => !log.exitTime).length

  const dateLabel = startOfMonth.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  })

  const buffer = await renderToBuffer(
    BitacoraDocument({
      orgName: user.org?.name ?? '',
      dateLabel,
      totalAccesos: accessLogs.length,
      totalDentro,
      rows,
    })
  )

  const filename = `bitacora-${year}-${String(month).padStart(2, '0')}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}