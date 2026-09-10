export type NotificationRole =
  | 'SUPERADMIN'
  | 'KOTTA_STAFF'
  | 'ADMIN'
  | 'VECINO'
  | 'PROVEEDOR'
  | 'GUARDIA'

export type NotificationParty = {
  id: string
  role: NotificationRole
  orgId: string | null
}

export type NotificationScope =
  | { kind: 'ADMIN_TO_ORGANIZATION'; organizationId: string }
  | { kind: 'KOTTA_STAFF_TO_ADMIN'; organizationId: string }
  | { kind: 'SYSTEM'; organizationId?: string | null }

export class NotificationPolicyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotificationPolicyError'
  }
}

const ADMIN_RECIPIENT_ROLES = new Set<NotificationRole>(['VECINO', 'PROVEEDOR', 'GUARDIA'])

export function validateNotificationRecipients(
  scope: NotificationScope,
  actor: NotificationParty | null,
  recipients: NotificationParty[],
) {
  if (recipients.length === 0) throw new NotificationPolicyError('Selecciona al menos un destinatario.')

  if (scope.kind === 'ADMIN_TO_ORGANIZATION') {
    if (!actor || actor.role !== 'ADMIN' || actor.orgId !== scope.organizationId) {
      throw new NotificationPolicyError('No tienes permisos para enviar este comunicado.')
    }
    if (recipients.some((recipient) => (
      recipient.orgId !== scope.organizationId || !ADMIN_RECIPIENT_ROLES.has(recipient.role)
    ))) {
      throw new NotificationPolicyError('Uno o más destinatarios no pertenecen a tu condominio o tienen un rol no permitido.')
    }
    return
  }

  if (scope.kind === 'KOTTA_STAFF_TO_ADMIN') {
    if (!actor || actor.role !== 'KOTTA_STAFF') {
      throw new NotificationPolicyError('Solo KOTTA_STAFF puede enviar comunicaciones comerciales.')
    }
    if (recipients.some((recipient) => (
      recipient.role !== 'ADMIN' || recipient.orgId !== scope.organizationId
    ))) {
      throw new NotificationPolicyError('KOTTA_STAFF solo puede notificar a administradores del condominio seleccionado.')
    }
    return
  }

  if (scope.organizationId && recipients.some((recipient) => recipient.orgId !== scope.organizationId)) {
    throw new NotificationPolicyError('Una notificación del sistema no puede cruzar organizaciones.')
  }
}

export function normalizeNotificationContent(title: unknown, message: unknown) {
  const normalizedTitle = typeof title === 'string' ? title.trim() : ''
  const normalizedMessage = typeof message === 'string' ? message.trim() : ''

  if (normalizedTitle.length < 3 || normalizedTitle.length > 120 || /[\r\n]/.test(normalizedTitle)) {
    throw new NotificationPolicyError('El título debe tener entre 3 y 120 caracteres.')
  }
  if (normalizedMessage.length < 3 || normalizedMessage.length > 4000) {
    throw new NotificationPolicyError('El mensaje debe tener entre 3 y 4000 caracteres.')
  }

  return { title: normalizedTitle, message: normalizedMessage }
}

export function normalizeInternalNotificationHref(href: unknown) {
  if (href === null || href === undefined || href === '') return null
  if (typeof href !== 'string') throw new NotificationPolicyError('El enlace de la notificación no es válido.')

  const normalized = href.trim()
  if (
    normalized.length > 500
    || !normalized.startsWith('/')
    || normalized.startsWith('//')
    || normalized.includes('\\')
    || /[\r\n]/.test(normalized)
  ) {
    throw new NotificationPolicyError('Las notificaciones solo pueden enlazar a rutas internas de Kotta.')
  }

  const internalBase = new URL('https://kotta.internal')
  const parsed = new URL(normalized, internalBase)
  if (
    parsed.origin !== internalBase.origin
    || /%2f|%5c/i.test(parsed.pathname)
  ) {
    throw new NotificationPolicyError('Las notificaciones solo pueden enlazar a rutas internas de Kotta.')
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

export function validateNotificationHrefOrganization(href: string | null, organizationSlug: string) {
  if (
    href
    && href !== `/${organizationSlug}`
    && !href.startsWith(`/${organizationSlug}/`)
  ) {
    throw new NotificationPolicyError('El enlace de la notificación no pertenece al condominio destinatario.')
  }
}
