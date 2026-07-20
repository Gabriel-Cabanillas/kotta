/**
 * Ruta API para crear amenidades en Kotta.
 * Contiene la funcionalidad administrativa que da de alta una nueva amenidad
 * (nombre, horario, capacidad, aprobación, costo, imagen) dentro del coto del
 * admin autenticado. Sube la imagen a Cloudinary igual que /api/tickets/crear.
 * Se relaciona con getSession, prisma, Cloudinary y el panel administrativo de
 * amenidades.
 * Existe para que el ADMIN registre amenidades reservables solo dentro de su
 * propia organización.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const formData = await req.formData()

  const name             = formData.get('name') as string
  const description      = formData.get('description') as string | null
  const capacity          = formData.get('capacity') as string | null
  const durationMinutes   = formData.get('durationMinutes') as string | null
  const startTime          = formData.get('startTime') as string
  const endTime             = formData.get('endTime') as string
  const weekDaysRaw       = formData.get('weekDays') as string | null
  const requiresApproval  = formData.get('requiresApproval') === 'true'
  const extraCost         = formData.get('extraCost') as string | null
  const rules             = formData.get('rules') as string | null
  const imagen            = formData.get('imagen') as File | null

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }
  if (!startTime || !endTime) {
    return NextResponse.json({ error: 'El horario es obligatorio' }, { status: 400 })
  }

  let weekDays = [0, 1, 2, 3, 4, 5, 6]
  if (weekDaysRaw) {
    try {
      const parsed = JSON.parse(weekDaysRaw)
      if (Array.isArray(parsed) && parsed.length > 0) weekDays = parsed
    } catch {
      // usa el default si viene mal formado
    }
  }

  // Subir imagen si viene
  let imageUrl: string | null = null
  if (imagen && imagen.size > 0) {
    try {
      const bytes  = await imagen.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder:         `kotta/${admin.orgId}/amenidades`,
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

      imageUrl = uploadResult.secure_url
    } catch (err) {
      console.error('Error subiendo imagen:', err)
      // Continuamos sin imagen si falla
    }
  }

  const amenidad = await prisma.amenity.create({
    data: {
      orgId: admin.orgId,
      name: name.trim(),
      description: description || null,
      imageUrl,
      capacity: capacity ? Number(capacity) : null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 60,
      startTime,
      endTime,
      weekDays,
      requiresApproval,
      extraCost: extraCost ? Number(extraCost) : null,
      rules: rules || null,
    },
  })

  return NextResponse.json({ ok: true, amenidad })
}