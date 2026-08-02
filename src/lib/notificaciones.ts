/**
 * Crea las notificaciones in-app y envía el email correspondiente a cada
 * vivienda destinataria de un Cargo recién creado, y a un vecino cuando
 * su pago se confirma o falla.
 * Se relaciona con el modelo Notification, lib/email.ts, y los endpoints
 * /api/pagos/asignar/crear y /api/webhooks/stripe.
 * Existe para centralizar el "avisar a los vecinos" en un solo lugar,
 * reutilizable si en el futuro otros eventos también necesitan notificar.
 */
import { prisma } from '@/lib/prisma'
import {
  enviarNotificacionCargo,
  enviarNotificacionPagoExitoso,
  enviarNotificacionPagoFallido,
} from '@/lib/email'

export async function notificarCargoAVecinos(cargoId: string) {
  const cargo = await prisma.cargo.findUnique({
    where: { id: cargoId },
    include: {
      destinatarios: {
        include: { vivienda: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!cargo) return

  await prisma.notification.createMany({
    data: cargo.destinatarios.map((d) => ({
      userId: d.viviendaId,
      cargoId: cargo.id,
      tipo: 'CARGO_ASIGNADO',
      titulo: cargo.concepto,
      mensaje: `Tienes un nuevo cargo de $${Number(cargo.monto).toLocaleString('es-MX')} MXN, vence el ${cargo.fechaLimite.toLocaleDateString('es-MX')}.`,
    })),
  })

  // Los emails se mandan en paralelo, pero cada uno atrapa su propio error
  // dentro de enviarNotificacionCargo — uno fallando no detiene a los demás.
  await Promise.all(
    cargo.destinatarios.map((d) =>
      enviarNotificacionCargo(
        d.vivienda.email,
        d.vivienda.name,
        cargo.concepto,
        Number(cargo.monto),
        cargo.fechaLimite
      )
    )
  )
}

/**
 * Notifica al vecino (in-app + email) cuando su pago se confirma,
 * y avisa también al/los admin(es) de la organización para que lo vean
 * reflejado sin tener que refrescar el panel financiero.
 */
export async function notificarPagoExitoso(pagoId: string) {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      cargo: true,
      vecino: { select: { id: true, name: true, email: true } },
    },
  })

  if (!pago || !pago.vecino) return

  const concepto = pago.cargo?.concepto ?? 'Pago'
  const monto = Number(pago.monto)

  const admins = await prisma.user.findMany({
    where: { orgId: pago.orgId, role: 'ADMIN' },
    select: { id: true },
  })

  await prisma.notification.createMany({
    data: [
      {
        userId: pago.vecino.id,
        cargoId: pago.cargoId ?? undefined,
        tipo: 'PAGO_CONFIRMADO',
        titulo: concepto,
        mensaje: `Tu pago de $${monto.toLocaleString('es-MX')} MXN por "${concepto}" fue confirmado.`,
      },
      ...admins.map((admin) => ({
        userId: admin.id,
        cargoId: pago.cargoId ?? undefined,
        tipo: 'PAGO_CONFIRMADO',
        titulo: concepto,
        mensaje: `${pago.vecino!.name} pagó $${monto.toLocaleString('es-MX')} MXN por "${concepto}".`,
      })),
    ],
  })

  await enviarNotificacionPagoExitoso(pago.vecino.email, pago.vecino.name, concepto, monto)
}

/**
 * Notifica al vecino (in-app + email) cuando su pago falla, para que pueda
 * reintentar. No se notifica al admin — un intento fallido no requiere
 * su atención hasta que el vecino lo resuelva o el cargo venza.
 */
export async function notificarPagoFallido(pagoId: string, motivo?: string | null) {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      cargo: true,
      vecino: { select: { id: true, name: true, email: true } },
    },
  })

  if (!pago || !pago.vecino) return

  const concepto = pago.cargo?.concepto ?? 'Pago'
  const monto = Number(pago.monto)

  await prisma.notification.create({
    data: {
      userId: pago.vecino.id,
      cargoId: pago.cargoId ?? undefined,
      tipo: 'PAGO_FALLIDO',
      titulo: concepto,
      mensaje: `Tu pago de $${monto.toLocaleString('es-MX')} MXN por "${concepto}" no se pudo procesar. Intenta de nuevo.`,
    },
  })

  await enviarNotificacionPagoFallido(pago.vecino.email, pago.vecino.name, concepto, monto, motivo ?? undefined)
}