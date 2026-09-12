/**
 * Ruta API para subir evidencia de una orden de proveedor en Kotta.
 * Contiene la funcionalidad que recibe una imagen, la sube a Cloudinary, marca
 * la orden como COMPLETADA y resuelve el ticket asociado.
 * Se relaciona con getSession, prisma, Cloudinary y el panel del proveedor.
 * Existe para cerrar el flujo operativo de atencion con evidencia visual,
 * validando que el proveedor autenticado sea el asignado a la orden.
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImage, imageUploadErrorResponse } from '@/lib/cloudinary-upload'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'PROVEEDOR' || !user.orgId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const formData = await req.formData()
  const file     = formData.get('file')
  const ordenId  = formData.get('ordenId') as string

  if (!file || !ordenId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (typeof ordenId !== 'string') return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const orden = await prisma.workOrder.findFirst({ where: { id: ordenId, orgId: user.orgId, providerId: user.id, ticket: { orgId: user.orgId, reportedBy: { orgId: user.orgId } } } })
  if (!orden) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  let imageUrl: string
  try {
    imageUrl = await uploadImage(file, user.orgId, 'evidencias')
  } catch (error) {
    return imageUploadErrorResponse(error)
  }

  // Guardar URL y marcar completada
  await (prisma as any).$transaction([
    (prisma as any).workOrder.update({
      where: { id: ordenId, orgId: user.orgId, providerId: user.id },
      data: {
        afterPhotoUrl: imageUrl,
        status:        'COMPLETADA',
        closedAt:      new Date(),
      },
    }),
    (prisma as any).ticket.update({
      where: { id: orden.ticketId, orgId: user.orgId },
      data:  { status: 'RESUELTO', resolvedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true, url: imageUrl })
}
