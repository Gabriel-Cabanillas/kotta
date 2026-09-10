/**
 * Adaptadores de eventos operativos existentes hacia el servicio oficial de
 * notificaciones. Los webhooks y APIs históricas conservan estas funciones,
 * pero la persistencia, deduplicación y entrega viven en NotificationService.
 */
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notifications/notification-service'

export async function notificarCargoAVecinos(cargoId: string) {
  const cargo = await prisma.cargo.findUnique({
    where: { id: cargoId },
    include: {
      org: { select: { slug: true } },
      destinatarios: { select: { viviendaId: true } },
    },
  })
  if (!cargo || cargo.destinatarios.length === 0) return

  await NotificationService.create({
    recipientUserIds: cargo.destinatarios.map((recipient) => recipient.viviendaId),
    scope: { kind: 'SYSTEM', organizationId: cargo.orgId },
    origin: 'SYSTEM',
    type: 'CARGO_ASIGNADO',
    title: cargo.concepto,
    message: `Tienes un nuevo cargo de $${Number(cargo.monto).toLocaleString('es-MX')} MXN, vence el ${cargo.fechaLimite.toLocaleDateString('es-MX')}.`,
    href: `/${cargo.org.slug}/vecino/pagos`,
    entity: { type: 'Cargo', id: cargo.id },
    cargoId: cargo.id,
    deduplicationKey: `cargo:${cargo.id}:asignado`,
  })
}

export async function notificarPagoExitoso(pagoId: string) {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      cargo: true,
      org: { select: { slug: true } },
      vecino: { select: { id: true, name: true } },
    },
  })
  if (!pago?.vecino) return

  const concepto = pago.cargo?.concepto ?? 'Pago'
  const monto = Number(pago.monto)
  const admins = await prisma.user.findMany({
    where: { orgId: pago.orgId, role: 'ADMIN', isActive: true },
    select: { id: true },
  })

  await NotificationService.create({
    recipientUserIds: [pago.vecino.id],
    scope: { kind: 'SYSTEM', organizationId: pago.orgId },
    origin: 'SYSTEM',
    type: 'PAGO_CONFIRMADO',
    title: concepto,
    message: `Tu pago de $${monto.toLocaleString('es-MX')} MXN por "${concepto}" fue confirmado.`,
    href: `/${pago.org.slug}/vecino/pagos`,
    entity: { type: 'Pago', id: pago.id },
    cargoId: pago.cargoId,
    deduplicationKey: `pago:${pago.id}:confirmado:vecino`,
  })

  if (admins.length > 0) {
    await NotificationService.create({
      recipientUserIds: admins.map((admin) => admin.id),
      scope: { kind: 'SYSTEM', organizationId: pago.orgId },
      origin: 'SYSTEM',
      type: 'PAGO_CONFIRMADO',
      title: concepto,
      message: `${pago.vecino.name} pagó $${monto.toLocaleString('es-MX')} MXN por "${concepto}".`,
      href: `/${pago.org.slug}/admin/pagos`,
      entity: { type: 'Pago', id: pago.id },
      cargoId: pago.cargoId,
      deduplicationKey: `pago:${pago.id}:confirmado:admins`,
    })
  }
}

export async function notificarPagoFallido(pagoId: string, motivo?: string | null) {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      cargo: true,
      org: { select: { slug: true } },
      vecino: { select: { id: true } },
    },
  })
  if (!pago?.vecino) return

  const concepto = pago.cargo?.concepto ?? 'Pago'
  const monto = Number(pago.monto)
  const detalle = motivo?.trim() ? ` Motivo: ${motivo.trim()}` : ''
  await NotificationService.create({
    recipientUserIds: [pago.vecino.id],
    scope: { kind: 'SYSTEM', organizationId: pago.orgId },
    origin: 'SYSTEM',
    type: 'PAGO_FALLIDO',
    title: concepto,
    message: `Tu pago de $${monto.toLocaleString('es-MX')} MXN por "${concepto}" no se pudo procesar. Intenta de nuevo.${detalle}`,
    href: `/${pago.org.slug}/vecino/pagos`,
    entity: { type: 'Pago', id: pago.id },
    cargoId: pago.cargoId,
    deduplicationKey: `pago:${pago.id}:fallido`,
  })
}

export async function notificarPagoReembolsado(pagoId: string) {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      cargo: true,
      org: { select: { slug: true } },
      vecino: { select: { id: true } },
    },
  })
  if (!pago?.vecino) return

  const concepto = pago.cargo?.concepto ?? 'Pago'
  const monto = Number(pago.montoConRecargo ?? pago.monto)
  await NotificationService.create({
    recipientUserIds: [pago.vecino.id],
    scope: { kind: 'SYSTEM', organizationId: pago.orgId },
    origin: 'SYSTEM',
    type: 'PAGO_REEMBOLSADO',
    title: concepto,
    message: `Tu reembolso de $${monto.toLocaleString('es-MX')} MXN por "${concepto}" fue confirmado.`,
    href: `/${pago.org.slug}/vecino/pagos`,
    entity: { type: 'Pago', id: pago.id },
    cargoId: pago.cargoId,
    deduplicationKey: `pago:${pago.id}:reembolsado`,
  })
}

export async function notificarDisputaAKottaStaff(stripeDisputeId: string) {
  const disputa = await prisma.disputaStripe.findUnique({
    where: { stripeDisputeId },
    include: { pago: { include: { org: { select: { name: true } } } } },
  })
  if (!disputa) return

  const staff = await prisma.user.findMany({
    where: { role: 'KOTTA_STAFF', isActive: true },
    select: { id: true },
  })
  if (staff.length === 0) return

  const monto = Number(disputa.monto)
  const fechaLimite = disputa.fechaLimite
    ? disputa.fechaLimite.toLocaleDateString('es-MX', { dateStyle: 'long' })
    : 'sin fecha límite informada'

  await NotificationService.create({
    recipientUserIds: staff.map((user) => user.id),
    scope: { kind: 'SYSTEM', organizationId: null },
    origin: 'SYSTEM',
    type: 'DISPUTA_STRIPE',
    title: `Disputa Stripe · ${disputa.pago.org.name}`,
    message: `Disputa de ${monto.toLocaleString('es-MX')} ${disputa.moneda.toUpperCase()} en ${disputa.pago.org.name}. Motivo: ${disputa.motivo}. Evidencia antes de ${fechaLimite}.`,
    href: '/kotta-staff/disputas',
    entity: { type: 'DisputaStripe', id: disputa.id },
    deduplicationKey: `disputa:${disputa.id}:staff`,
  })
}
