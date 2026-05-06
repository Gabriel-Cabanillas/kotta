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
  if (!user || user.role !== 'VECINO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const formData    = await req.formData()
  const title       = formData.get('title')       as string
  const description = formData.get('description') as string
  const category    = formData.get('category')    as string
  const orgId       = formData.get('orgId')       as string
  const foto        = formData.get('foto')        as File | null

  if (!title || !description || !orgId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (user.orgId !== orgId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Subir foto del "Antes" si viene
  let photoUrl: string | null = null
  if (foto && foto.size > 0) {
    try {
      const bytes  = await foto.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder:         `kotta/${orgId}/tickets`,
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary error:', error)
              reject(error)
            } else {
              resolve(result)
            }
          }
        ).end(buffer)
      })

      photoUrl = uploadResult.secure_url
    } catch (err) {
      console.error('Error subiendo foto:', err)
      // Continuamos sin foto si falla
    }
  }

  // Generar folio único por organización
  const count = await (prisma as any).ticket.count({ where: { orgId } })
  const folio = String(count + 1).padStart(4, '0')

  await (prisma as any).ticket.create({
    data: {
      orgId,
      folio,
      title,
      description,
      category:     category || 'OTRO',
      status:       'NUEVO',
      reportedById: user.id,
      photoUrl,
    },
  })

  return NextResponse.json({ ok: true })
}