import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'PROVEEDOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const formData = await req.formData()
  const file     = formData.get('file') as File
  const ordenId  = formData.get('ordenId') as string

  if (!file || !ordenId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const orden = await (prisma as any).workOrder.findUnique({ where: { id: ordenId } })
  if (!orden || orden.providerId !== user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  // Subir a Cloudinary
  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `kotta/${user.orgId}/evidencias` },
      (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error)
          reject(error)
        }
        else resolve(result)
      }
    ).end(buffer)
  })

  // Guardar URL y marcar completada
  await (prisma as any).$transaction([
    (prisma as any).workOrder.update({
      where: { id: ordenId },
      data: {
        afterPhotoUrl: uploadResult.secure_url,
        status:        'COMPLETADA',
        closedAt:      new Date(),
      },
    }),
    (prisma as any).ticket.update({
      where: { id: orden.ticketId },
      data:  { status: 'RESUELTO', resolvedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true, url: uploadResult.secure_url })
}