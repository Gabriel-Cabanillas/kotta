import { prisma } from '@/lib/prisma'
import { isNotificationEmailEnabled, sendNotificationEmail } from './email-channel'
import {
  normalizeInternalNotificationHref,
  normalizeNotificationContent,
  NotificationPolicyError,
  validateNotificationHrefOrganization,
  validateNotificationRecipients,
  type NotificationParty,
  type NotificationScope,
} from './policy'
import type { NotificationListResponse } from './types'

export type CreateNotificationsInput = {
  recipientUserIds: string[]
  actorUserId?: string | null
  scope: NotificationScope
  origin: 'MANUAL' | 'SYSTEM'
  type: string
  title: string
  message: string
  href?: string | null
  entity?: { type: string; id: string } | null
  cargoId?: string | null
  deduplicationKey: string
  email?: boolean
}

export type NotificationCreationResult = {
  recipients: number
  created: number
  duplicates: number
  email: { sent: number; failed: number; disabled: number }
}

function organizationIdFromScope(scope: NotificationScope) {
  return scope.organizationId ?? null
}

function validateTechnicalFields(input: CreateNotificationsInput) {
  const type = input.type.trim()
  const deduplicationKey = input.deduplicationKey.trim()
  if (!/^[A-Z0-9_:-]{2,80}$/.test(type)) throw new NotificationPolicyError('El tipo de notificación no es válido.')
  if (deduplicationKey.length < 8 || deduplicationKey.length > 180) {
    throw new NotificationPolicyError('La clave de idempotencia de la notificación no es válida.')
  }
  if (input.entity && (
    !input.entity.type.trim()
    || input.entity.type.length > 80
    || !input.entity.id.trim()
    || input.entity.id.length > 200
  )) {
    throw new NotificationPolicyError('La entidad relacionada no es válida.')
  }
  return { type, deduplicationKey }
}

export const NotificationService = {
  async create(input: CreateNotificationsInput): Promise<NotificationCreationResult> {
    const recipientUserIds = Array.from(new Set(input.recipientUserIds.filter(Boolean)))
    const { title, message } = normalizeNotificationContent(input.title, input.message)
    const href = normalizeInternalNotificationHref(input.href)
    const { type, deduplicationKey } = validateTechnicalFields(input)
    const organizationId = organizationIdFromScope(input.scope)

    const [recipients, actor, organization] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: recipientUserIds } },
        select: { id: true, name: true, email: true, role: true, orgId: true, isActive: true },
      }),
      input.actorUserId
        ? prisma.user.findUnique({
            where: { id: input.actorUserId },
            select: { id: true, role: true, orgId: true },
          })
        : Promise.resolve(null),
      organizationId
        ? prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true, slug: true } })
        : Promise.resolve(null),
    ])

    if (recipients.length !== recipientUserIds.length) {
      throw new NotificationPolicyError('Uno o más destinatarios no existen.')
    }
    if (input.scope.kind !== 'SYSTEM' && recipients.some((recipient) => !recipient.isActive)) {
      throw new NotificationPolicyError('Solo puedes notificar a usuarios activos.')
    }
    if (organizationId && !organization) {
      throw new NotificationPolicyError('La organización de la notificación no existe.')
    }
    if (organization) validateNotificationHrefOrganization(href, organization.slug)

    validateNotificationRecipients(
      input.scope,
      actor as NotificationParty | null,
      recipients as NotificationParty[],
    )

    const shouldAttemptEmail = input.email !== false && isNotificationEmailEnabled()
    const initialEmailStatus = shouldAttemptEmail ? 'PENDING' as const : 'DISABLED' as const

    const insertion = await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        userId: recipient.id,
        organizationId,
        actorId: input.actorUserId ?? null,
        cargoId: input.cargoId ?? null,
        tipo: type,
        origin: input.origin,
        titulo: title,
        mensaje: message,
        href,
        entityType: input.entity?.type.trim() ?? null,
        entityId: input.entity?.id.trim() ?? null,
        emailStatus: initialEmailStatus,
        deduplicationKey,
      })),
      skipDuplicates: true,
    })

    const result: NotificationCreationResult = {
      recipients: recipients.length,
      created: insertion.count,
      duplicates: recipients.length - insertion.count,
      email: { sent: 0, failed: 0, disabled: shouldAttemptEmail ? 0 : insertion.count },
    }

    if (!shouldAttemptEmail) return result

    const pendingNotifications = await prisma.notification.findMany({
      where: {
        userId: { in: recipientUserIds },
        deduplicationKey,
        emailStatus: 'PENDING',
      },
      select: {
        id: true,
        titulo: true,
        mensaje: true,
        href: true,
        user: { select: { name: true, email: true } },
      },
    })

    await Promise.all(pendingNotifications.map(async (notification) => {
      const delivery = await sendNotificationEmail({
        to: notification.user.email,
        recipientName: notification.user.name,
        title: notification.titulo,
        message: notification.mensaje,
        href: notification.href,
      })

      try {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            emailStatus: delivery.status,
            emailAttemptedAt: new Date(),
            emailProviderId: delivery.status === 'SENT' ? delivery.providerId : null,
          },
        })
      } catch (error) {
        console.error('No se pudo actualizar el estado de entrega de una notificación.', error instanceof Error ? error.name : 'UnknownError')
      }

      if (delivery.status === 'SENT') result.email.sent += 1
      else if (delivery.status === 'FAILED') result.email.failed += 1
      else result.email.disabled += 1
    }))

    return result
  },

  async listForUser(input: {
    userId: string
    filter: 'all' | 'unread' | 'read'
    page: number
    pageSize: number
  }): Promise<NotificationListResponse> {
    const where = {
      userId: input.userId,
      ...(input.filter === 'unread' ? { leida: false } : input.filter === 'read' ? { leida: true } : {}),
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { actor: { select: { name: true } } },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: input.userId, leida: false } }),
    ])

    return {
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.tipo,
        origin: notification.origin,
        title: notification.titulo,
        message: notification.mensaje,
        href: notification.href,
        readAt: notification.readAt?.toISOString() ?? null,
        isRead: notification.leida,
        createdAt: notification.createdAt.toISOString(),
        actorName: notification.actor?.name ?? null,
      })),
      unreadCount,
      total,
      page: input.page,
      pageSize: input.pageSize,
      hasMore: input.page * input.pageSize < total,
    }
  },

  async markRead(userId: string, notificationId: string) {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { leida: true, readAt: new Date() },
    })
    if (result.count === 0) throw new NotificationPolicyError('Notificación no encontrada.')
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, leida: false },
      data: { leida: true, readAt: new Date() },
    })
  },
}
