import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notifications/notification-service'
import { NotificationPolicyError } from '@/lib/notifications/policy'

function idempotencyKey(value: unknown) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(value)) {
    throw new NotificationPolicyError('La solicitud no tiene una clave de envío válida.')
  }
  return value
}

export async function POST(request: Request, { params }: { params: { organizationId: string } }) {
  const staff = await getSession()
  if (!staff || staff.role !== 'KOTTA_STAFF') {
    return Response.json({ error: 'No autorizado.' }, { status: 403 })
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: params.organizationId },
      select: { id: true },
    })
    if (!organization) return Response.json({ error: 'Condominio no encontrado.' }, { status: 404 })

    const body = await request.json() as Record<string, unknown>
    const requestedIds = Array.isArray(body.recipientUserIds)
      ? Array.from(new Set(body.recipientUserIds.filter((id): id is string => typeof id === 'string' && id.length > 0)))
      : []
    if (requestedIds.length === 0 || requestedIds.length > 25) {
      throw new NotificationPolicyError('Selecciona entre 1 y 25 administradores.')
    }

    const admins = await prisma.user.findMany({
      where: {
        id: { in: requestedIds },
        orgId: organization.id,
        role: 'ADMIN',
        isActive: true,
      },
      select: { id: true },
    })
    if (admins.length !== requestedIds.length) {
      throw new NotificationPolicyError('Solo puedes seleccionar administradores activos de este condominio.')
    }

    const requestKey = idempotencyKey(body.idempotencyKey)
    const result = await NotificationService.create({
      recipientUserIds: admins.map((admin) => admin.id),
      actorUserId: staff.id,
      scope: { kind: 'KOTTA_STAFF_TO_ADMIN', organizationId: organization.id },
      origin: 'MANUAL',
      type: 'KOTTA_COMERCIAL',
      title: String(body.title ?? ''),
      message: String(body.message ?? ''),
      deduplicationKey: `manual:staff:${staff.id}:${requestKey}`,
    })

    return Response.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof NotificationPolicyError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error('No fue posible crear la notificación KOTTA_STAFF.', error instanceof Error ? error.name : 'UnknownError')
    return Response.json({ error: 'No fue posible enviar la notificación.' }, { status: 500 })
  }
}
