import { Prisma } from '@prisma/client'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export class FinancialReviewRequired extends Error {}

/** Reintenta solo conflictos locales, nunca operaciones Stripe. */
export async function financialTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2034' || attempt >= 2) throw error
    }
  }
}

/** Sin ledger de refunds/parciales, no gastar saldos pendientes de conciliación. */
export async function assertFinancialOperationsAllowed(tx: Prisma.TransactionClient, orgId: string) {
  const where = { orgId, referencia: { contains: 'stripe-review:' } }
  const [pago, distribucion] = await Promise.all([
    tx.pago.findFirst({ where, select: { id: true } }),
    tx.distribucionPago.findFirst({ where, select: { id: true } }),
  ])
  if (pago || distribucion) throw new FinancialReviewRequired('El saldo requiere conciliación de un reembolso o reversal antes de nuevas salidas.')
}

type TransferOperation = {
  version: 1
  reservedAt: number
  key: string
  params: Stripe.TransferCreateParams
}

/** Snapshot inmutable de la solicitud externa en el campo de referencia existente. */
export function transferReference(id: string, params: Stripe.TransferCreateParams, requestId?: string) {
  const operation: TransferOperation = { version: 1, reservedAt: Date.now(), key: `kotta-transfer-${id}-v1`, params }
  return `${requestId ? `retiro:${requestId}|` : ''}transfer-v1:${JSON.stringify(operation)}`
}

export function readTransferReference(reference: string | null): TransferOperation | null {
  const marker = 'transfer-v1:'
  const index = reference?.indexOf(marker) ?? -1
  if (index < 0) return null
  try {
    const value = JSON.parse(reference!.slice(index + marker.length).split('|stripe-review:')[0]) as TransferOperation
    if (value.version !== 1 || !Number.isFinite(value.reservedAt) || !value.key ||
        !Number.isSafeInteger(value.params?.amount) || value.params.amount! <= 0 ||
        typeof value.params.destination !== 'string' || value.params.currency !== 'mxn') return null
    return value
  } catch { return null }
}

export async function executeReservedTransfer(distribucion: {
  id: string; orgId: string; estado: string; referencia: string | null; stripeTransferId: string | null
  monto: Prisma.Decimal; cuentaConectadaId: string
}, expected: { orgId: string; amount: number; destination: string; accountId: string }) {
  const operation = readTransferReference(distribucion.referencia)
  if (!operation || distribucion.orgId !== expected.orgId || distribucion.cuentaConectadaId !== expected.accountId ||
      operation.params.amount !== expected.amount || Math.round(Number(distribucion.monto) * 100) !== expected.amount ||
      operation.params.destination !== expected.destination || operation.params.metadata?.orgId !== expected.orgId ||
      operation.params.metadata?.distribucionId !== distribucion.id) {
    throw new FinancialReviewRequired('La operación existente no coincide o es histórica. No se reintentará automáticamente.')
  }
  if (!['PENDIENTE', 'PROCESANDO'].includes(distribucion.estado) || distribucion.stripeTransferId) {
    throw new FinancialReviewRequired('La transferencia ya está resuelta o necesita conciliación.')
  }
  // No renovar la ventana: Stripe puede purgar las keys después de 24 horas.
  if (Date.now() - operation.reservedAt >= 23 * 60 * 60 * 1000) {
    throw new FinancialReviewRequired('Resultado pendiente de conciliación; expiró la ventana segura de reintento.')
  }
  const claimed = await financialTransaction(async (tx) => {
    await assertFinancialOperationsAllowed(tx, expected.orgId)
    return tx.distribucionPago.updateMany({
      where: { id: distribucion.id, orgId: expected.orgId, referencia: distribucion.referencia, stripeTransferId: null, estado: { in: ['PENDIENTE', 'PROCESANDO'] } },
      data: { estado: 'PROCESANDO' },
    })
  })
  if (claimed.count !== 1) throw new FinancialReviewRequired('La operación cambió mientras se confirmaba.')

  // Todo error conserva PROCESANDO, reserva, parámetros y key. Un timeout no
  // demuestra que Stripe no creó la transferencia.
  const transfer = await stripe.transfers.create(operation.params, { idempotencyKey: operation.key })
  const destination = typeof transfer.destination === 'string' ? transfer.destination : transfer.destination?.id
  if (transfer.amount !== operation.params.amount || destination !== operation.params.destination || transfer.currency !== 'mxn') {
    throw new FinancialReviewRequired('La respuesta Stripe no coincide con la operación reservada.')
  }
  const confirmed = await prisma.distribucionPago.updateMany({
    where: { id: distribucion.id, orgId: expected.orgId, referencia: distribucion.referencia, estado: { in: ['PENDIENTE', 'PROCESANDO'] }, OR: [{ stripeTransferId: null }, { stripeTransferId: transfer.id }] },
    data: { stripeTransferId: transfer.id, estado: 'PAGADO' },
  })
  if (confirmed.count === 0) throw new FinancialReviewRequired('Stripe respondió, pero el estado local cambió. Consulta la conciliación.')
  return transfer
}
