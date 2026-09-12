/**
 * Ruta API para editar y eliminar amenidades en Kotta.
 * Contiene la funcionalidad administrativa que actualiza los datos de una
 * amenidad (incluyendo su estado e imagen, subida a Cloudinary) o la elimina
 * si no tiene reservaciones asociadas.
 * Se relaciona con getSession, prisma, Cloudinary y el panel administrativo de
 * amenidades.
 * Existe para que el ADMIN mantenga el catálogo de amenidades de su coto,
 * validando que solo opere amenidades de su propia organización.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { uploadImage, imageUploadErrorResponse } from '@/lib/cloudinary-upload'
import type { AmenityStatus } from '@prisma/client'

async function getOwnedAmenity(id: string, orgId: string) {
  const amenidad = await prisma.amenity.findUnique({ where: { id } })
  if (!amenidad || amenidad.orgId !== orgId) return null
  return amenidad
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN' || !admin.orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const amenidad = await getOwnedAmenity(params.id, admin.orgId)
  if (!amenidad) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const formData = await req.formData()

  const name              = formData.get('name') as string | null
  const description       = formData.get('description') as string | null
  const capacity          = formData.get('capacity') as string | null
  const durationMinutes   = formData.get('durationMinutes') as string | null
  const startTime         = formData.get('startTime') as string | null
  const endTime            = formData.get('endTime') as string | null
  const weekDaysRaw       = formData.get('weekDays') as string | null
  const requiresApprovalRaw = formData.get('requiresApproval') as string | null
  const extraCost         = formData.get('extraCost') as string | null
  const rules             = formData.get('rules') as string | null
  const status             = formData.get('status') as string | null
  const imagen            = formData.get('imagen')
  const removeImage       = formData.get('removeImage') === 'true'

  // Imagen: solo se toca si suben una nueva o piden quitarla explícitamente
  let imageUrl: string | null | undefined = undefined
  if (imagen !== null) {
    try {
      imageUrl = await uploadImage(imagen, admin.orgId, 'amenidades')
    } catch (err) {
      return imageUploadErrorResponse(err)
    }
  } else if (removeImage) {
    imageUrl = null
  }

  let weekDays: number[] | undefined
  if (weekDaysRaw) {
    try {
      const parsed = JSON.parse(weekDaysRaw)
      if (Array.isArray(parsed)) weekDays = parsed
    } catch {
      // ignora si viene mal formado, no se actualiza este campo
    }
  }

  const updated = await prisma.amenity.update({
    where: { id: params.id },
    data: {
      ...(name !== null && { name: name.trim() }),
      ...(description !== null && { description: description || null }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(capacity !== null && { capacity: capacity ? Number(capacity) : null }),
      ...(durationMinutes !== null && { durationMinutes: Number(durationMinutes) }),
      ...(startTime !== null && { startTime }),
      ...(endTime !== null && { endTime }),
      ...(weekDays !== undefined && { weekDays }),
      ...(requiresApprovalRaw !== null && { requiresApproval: requiresApprovalRaw === 'true' }),
      ...(extraCost !== null && { extraCost: extraCost ? Number(extraCost) : null }),
      ...(rules !== null && { rules: rules || null }),
      ...(status !== null && { status: status as AmenityStatus }),
    },
  })

  return NextResponse.json({ ok: true, amenidad: updated })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const amenidad = await getOwnedAmenity(params.id, admin.orgId)
  if (!amenidad) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const reservaciones = await prisma.amenityReservation.count({ where: { amenityId: params.id } })
  if (reservaciones > 0) {
    return NextResponse.json(
      { error: 'Esta amenidad tiene reservaciones registradas. Desactívala en vez de eliminarla.' },
      { status: 409 },
    )
  }

  await prisma.amenity.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
