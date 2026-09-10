import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

// Solo código real transpilado en memoria + dobles. No se importan clientes de
// infraestructura. Este simulador no certifica el aislamiento real de Postgres.
const require = createRequire(import.meta.url)
const enums = require('@prisma/client')
const admin = { id: 'admin-a', role: 'ADMIN', orgId: 'org-a' }
const resident = { id: 'resident-a', role: 'VECINO', orgId: 'org-a' }
const post = (body) => new Request('http://kotta.test/api', { method: 'POST', body: JSON.stringify(body), headers: { 'stripe-signature': 'FAKE_SIGNATURE' } })
const clone = (value) => structuredClone(value)
const blocked = new Proxy({}, { get: (_, key) => () => { throw new Error(`Stripe no simulado: ${String(key)}`) } })

function matches(row, where = {}) {
  if (!row) return false
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'OR') return expected.some((part) => matches(row, part))
    if (key === 'AND') return expected.every((part) => matches(row, part))
    const value = row[key]
    if (expected == null || typeof expected !== 'object') return value === expected
    if ('in' in expected) return expected.in.includes(value)
    if ('notIn' in expected) return !expected.notIn.includes(value)
    if ('startsWith' in expected) return typeof value === 'string' && value.startsWith(expected.startsWith)
    if ('contains' in expected) return typeof value === 'string' && value.includes(expected.contains)
    if ('not' in expected) return value !== expected.not
    if (key === 'cargoId_viviendaId') return matches(row, expected)
    return matches(value, expected)
  })
}

function database(seed = {}) {
  const state = clone(seed)
  const writes = []
  const db = {}
  for (const model of ['pago', 'cargoDestinatario', 'workOrder', 'cuentaConectada', 'distribucionPago', 'webhookEvent', 'disputaStripe']) {
    state[model] ??= []
    const rows = (where) => state[model].filter((row) => matches(row, where))
    db[model] = {
      findUnique: async ({ where }) => clone(rows(where)[0] ?? null),
      findFirst: async ({ where }) => clone(rows(where)[0] ?? null),
      findMany: async ({ where }) => clone(rows(where)),
      create: async ({ data }) => {
        const row = { id: `${model}-${state[model].length}`, referencia: null, stripeTransferId: null, stripePaymentIntentId: null, workOrderId: null, origenManual: false, createdAt: new Date(), ...data }
        state[model].push(row); writes.push(model); return clone(row)
      },
      update: async ({ where, data }) => {
        const row = rows(where)[0]; assert.ok(row, `${model}.update debe encontrar una fila`)
        Object.assign(row, Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)))
        writes.push(model); return clone(row)
      },
      updateMany: async ({ where, data }) => {
        const selected = rows(where)
        selected.forEach((row) => Object.assign(row, data)); if (selected.length) writes.push(model)
        return { count: selected.length }
      },
      upsert: async ({ where, create, update }) => {
        const row = rows(where)[0]
        if (row) { Object.assign(row, update); return clone(row) }
        return db[model].create({ data: create })
      },
    }
  }
  let queue = Promise.resolve()
  db.$transaction = (work, options) => {
    assert.equal(options?.isolationLevel, 'Serializable')
    const result = queue.then(async () => {
      const before = clone(state)
      try { return await work(db) } catch (error) { Object.assign(state, before); throw error }
    })
    queue = result.catch(() => {})
    return result
  }
  return { db, state, writes }
}

function environment(seed = {}) {
  const storage = database(seed)
  return { ...storage, session: admin, notices: new Set(), cache: new Map(), stripe: {
    paymentIntents: blocked, refunds: blocked, disputes: blocked, transfers: blocked,
    charges: blocked, balanceTransactions: blocked, accounts: blocked,
    webhooks: { constructEvent: (raw) => JSON.parse(raw) },
  } }
}
function load(file, env) {
  if (env.cache.has(file)) return env.cache.get(file)
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { fileName: file, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  const notify = (kind) => async (id) => {
    if (env.failNotice) { env.failNotice = false; throw new Error('Notificación no disponible') }
    env.notices.add(`${kind}:${id}`) // Equivalente a las deduplicationKey existentes.
  }
  const dependencies = {
    '@prisma/client': enums,
    '@/lib/prisma': { prisma: env.db },
    '@/lib/auth': { getSession: async () => env.session },
    '@/lib/stripe': { stripe: env.stripe },
    '@/lib/stripe/balance': { obtenerLiquidezPlataformaMx: async () => ({ disponible: 10000, pendiente: 0 }), calcularDisponibleAhoraCoto: (a, b) => Math.max(0, Math.min(a, b)) },
    '@/lib/stripe/fees': { calcularRecargoTarjeta: (amount) => ({ montoCentavos: Math.round(amount * 100), montoConRecargo: amount }), calcularComisionPayoutEstimada: (amount) => ({ comisionEstimada: 1, totalDescontado: amount + 1 }) },
    '@/lib/notificaciones': { notificarPagoExitoso: notify('paid'), notificarPagoFallido: notify('failed'), notificarPagoReembolsado: notify('refund'), notificarDisputaAKottaStaff: notify('dispute') },
  }
  const exports = {}
  new Function('require', 'exports', 'console', code)((id) => {
    if (id === '@/lib/stripe/financial-safety') return load('src/lib/stripe/financial-safety.ts', env)
    if (Object.hasOwn(dependencies, id)) return dependencies[id]
    throw new Error(`Importación no aislada: ${id}`)
  }, exports, { error() {}, warn() {}, log() {} })
  env.cache.set(file, exports)
  return exports
}

const pago = (extra = {}) => ({ id: 'pago-a', orgId: 'org-a', cargoId: 'cargo-a', vecinoId: 'resident-a', tipoOperacion: 'CARGO', estado: 'PENDIENTE', monto: 100, montoOriginal: 100, montoConRecargo: 100, montoNeto: null, referencia: null, stripePaymentIntentId: 'pi-a', metodoPagoSeleccionado: 'tarjeta', enPlataforma: true, ...extra })
const charge = (extra = {}) => ({ id: 'ch-a', payment_intent: 'pi-a', amount: 10000, amount_refunded: 0, refunded: false, balance_transaction: 'bt-a', ...extra })
const intent = (extra = {}) => ({ id: 'pi-a', status: 'succeeded', amount: 10000, currency: 'mxn', latest_charge: 'ch-a', metadata: { orgId: 'org-a', pagoId: 'pago-a', cargoId: 'cargo-a', vecinoId: 'resident-a' }, ...extra })
const webhook = (env, type, id = 'evt-a', object = { id: 'pi-a' }) => load('src/app/api/webhooks/stripe/route.ts', env).POST(post({ id, type, data: { object } }))
function successfulCharge(env) {
  env.stripe.paymentIntents = { retrieve: async () => intent() }
  env.stripe.charges = { retrieve: async () => charge() }
  env.stripe.balanceTransactions = { retrieve: async () => ({ fee: 400, net: 9600 }) }
}

test('webhook fallido revierte efectos y puede reintentarse; repetido no duplica efectos', async () => {
  const env = environment({ pago: [pago()] }); successfulCharge(env)
  const update = env.db.pago.update
  let fail = true
  env.db.pago.update = async (args) => { await update(args); if (fail) { fail = false; throw new Error('DB interrumpida') } return env.state.pago[0] }
  assert.equal((await webhook(env, 'payment_intent.succeeded')).status, 503)
  assert.equal(env.state.webhookEvent.length, 0)
  assert.equal(env.state.pago[0].estado, 'PENDIENTE')
  assert.equal((await webhook(env, 'payment_intent.succeeded')).status, 200)
  assert.equal(env.state.pago[0].estado, 'PAGADO')
  assert.equal(env.state.pago[0].montoNeto, 96)
  const writes = env.writes.length
  assert.equal((await webhook(env, 'payment_intent.succeeded')).status, 200)
  assert.equal(env.writes.length, writes)
  assert.equal(env.notices.size, 1)
})

test('fallos de Stripe o notificación no dejan recibo de procesamiento definitivo', async () => {
  const env = environment({ pago: [pago()] }); successfulCharge(env)
  env.stripe.balanceTransactions.retrieve = async () => { throw new Error('Timeout') }
  assert.equal((await webhook(env, 'payment_intent.succeeded')).status, 503)
  assert.equal(env.state.webhookEvent.length, 0)
  successfulCharge(env); env.failNotice = true
  assert.equal((await webhook(env, 'payment_intent.succeeded')).status, 503)
  assert.equal(env.state.webhookEvent.length, 0)
  assert.equal(env.state.pago[0].estado, 'PAGADO')
  assert.equal((await webhook(env, 'payment_intent.succeeded')).status, 200)
  assert.equal(env.notices.size, 1)
})

test('webhooks simultáneos conservan un único recibo y valores financieros absolutos', async () => {
  const env = environment({ pago: [pago()] }); successfulCharge(env)
  const responses = await Promise.all([webhook(env, 'payment_intent.succeeded'), webhook(env, 'payment_intent.succeeded')])
  assert.ok(responses.every((response) => response.status === 200))
  assert.equal(env.state.webhookEvent.length, 1)
  assert.equal(env.state.pago[0].montoNeto, 96)
  assert.equal(env.notices.size, 1)
})

function paymentEnvironment(extra = {}) {
  const env = environment({ pago: [pago(extra)], cargoDestinatario: [{ cargoId: 'cargo-a', viviendaId: resident.id, cargo: { orgId: 'org-a', monto: 100 } }], cuentaConectada: [{ orgId: 'org-a', chargesEnabled: true }] })
  env.session = resident
  return env
}
const pay = (env, method = 'tarjeta') => load('src/app/api/pagos/vecino/pagar-cargo/route.ts', env).POST(post({ cargoId: 'cargo-a', metodoPagoSeleccionado: method }))

test('PI confirmado/processing/requires_capture/cancelado nunca crea otro, aun cambiando método', async () => {
  for (const status of ['succeeded', 'processing', 'requires_capture', 'canceled']) {
    const env = paymentEnvironment()
    env.stripe.paymentIntents = { retrieve: async () => intent({ status }), create: () => assert.fail('No debe crear otro PI') }
    assert.equal((await pay(env)).status, 409)
    assert.equal((await pay(env, 'spei')).status, 409)
  }
})

test('PI incierto no crea otro; requires_action reutiliza exactamente el existente', async () => {
  const env = paymentEnvironment()
  env.stripe.paymentIntents = { retrieve: async () => { throw new Error('Timeout') }, create: () => assert.fail('No crear') }
  assert.equal((await pay(env)).status, 503)
  env.stripe.paymentIntents.retrieve = async () => intent({ status: 'requires_action', client_secret: 'TEST_SECRET' })
  const response = await pay(env)
  assert.equal(response.status, 200)
  assert.equal((await response.json()).clientSecret, 'TEST_SECRET')
  assert.equal((await pay(env, 'spei')).status, 409)
})

test('dos solicitudes de PI sin ID: solo una puede crear; timeout conserva marca irreversible', async () => {
  const env = paymentEnvironment({ stripePaymentIntentId: null })
  let calls = 0
  env.stripe.paymentIntents = { create: async () => { calls++; throw new Error('Respuesta perdida después de crear') } }
  const responses = await Promise.all([pay(env), pay(env)])
  assert.deepEqual(responses.map((r) => r.status).sort(), [409, 503])
  assert.equal(calls, 1)
  assert.equal((await pay(env)).status, 409)
  assert.equal(calls, 1)
})

test('webhook recupera el ID de un PI creado cuya respuesta no llegó a Kotta', async () => {
  const env = environment({ pago: [pago({ stripePaymentIntentId: null, estado: 'PROCESANDO', referencia: 'payment-intent:reserved:v1' })] })
  successfulCharge(env)
  assert.equal((await webhook(env, 'payment_intent.succeeded')).status, 200)
  assert.equal(env.state.pago[0].stripePaymentIntentId, 'pi-a')
  assert.equal(env.state.pago[0].estado, 'PAGADO')
})

function transferEnvironment() {
  return environment({
    pago: [pago({ estado: 'PAGADO', monto: 1000, montoNeto: 1000 })],
    workOrder: [{ id: 'order-a', orgId: 'org-a', status: 'COMPLETADA', cost: 100, providerId: 'provider-a', provider: { orgId: 'org-a', role: 'PROVEEDOR', isActive: true }, ticket: { orgId: 'org-a', reportedBy: { orgId: 'org-a' } } }],
    cuentaConectada: [{ id: 'account-provider', proveedorId: 'provider-a', stripeAccountId: 'acct-provider', payoutsEnabled: true }, { id: 'account-org', orgId: 'org-a', stripeAccountId: 'acct-org', payoutsEnabled: true }],
  })
}
function simulatedTransfers(env) {
  const operations = new Map(); const calls = []
  let fail = true
  env.stripe.transfers = { create: async (params, options) => {
    calls.push(clone({ params, options }))
    if (!operations.has(options.idempotencyKey)) operations.set(options.idempotencyKey, { id: 'tr-a', ...params })
    if (fail) { fail = false; throw new Error('Timeout después de transferir') }
    return operations.get(options.idempotencyKey)
  } }
  return { operations, calls }
}
const withdrawalId = 'request-original-0001'
const transferRequest = (env, provider = false, amount = 100) => load(provider ? 'src/app/api/pagos/transferir-proveedor/route.ts' : 'src/app/api/pagos/admin/transferir-saldo-condominio/route.ts', env).POST(post(provider ? { ordenId: 'order-a' } : { monto: amount, solicitudId: withdrawalId }))

for (const provider of [false, true]) {
  test(`transfer ${provider ? 'proveedor' : 'condominio'}: retry conserva identidad/importe/destino y no duplica dinero`, async () => {
    const env = transferEnvironment(); const stripe = simulatedTransfers(env)
    assert.equal((await transferRequest(env, provider)).status, 503)
    assert.equal(env.state.distribucionPago[0].estado, 'PROCESANDO')
    const reference = env.state.distribucionPago[0].referencia
    assert.equal((await transferRequest(env, provider)).status, 200)
    assert.equal(env.state.distribucionPago[0].referencia, reference)
    assert.equal(stripe.calls.length, 2)
    assert.deepEqual(stripe.calls[0], stripe.calls[1])
    assert.equal(stripe.operations.size, 1)
    assert.equal((await transferRequest(env, provider)).status, 409)
    assert.equal(stripe.calls.length, 2)
  })
  test(`transfer ${provider ? 'proveedor' : 'condominio'}: rechaza cambiar importe o cuenta durante el retry`, async () => {
    const env = transferEnvironment(); const stripe = simulatedTransfers(env)
    await transferRequest(env, provider)
    if (provider) env.state.workOrder[0].cost = 500
    assert.equal((await transferRequest(env, provider, 500)).status, 409)
    if (provider) env.state.workOrder[0].cost = 100
    env.state.cuentaConectada[provider ? 0 : 1].stripeAccountId = 'acct-other'
    assert.equal((await transferRequest(env, provider)).status, 409)
    assert.equal(stripe.calls.length, 1)
    assert.equal(env.state.distribucionPago[0].monto, 100)
  })
}

test('transfer antiguo/resultado incierto fuera de ventana no se vuelve a crear', async () => {
  const env = transferEnvironment(); const stripe = simulatedTransfers(env)
  await transferRequest(env)
  const row = env.state.distribucionPago[0]
  const ref = load('src/lib/stripe/financial-safety.ts', env).readTransferReference(row.referencia)
  ref.reservedAt -= 25 * 60 * 60 * 1000
  row.referencia = `retiro:${withdrawalId}|transfer-v1:${JSON.stringify(ref)}`
  assert.equal((await transferRequest(env)).status, 409)
  row.referencia = `retiro:${withdrawalId}|intento:1`; row.estado = 'FALLIDO'
  assert.equal((await transferRequest(env)).status, 409)
  assert.equal(stripe.calls.length, 1)
})

test('respuesta HTTP de transfer no sobrescribe un reversal que el webhook ya confirmó', async () => {
  const env = transferEnvironment()
  env.stripe.transfers = { create: async (params) => {
    env.state.distribucionPago[0].estado = 'REEMBOLSADO'
    env.state.distribucionPago[0].stripeTransferId = 'tr-a'
    return { id: 'tr-a', ...params }
  } }
  assert.equal((await transferRequest(env)).status, 409)
  assert.equal(env.state.distribucionPago[0].estado, 'REEMBOLSADO')
})

test('refunds concurrentes: mitigación fail-closed, sin simular una reserva que aún no existe', async () => {
  const env = environment({ pago: [pago({ estado: 'PAGADO' }), pago({ id: 'pago-b', estado: 'PAGADO' })] })
  env.stripe.refunds = { create: () => assert.fail('Los refunds siguen bloqueados hasta la migración') }
  const handler = load('src/app/api/pagos/admin/reembolsar/route.ts', env)
  const responses = await Promise.all([handler.POST(post({ pagoId: 'pago-a' })), handler.POST(post({ pagoId: 'pago-b' }))])
  assert.ok(responses.every((r) => r.status === 409))
  assert.equal(env.writes.length, 0)
  env.session = { ...admin, orgId: 'org-b' }
  assert.equal((await handler.POST(post({ pagoId: 'pago-a' }))).status, 404)
})

test('refund parcial no marca todo REEMBOLSADO y bloquea nuevas salidas solo del tenant afectado', async () => {
  const env = environment({ pago: [pago({ estado: 'PAGADO' })] })
  env.stripe.refunds = { retrieve: async () => ({ id: 're-a', charge: 'ch-a', status: 'succeeded', amount: 2000 }) }
  env.stripe.charges = { retrieve: async () => charge({ amount_refunded: 2000 }) }
  assert.equal((await webhook(env, 'refund.updated', 'evt-refund', { id: 're-a' })).status, 200)
  assert.equal(env.state.pago[0].estado, 'PAGADO')
  assert.equal(env.notices.size, 0)
  const guard = load('src/lib/stripe/financial-safety.ts', env).assertFinancialOperationsAllowed
  await assert.rejects(guard(env.db, 'org-a'))
  await assert.doesNotReject(guard(env.db, 'org-b'))
})

test('refund completo confirmado no retrocede por charge parcial o pago exitoso atrasado', async () => {
  const env = environment({ pago: [pago({ estado: 'PAGADO' })] }); successfulCharge(env)
  env.stripe.charges.retrieve = async () => charge({ amount_refunded: 10000, refunded: true })
  assert.equal((await webhook(env, 'charge.refunded', 'evt-full', { id: 'ch-a' })).status, 200)
  assert.equal(env.state.pago[0].estado, 'REEMBOLSADO')
  env.stripe.charges.retrieve = async () => charge({ amount_refunded: 2000 })
  await webhook(env, 'charge.refunded', 'evt-old-partial', { id: 'ch-a' })
  await webhook(env, 'payment_intent.succeeded', 'evt-old-success')
  assert.equal(env.state.pago[0].estado, 'REEMBOLSADO')
})

test('disputa ganada no se reabre por snapshots atrasados ni sobrescribe un refund terminal', async () => {
  const env = environment({ pago: [pago({ estado: 'EN_DISPUTA' })] }); successfulCharge(env)
  let status = 'won'
  env.stripe.disputes = { retrieve: async () => ({ id: 'dp-a', charge: 'ch-a', payment_intent: 'pi-a', status, amount: 10000, currency: 'mxn', reason: 'fraudulent', created: 100 }) }
  await webhook(env, 'charge.dispute.closed', 'evt-won', { id: 'dp-a' })
  assert.equal(env.state.pago[0].estado, 'PAGADO')
  status = 'needs_response'
  await webhook(env, 'charge.dispute.created', 'evt-old', { id: 'dp-a' })
  assert.equal(env.state.disputaStripe[0].estadoStripe, 'won')
  assert.equal(env.state.pago[0].estado, 'PAGADO')
  env.state.pago[0].estado = 'REEMBOLSADO'
  status = 'lost'
  await webhook(env, 'charge.dispute.updated', 'evt-lost', { id: 'dp-a' })
  assert.equal(env.state.pago[0].estado, 'REEMBOLSADO')
})

test('reversal parcial conserva débito completo; reversal completo no se deshace por transfer.created atrasado', async () => {
  const env = transferEnvironment()
  const reference = load('src/lib/stripe/financial-safety.ts', env).transferReference('dist-a', { amount: 10000, currency: 'mxn', destination: 'acct-org', metadata: { orgId: 'org-a', distribucionId: 'dist-a' } }, withdrawalId)
  env.state.distribucionPago.push({ id: 'dist-a', orgId: 'org-a', cuentaConectadaId: 'account-org', monto: 100, estado: 'PAGADO', stripeTransferId: 'tr-a', referencia: reference })
  let reversed = 2000
  env.stripe.transfers = { retrieve: async () => ({ id: 'tr-a', amount: 10000, amount_reversed: reversed, reversed: reversed === 10000, currency: 'mxn', destination: 'acct-org', metadata: { distribucionId: 'dist-a', orgId: 'org-a' } }) }
  await webhook(env, 'transfer.reversed', 'evt-partial', { id: 'tr-a' })
  assert.equal(env.state.distribucionPago[0].estado, 'PAGADO')
  assert.equal(env.state.distribucionPago[0].monto, 100)
  assert.ok(env.state.distribucionPago[0].referencia.startsWith(`retiro:${withdrawalId}|`))
  reversed = 10000
  await webhook(env, 'transfer.reversed', 'evt-full', { id: 'tr-a' })
  assert.equal(env.state.distribucionPago[0].estado, 'REEMBOLSADO')
  reversed = 0
  await webhook(env, 'transfer.created', 'evt-late', { id: 'tr-a' })
  assert.equal(env.state.distribucionPago[0].estado, 'REEMBOLSADO')
})
