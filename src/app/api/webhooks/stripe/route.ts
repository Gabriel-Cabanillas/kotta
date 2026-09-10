/**
 * Efectos financieros idempotentes y transaccionales. El recibo de procesamiento
 * se guarda solo después de completar también las notificaciones deduplicadas.
 * Ante cualquier fallo se responde 503 sin marcar el evento como terminado.
 */
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { EstadoPago, Prisma } from '@prisma/client'
import { financialTransaction, readTransferReference } from '@/lib/stripe/financial-safety'
import { notificarDisputaAKottaStaff, notificarPagoExitoso, notificarPagoFallido, notificarPagoReembolsado } from '@/lib/notificaciones'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

const POSTERIORES: EstadoPago[] = ['EN_DISPUTA', 'DISPUTA_PERDIDA', 'REEMBOLSADO']
const CERRADAS = ['won', 'lost', 'warning_closed', 'prevented']
type Notice = { kind: 'paid' | 'failed' | 'refund' | 'dispute'; id: string; message?: string | null }
const idOf = (value: string | { id: string } | null | undefined) => typeof value === 'string' ? value : value?.id

/** Los snapshots del evento no son la fuente del estado actual. Red fuera de tx. */
async function loadCurrent(event: Stripe.Event) {
  const object = event.data.object as { id: string }
  if (event.type.startsWith('payment_intent.')) {
    const intent = await stripe.paymentIntents.retrieve(object.id)
    let charge: Stripe.Charge | undefined
    let balance: Stripe.BalanceTransaction | undefined
    if (intent.status === 'succeeded') {
      const chargeId = idOf(intent.latest_charge)
      if (!chargeId) throw new Error('Cobro confirmado sin Charge; reintentar')
      charge = await stripe.charges.retrieve(chargeId)
      const balanceId = idOf(charge.balance_transaction)
      if (!balanceId) throw new Error('Balance Transaction pendiente; reintentar')
      balance = await stripe.balanceTransactions.retrieve(balanceId)
    }
    return { intent, charge, balance }
  }
  if (event.type.startsWith('charge.dispute.')) {
    const dispute = await stripe.disputes.retrieve(object.id)
    const charge = await stripe.charges.retrieve(idOf(dispute.charge)!)
    return { dispute, charge }
  }
  if (event.type === 'refund.updated' || event.type === 'refund.created' || event.type === 'refund.failed') {
    const refund = await stripe.refunds.retrieve(object.id)
    const chargeId = idOf(refund.charge)
    if (!chargeId) throw new Error('Refund sin Charge')
    return { charge: await stripe.charges.retrieve(chargeId) }
  }
  if (event.type === 'charge.refunded' || event.type === 'charge.updated') {
    const charge = await stripe.charges.retrieve(object.id)
    const balanceId = idOf(charge.balance_transaction)
    const balance = event.type === 'charge.updated' && balanceId
      ? await stripe.balanceTransactions.retrieve(balanceId) : undefined
    return { charge, balance }
  }
  if (event.type === 'transfer.created' || event.type === 'transfer.reversed') {
    return { transfer: await stripe.transfers.retrieve(object.id) }
  }
  if (event.type === 'account.updated') {
    return { account: await stripe.accounts.retrieve(object.id) }
  }
  return {}
}

/** Recupera incluso un PI cuyo webhook llegó antes de guardar su ID. */
async function findIntentPayment(tx: Prisma.TransactionClient, intent: Stripe.PaymentIntent) {
  let pago = await tx.pago.findUnique({ where: { stripePaymentIntentId: intent.id } })
  if (!pago && intent.metadata.pagoId && intent.metadata.orgId) {
    const reserved = await tx.pago.findFirst({
      where: {
        id: intent.metadata.pagoId, orgId: intent.metadata.orgId,
        cargoId: intent.metadata.cargoId, vecinoId: intent.metadata.vecinoId,
        stripePaymentIntentId: null, referencia: 'payment-intent:reserved:v1',
      },
    })
    if (reserved && Math.round(Number(reserved.montoConRecargo ?? reserved.monto) * 100) === intent.amount) {
      const linked = await tx.pago.updateMany({ where: { id: reserved.id, stripePaymentIntentId: null }, data: { stripePaymentIntentId: intent.id } })
      if (linked.count !== 1) throw new Error('El intento cambió mientras se vinculaba')
      pago = await tx.pago.findUnique({ where: { stripePaymentIntentId: intent.id } })
    }
  }
  if (!pago) throw new Error('PaymentIntent todavía sin Pago asociado')
  if (intent.metadata.orgId && intent.metadata.orgId !== pago.orgId) throw new Error('Organización de PaymentIntent inconsistente')
  return pago
}

async function applyCurrent(tx: Prisma.TransactionClient, event: Stripe.Event, current: Awaited<ReturnType<typeof loadCurrent>>): Promise<Notice[]> {
  const notices: Notice[] = []
  if (current.account && !('deleted' in current.account)) {
    await tx.cuentaConectada.updateMany({
      where: { stripeAccountId: current.account.id },
      data: { chargesEnabled: current.account.charges_enabled, payoutsEnabled: current.account.payouts_enabled, detailsSubmitted: current.account.details_submitted },
    })
  }
  if (current.intent) {
    const intent = current.intent
    const pago = await findIntentPayment(tx, intent)
    const protectedState = POSTERIORES.includes(pago.estado) || pago.referencia?.startsWith('stripe-review:')
    if (intent.status === 'succeeded') {
      await tx.pago.update({
        where: { id: pago.id, orgId: pago.orgId },
        data: {
          stripeFeeAmount: current.balance!.fee / 100, montoNeto: current.balance!.net / 100,
          comprobanteUrl: current.charge?.receipt_url ?? undefined,
          ...(!protectedState ? { estado: EstadoPago.PAGADO } : {}),
        },
      })
      if (!protectedState && !current.charge?.amount_refunded) notices.push({ kind: 'paid', id: pago.id })
    } else if (!protectedState && pago.estado !== 'PAGADO') {
      if (intent.status === 'processing' || intent.status === 'requires_capture') {
        await tx.pago.update({ where: { id: pago.id }, data: { estado: 'PROCESANDO' } })
      } else if (event.type === 'payment_intent.payment_failed' && intent.status === 'requires_payment_method') {
        await tx.pago.update({ where: { id: pago.id }, data: { estado: 'FALLIDO' } })
        notices.push({ kind: 'failed', id: pago.id, message: intent.last_payment_error?.message })
      }
    }
  }

  const charge = current.charge
  if (charge && ((!current.intent && !current.dispute) || charge.amount_refunded > 0)) {
    const intentId = idOf(charge.payment_intent)
    const pago = intentId ? await tx.pago.findUnique({ where: { stripePaymentIntentId: intentId } }) : null
    if (!pago) throw new Error('Charge todavía sin Pago asociado')
    if (current.balance) {
      await tx.pago.updateMany({
        where: { id: pago.id, montoNeto: null },
        data: { stripeFeeAmount: current.balance.fee / 100, montoNeto: current.balance.net / 100 },
      })
    }
    // Usar el acumulado actual del Charge, nunca el importe de un único Refund.
    if (charge.amount_refunded > 0) {
      const full = charge.refunded && charge.amount_refunded === charge.amount
      await tx.pago.update({
        where: { id: pago.id, orgId: pago.orgId },
        data: {
          referencia: 'stripe-review:refund:' + charge.id,
          ...(full && pago.estado !== 'DISPUTA_PERDIDA' ? { estado: EstadoPago.REEMBOLSADO } : {}),
        },
      })
      // Sin modelo de refunds no se libera/reutiliza el saldo de este tenant.
      // El estado parcial se conserva, y la salida automática queda bloqueada.
      if (full && pago.estado !== 'DISPUTA_PERDIDA') notices.push({ kind: 'refund', id: pago.id })
    }
  }

  if (current.dispute) {
    const dispute = current.dispute
    const intentId = idOf(dispute.payment_intent) ?? idOf(current.charge?.payment_intent)
    const pago = intentId ? await tx.pago.findUnique({ where: { stripePaymentIntentId: intentId } }) : null
    if (!pago) throw new Error('Disputa todavía sin Pago asociado')
    const existing = await tx.disputaStripe.findUnique({ where: { stripeDisputeId: dispute.id } })
    // También protege contra dos lecturas Stripe concurrentes: una lectura
    // antigua no reabre una disputa que otra transacción ya cerró.
    if (!existing || !CERRADAS.includes(existing.estadoStripe)) {
      const closed = CERRADAS.includes(dispute.status)
      const data = {
        monto: dispute.amount / 100, moneda: dispute.currency.toUpperCase(), motivo: dispute.reason,
        estadoStripe: dispute.status,
        fechaLimite: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null,
        cerradaEn: closed ? new Date() : null,
      }
      await tx.disputaStripe.upsert({
        where: { stripeDisputeId: dispute.id },
        create: { ...data, pagoId: pago.id, stripeDisputeId: dispute.id, creadaEn: new Date(dispute.created * 1000) },
        update: data,
      })
      if (pago.estado !== 'REEMBOLSADO' && pago.estado !== 'DISPUTA_PERDIDA' && !pago.referencia?.startsWith('stripe-review:')) {
        await tx.pago.update({
          where: { id: pago.id },
          data: { estado: dispute.status === 'lost' ? 'DISPUTA_PERDIDA' : closed ? 'PAGADO' : 'EN_DISPUTA' },
        })
      }
    }
    // La función usa deduplicationKey; se repite si falló después del commit.
    notices.push({ kind: 'dispute', id: dispute.id })
  }

  if (current.transfer) {
    const transfer = current.transfer
    const distribucion = await tx.distribucionPago.findFirst({
      where: { OR: [{ stripeTransferId: transfer.id }, ...(transfer.metadata.distribucionId ? [{ id: transfer.metadata.distribucionId }] : [])] },
    })
    if (!distribucion) throw new Error('Transfer todavía sin DistribucionPago asociada')
    const account = await tx.cuentaConectada.findUnique({ where: { id: distribucion.cuentaConectadaId } })
    const operation = readTransferReference(distribucion.referencia)
    const destination = idOf(transfer.destination)
    if ((distribucion.stripeTransferId && distribucion.stripeTransferId !== transfer.id) ||
        transfer.metadata.orgId !== distribucion.orgId || transfer.currency !== 'mxn' ||
        transfer.amount !== Math.round(Number(distribucion.monto) * 100) ||
        destination !== (operation?.params.destination ?? account?.stripeAccountId)) {
      throw new Error('Identidad, tenant o importe de transferencia inconsistente')
    }
    const full = transfer.reversed && transfer.amount_reversed === transfer.amount
    const reference = distribucion.referencia?.includes('stripe-review:')
      ? distribucion.referencia
      : (distribucion.referencia ?? '') + '|stripe-review:reversal:' + transfer.id
    await tx.distribucionPago.update({
      where: { id: distribucion.id, orgId: distribucion.orgId },
      data: {
        stripeTransferId: transfer.id,
        // Un parcial conserva TODO el débito hasta poder conciliarlo.
        estado: full || distribucion.estado === 'REEMBOLSADO' ? 'REEMBOLSADO' : 'PAGADO',
        ...(transfer.amount_reversed > 0 ? { referencia: reference } : {}),
      },
    })
  }
  return notices
}

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Falta la firma de Stripe', { status: 400 })
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Firma inválida', { status: 400 })
  }
  try {
    if (await prisma.webhookEvent.findUnique({ where: { stripeEventId: event.id } })) {
      return new Response('Evento ya procesado', { status: 200 })
    }
    const handled = ['account.updated', 'payment_intent.succeeded', 'payment_intent.payment_failed', 'charge.updated', 'charge.refunded',
      'refund.created', 'refund.updated', 'refund.failed', 'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed',
      'charge.dispute.funds_withdrawn', 'charge.dispute.funds_reinstated', 'transfer.created', 'transfer.reversed']
    const current = handled.includes(event.type) ? await loadCurrent(event) : {}
    const notices = await financialTransaction((tx) => applyCurrent(tx, event, current))
    for (const notice of notices) {
      if (notice.kind === 'paid') await notificarPagoExitoso(notice.id)
      if (notice.kind === 'failed') await notificarPagoFallido(notice.id, notice.message)
      if (notice.kind === 'refund') await notificarPagoReembolsado(notice.id)
      if (notice.kind === 'dispute') await notificarDisputaAKottaStaff(notice.id)
    }
    // Solo completado. Si falló DB, Stripe o notificaciones, la siguiente
    // entrega repite efectos absolutos/idempotentes y no pierde la notificación.
    await prisma.webhookEvent.upsert({
      where: { stripeEventId: event.id },
      create: { stripeEventId: event.id, tipo: event.type },
      update: {},
    })
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook pendiente de reintento:', event.id, error)
    return new Response('Procesamiento pendiente; reintentar', { status: 503 })
  }
}
