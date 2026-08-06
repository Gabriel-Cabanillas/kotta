/**
 * Corrige siete Pagos históricos detectados antes del tracking de net/fee.
 *
 * Uso seguro (no escribe): node scripts/backfill-montoneto-historico.mjs
 * Aplicación real:           node scripts/backfill-montoneto-historico.mjs --confirm
 *
 * El Direct Charge histórico se excluye de plataforma. Los demás importes se
 * consultan nuevamente en Stripe; nunca se codifican fee/net en este archivo.
 */
import dotenv from 'dotenv'
import Stripe from 'stripe'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

dotenv.config({ path: '.env.local' })

const aplicar = process.argv.includes('--confirm')
const DIRECT_CHARGE_PAYMENT_INTENT = 'pi_3U03ZiDKntRkCrun1ILOxAVE'
const PLATFORM_PAYMENT_INTENTS = [
  'pi_3U05LCD6SplCOe191X0EuZFC',
  'pi_3U0B0oD6SplCOe190ntypBDQ',
  'pi_3U0RsrD6SplCOe191O1pGSIC',
  'pi_3U0RtPD6SplCOe190jOeFWOU',
  'pi_3U0RuvD6SplCOe191LO9A3My',
  'pi_3U0RvDD6SplCOe190xuFWEO8',
]
const PAYMENT_INTENTS_OBJETIVO = [DIRECT_CHARGE_PAYMENT_INTENT, ...PLATFORM_PAYMENT_INTENTS]
const ESTADOS_COMPROMETIDOS = ['PENDIENTE', 'PROCESANDO', 'PAGADO']

if (!process.env.DATABASE_URL || !process.env.STRIPE_SECRET_KEY) {
  console.error('Faltan DATABASE_URL o STRIPE_SECRET_KEY en .env.local.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' })
const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function numero(valor) {
  return Number(valor ?? 0)
}

function formato(valor) {
  return valor === null || valor === undefined ? 'null' : moneda.format(numero(valor))
}

async function calcularSaldos(orgIds, cambios) {
  const [pagos, distribuciones, organizaciones] = await Promise.all([
    prisma.pago.findMany({
      where: { orgId: { in: orgIds }, tipoOperacion: 'CARGO', estado: 'PAGADO', enPlataforma: true },
      select: { id: true, orgId: true, monto: true, montoNeto: true, enPlataforma: true },
    }),
    prisma.distribucionPago.findMany({
      where: { orgId: { in: orgIds }, origenManual: false, estado: { in: ESTADOS_COMPROMETIDOS } },
      select: { orgId: true, monto: true, comisionEstimada: true },
    }),
    prisma.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } }),
  ])

  const nombres = new Map(organizaciones.map((organizacion) => [organizacion.id, organizacion.name]))
  const resultado = new Map(orgIds.map((orgId) => [orgId, { nombre: nombres.get(orgId) ?? orgId, antes: 0, despues: 0 }]))

  for (const pago of pagos) {
    const saldo = resultado.get(pago.orgId)
    if (!saldo) continue
    saldo.antes += numero(pago.montoNeto ?? pago.monto)
    const cambio = cambios.get(pago.id)
    if (cambio?.enPlataforma === false) continue
    saldo.despues += numero(cambio?.montoNeto ?? pago.montoNeto ?? pago.monto)
  }

  for (const distribucion of distribuciones) {
    const importe = numero(distribucion.monto) + numero(distribucion.comisionEstimada)
    const saldo = resultado.get(distribucion.orgId)
    if (saldo) {
      saldo.antes -= importe
      saldo.despues -= importe
    }
  }

  return resultado
}

try {
  console.log(aplicar ? 'MODO CONFIRM: se aplicarán cambios.' : 'MODO DRY-RUN: no se escribirá ningún dato.')

  const pagos = await prisma.pago.findMany({
    where: { stripePaymentIntentId: { in: PAYMENT_INTENTS_OBJETIVO } },
    select: {
      id: true,
      orgId: true,
      stripePaymentIntentId: true,
      enPlataforma: true,
      stripeFeeAmount: true,
      montoNeto: true,
    },
  })
  const porPaymentIntent = new Map(pagos.map((pago) => [pago.stripePaymentIntentId, pago]))
  const cambiosPlaneados = new Map()
  const operaciones = []
  let exitosos = 0
  let omitidos = 0
  let fallidos = 0

  const directo = porPaymentIntent.get(DIRECT_CHARGE_PAYMENT_INTENT)
  if (!directo) {
    console.error(`[FALLIDO] Direct Charge no encontrado: ${DIRECT_CHARGE_PAYMENT_INTENT}`)
    fallidos += 1
  } else if (directo.enPlataforma === false) {
    console.log(`[OMITIDO] Pago ${directo.id}: ya está excluido de plataforma.`)
    omitidos += 1
  } else {
    const cambio = { enPlataforma: false }
    cambiosPlaneados.set(directo.id, cambio)
    operaciones.push({ pago: directo, tipo: 'DIRECT_CHARGE', cambio })
    console.log(`[${aplicar ? 'APLICAR' : 'DRY-RUN'}] Pago ${directo.id} | enPlataforma: ${directo.enPlataforma} -> false | montoNeto: ${formato(directo.montoNeto)} (sin cambio) | stripeFeeAmount: ${formato(directo.stripeFeeAmount)} (sin cambio)`)
    exitosos += 1
  }

  for (const paymentIntentId of PLATFORM_PAYMENT_INTENTS) {
    const pago = porPaymentIntent.get(paymentIntentId)
    if (!pago) {
      console.error(`[FALLIDO] Pago no encontrado para ${paymentIntentId}`)
      fallidos += 1
      continue
    }
    if (pago.montoNeto !== null) {
      console.log(`[OMITIDO] Pago ${pago.id}: montoNeto ya existe (${formato(pago.montoNeto)}).`)
      omitidos += 1
      continue
    }

    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge.balance_transaction'],
      })
      const charge = typeof intent.latest_charge === 'string' ? null : intent.latest_charge
      const balanceTransaction = charge && typeof charge.balance_transaction !== 'string'
        ? charge.balance_transaction
        : null
      if (!balanceTransaction || balanceTransaction.currency.toLowerCase() !== 'mxn') {
        throw new Error('No se encontró una Balance Transaction MXN expandida para este PaymentIntent.')
      }

      const cambio = {
        stripeFeeAmount: balanceTransaction.fee / 100,
        montoNeto: balanceTransaction.net / 100,
      }
      cambiosPlaneados.set(pago.id, cambio)
      operaciones.push({ pago, tipo: 'PLATAFORMA', cambio })
      console.log(`[${aplicar ? 'APLICAR' : 'DRY-RUN'}] Pago ${pago.id} | stripeFeeAmount: ${formato(pago.stripeFeeAmount)} -> ${formato(cambio.stripeFeeAmount)} | montoNeto: ${formato(pago.montoNeto)} -> ${formato(cambio.montoNeto)}`)
      exitosos += 1
    } catch (error) {
      console.error(`[FALLIDO] Pago ${pago.id} (${paymentIntentId}): ${error instanceof Error ? error.message : String(error)}`)
      fallidos += 1
    }
  }

  const orgIds = [...new Set(pagos.map((pago) => pago.orgId))]
  const saldos = await calcularSaldos(orgIds, cambiosPlaneados)
  console.log('\nImpacto en saldo contable disponible por coto:')
  for (const { nombre, antes, despues } of saldos.values()) {
    console.log(`- ${nombre}: ${moneda.format(Math.max(0, antes))} -> ${moneda.format(Math.max(0, despues))} (${moneda.format(despues - antes)})`)
  }

  if (aplicar) {
    for (const { pago, tipo, cambio } of operaciones) {
      if (tipo === 'DIRECT_CHARGE') {
        await prisma.pago.update({ where: { id: pago.id }, data: { enPlataforma: false } })
      } else {
        await prisma.pago.update({
          where: { id: pago.id },
          data: {
            stripeFeeAmount: new Prisma.Decimal(cambio.stripeFeeAmount),
            montoNeto: new Prisma.Decimal(cambio.montoNeto),
          },
        })
      }
    }
  }

  console.log(`\nResumen: ${exitosos} preparados/aplicados, ${omitidos} omitidos, ${fallidos} fallidos.`)
  if (!aplicar) console.log('No se modificó la base de datos. Repite con --confirm para aplicar los cambios mostrados.')
  if (fallidos > 0) process.exitCode = 1
} finally {
  await prisma.$disconnect()
  await pool.end()
}
