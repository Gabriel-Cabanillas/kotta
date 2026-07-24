/**
 * Ruta API que genera el PDF de reporte mensual de actividad del proveedor.
 * Consulta las ordenes COMPLETADAS del proveedor autenticado dentro del
 * mes/año solicitado y arma un PDF descargable con el resumen e ingresos.
 * Se relaciona con getSession, prisma y ReporteProveedorDocument.
 * Existe para que el proveedor tenga evidencia y control de su actividad
 * mensual dentro de un coto de Kotta.
 */
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReporteProveedorDocument } from '@/lib/pdf/ReporteProveedorDocument'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'PROVEEDOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const month = Number(searchParams.get('month'))
  const year  = Number(searchParams.get('year'))

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Periodo inválido' }, { status: 400 })
  }

  const desde = new Date(year, month - 1, 1)
  const hasta = new Date(year, month, 1) // primer día del mes siguiente (límite exclusivo)

  const ordenes = await (prisma as any).workOrder.findMany({
    where: {
      providerId: user.id,
      status:     'COMPLETADA',
      createdAt:  { gte: desde, lt: hasta },
    },
    orderBy: { createdAt: 'asc' },
    include: { ticket: true },
  })

  const totalIngreso = ordenes.reduce(
    (acc: number, o: any) => acc + (o.cost ? Number(o.cost) : 0),
    0
  )

  const pdfBuffer = await renderToBuffer(
    ReporteProveedorDocument({
      proveedor: user.name,
      orgName:   user.org?.name ?? '',
      month,
      year,
      ordenes: ordenes.map((o: any) => ({
        folio: o.ticket.folio,
        title: o.ticket.title,
        cost:  o.cost ? Number(o.cost) : 0,
        date:  o.createdAt,
      })),
      totalIngreso,
    })
  )

  const nombreArchivo = `reporte-kotta-${year}-${String(month).padStart(2, '0')}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    },
  })
}