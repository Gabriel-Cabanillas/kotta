import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeInternalNotificationHref,
  validateNotificationHrefOrganization,
  validateNotificationRecipients,
} from '../src/lib/notifications/policy.ts'
import { isNotificationEmailEnabled } from '../src/lib/notifications/email-channel.ts'

const admin = { id: 'admin-a', role: 'ADMIN', orgId: 'org-a' }
const staff = { id: 'staff', role: 'KOTTA_STAFF', orgId: null }

test('KOTTA_STAFF solo puede enviar a ADMIN del condominio elegido', () => {
  assert.doesNotThrow(() => validateNotificationRecipients(
    { kind: 'KOTTA_STAFF_TO_ADMIN', organizationId: 'org-a' },
    staff,
    [{ id: 'admin-a', role: 'ADMIN', orgId: 'org-a' }],
  ))
  assert.throws(() => validateNotificationRecipients(
    { kind: 'KOTTA_STAFF_TO_ADMIN', organizationId: 'org-a' },
    staff,
    [{ id: 'vecino-a', role: 'VECINO', orgId: 'org-a' }],
  ))
})

test('ADMIN puede notificar a VECINO, PROVEEDOR y GUARDIA de su organización', () => {
  for (const role of ['VECINO', 'PROVEEDOR', 'GUARDIA']) {
    assert.doesNotThrow(() => validateNotificationRecipients(
      { kind: 'ADMIN_TO_ORGANIZATION', organizationId: 'org-a' },
      admin,
      [{ id: role.toLowerCase(), role, orgId: 'org-a' }],
    ))
  }
})

test('ADMIN no puede cruzar organizaciones ni notificar a otro ADMIN', () => {
  assert.throws(() => validateNotificationRecipients(
    { kind: 'ADMIN_TO_ORGANIZATION', organizationId: 'org-a' },
    admin,
    [{ id: 'vecino-b', role: 'VECINO', orgId: 'org-b' }],
  ))
  assert.throws(() => validateNotificationRecipients(
    { kind: 'ADMIN_TO_ORGANIZATION', organizationId: 'org-a' },
    admin,
    [{ id: 'admin-b', role: 'ADMIN', orgId: 'org-a' }],
  ))
})

test('roles receptores no pueden usar la política de envío ADMIN', () => {
  assert.throws(() => validateNotificationRecipients(
    { kind: 'ADMIN_TO_ORGANIZATION', organizationId: 'org-a' },
    { id: 'vecino-a', role: 'VECINO', orgId: 'org-a' },
    [{ id: 'guardia-a', role: 'GUARDIA', orgId: 'org-a' }],
  ))
})

test('href solo acepta rutas internas de Kotta', () => {
  assert.equal(normalizeInternalNotificationHref('/los-pinos/admin/pagos'), '/los-pinos/admin/pagos')
  assert.throws(() => normalizeInternalNotificationHref('https://example.com'))
  assert.throws(() => normalizeInternalNotificationHref('//example.com'))
  assert.throws(() => normalizeInternalNotificationHref('/ruta\\externa'))
  assert.throws(() => normalizeInternalNotificationHref('/los-pinos/%2f..%2fotro-coto/admin'))
})

test('href canonicalizado no puede saltar a otro tenant', () => {
  const validHref = normalizeInternalNotificationHref('/los-pinos/admin/pagos?periodo=2026-08')
  assert.doesNotThrow(() => validateNotificationHrefOrganization(validHref, 'los-pinos'))

  const traversedHref = normalizeInternalNotificationHref('/los-pinos/../otro-coto/admin')
  assert.equal(traversedHref, '/otro-coto/admin')
  assert.throws(() => validateNotificationHrefOrganization(traversedHref, 'los-pinos'))
})

test('email de notificaciones permanece apagado por defecto', () => {
  assert.equal(isNotificationEmailEnabled({}), false)
  assert.equal(isNotificationEmailEnabled({ EMAIL_NOTIFICATIONS_ENABLED: 'false' }), false)
  assert.equal(isNotificationEmailEnabled({ EMAIL_NOTIFICATIONS_ENABLED: 'true' }), true)
})
