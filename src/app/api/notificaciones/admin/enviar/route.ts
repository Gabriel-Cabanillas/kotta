import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notifications/notification-service'
import { NotificationPolicyError } from '@/lib/notifications/policy'

const ALLOWED_ROLES = new Set(['VECINO', 'PROVEEDOR', 'GUARDIA'])

function idempotencyKey(value: unknown) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(value)) {
    throw new NotificationPolicyError('La solicitud no tiene una clave de envío válida.')
  }
  return value
}

export async function POST(request: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN' || !admin.orgId) {
    return Response.json({ error: 'No autorizado.' }, { status: 403 })
  }

  try {
    const body = await request.json() as Record<string, unknown>
    const audience = body.audience
    let recipients: { id: string }[] = []

    if (audience === 'ROLE') {
      const role = typeof body.role === 'string' ? body.role : ''
      if (!ALLOWED_ROLES.has(role)) throw new NotificationPolicyError('Selecciona un grupo de destinatarios válido.')
      recipients = await prisma.user.findMany({
        where: { orgId: admin.orgId, role: role as 'VECINO' | 'PROVEEDOR' | 'GUARDIA', isActive: true },
        select: { id: true },
      })
    } else if (audience === 'USER') {
      const recipientUserId = typeof body.recipientUserId === 'string' ? body.recipientUserId : ''
      recipients = await prisma.user.findMany({
        where: {
          id: recipientUserId,
          orgId: admin.orgId,
          role: { in: ['VECINO', 'PROVEEDOR', 'GUARDIA'] },
          isActive: true,
        },
        select: { id: true },
      })
      if (recipients.length !== 1) throw new NotificationPolicyError('El usuario seleccionado no es un destinatario válido.')
    } else {
      throw new NotificationPolicyError('Selecciona cómo se enviará el comunicado.')
    }

    if (recipients.length === 0) throw new NotificationPolicyError('No hay usuarios activos en el grupo seleccionado.')

    const requestKey = idempotencyKey(body.idempotencyKey)
    const result = await NotificationService.create({
      recipientUserIds: recipients.map((recipient) => recipient.id),
      actorUserId: admin.id,
      scope: { kind: 'ADMIN_TO_ORGANIZATION', organizationId: admin.orgId },
      origin: 'MANUAL',
      type: 'ADMIN_COMUNICADO',
      title: String(body.title ?? ''),
      message: String(body.message ?? ''),
      deduplicationKey: `manual:admin:${admin.id}:${requestKey}`,
    })

    return Response.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof NotificationPolicyError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error('No fue posible crear el comunicado ADMIN.', error instanceof Error ? error.name : 'UnknownError')
    return Response.json({ error: 'No fue posible enviar el comunicado.' }, { status: 500 })
  }
}
