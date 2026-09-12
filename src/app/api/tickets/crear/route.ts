/**
 * Ruta API para crear tickets de mantenimiento o reporte dentro de Kotta.
 * Contiene la funcionalidad que recibe datos del reporte, valida pertenencia al
 * coto, sube una foto opcional a Cloudinary y genera el folio del ticket.
 * Se relaciona con getSession, prisma, Cloudinary y las paginas de tickets del
 * vecino que consumen este endpoint.
 * Existe para concentrar la entrada de incidencias del dominio operativo del
 * SaaS, permitiendo que solo vecinos del coto creen reportes en su organizacion.
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImage, imageUploadErrorResponse } from '@/lib/cloudinary-upload'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'VECINO' || !user.orgId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const formData    = await req.formData()
  const title       = formData.get('title')       as string
  const description = formData.get('description') as string
  const category    = formData.get('category')    as string
  const requestedOrgId = formData.get('orgId')
  const orgId       = user.orgId
  const foto        = formData.get('foto')

  if (!title || !description || !requestedOrgId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (orgId !== requestedOrgId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Subir foto del "Antes" si viene
  let photoUrl: string | null = null
  if (foto !== null) {
    try {
      photoUrl = await uploadImage(foto, orgId, 'tickets')
    } catch (err) {
      return imageUploadErrorResponse(err)
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
