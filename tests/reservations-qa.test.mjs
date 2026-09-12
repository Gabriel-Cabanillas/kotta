import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { randomUUID, randomBytes } from 'node:crypto'
import ts from 'typescript'

// Opt-in explícito. Usa solo fixtures nuevas de QA y nunca borra datos.
// Al terminar conserva el tenant/usuario inactivos y las reservas canceladas.
const enabled = process.env.RUN_RESERVATIONS_QA === '1'
const require = createRequire(import.meta.url)
const { NextResponse } = require('next/server')
const runId = `qa-reservations-${randomUUID()}`
let prisma, initialized = false
const orgId = runId
const userId = `${runId}-resident`
const amenityId = `${runId}-a`
const otherAmenityId = `${runId}-b`
const source = readFileSync(new URL('../src/app/api/reservas/crear/route.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText

function handler(database = prisma) {
  const dependencies = {
    'next/server': { NextResponse }, '@/lib/prisma': { prisma: database },
    // Se aísla autenticación; todas las lecturas, escrituras y locks de reservas son reales.
    '@/lib/auth': { getSession: async () => ({ id: userId, orgId, role: 'VECINO' }) },
  }
  const exports = {}
  new Function('require', 'exports', compiled)(id => { assert.ok(Object.hasOwn(dependencies, id), id); return dependencies[id] }, exports)
  return exports.POST
}
function post(day, body = {}, route = handler()) {
  return route(new Request('http://kotta.test/api/reservas/crear', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amenityId, date: `2099-06-${day}`, startTime: '10:00', endTime: '12:00', notes: runId, ...body }),
  }))
}
before(async () => {
  if (!enabled) return
  const env = require('dotenv').parse(readFileSync(new URL('../.env.local', import.meta.url)))
  assert.match(new URL(env.DATABASE_URL).hostname, /(^|\.)supabase\.(com|co)$/)
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL, max: 4, connectionTimeoutMillis: 10000 }) })
  await prisma.$transaction(async tx => {
    await tx.organization.create({ data: { id: orgId, slug: runId, name: 'QA concurrencia reservas', isActive: false } })
    await tx.user.create({ data: { id: userId, email: `${runId}@example.invalid`, name: 'QA reservas', role: 'VECINO', orgId, isActive: false, password: await require('bcryptjs').hash(randomBytes(32).toString('hex'), 10) } })
    await tx.amenity.createMany({ data: [amenityId, otherAmenityId].map(id => ({ id, orgId, name: id, status: 'ACTIVA', requiresApproval: false })) })
  }, { timeout: 15000 })
  initialized = true
  console.log(`Fixtures QA: ${runId}`)
})
after(async () => {
  if (!prisma) return
  try {
    if (initialized) {
      await prisma.$transaction(async tx => {
        const org = await tx.organization.findUnique({ where: { id: orgId }, select: { slug: true, isActive: true } })
        assert.equal(org?.slug, runId)
        assert.equal(org.isActive, false)
        await tx.amenityReservation.updateMany({ where: { amenityId: { in: [amenityId, otherAmenityId] }, userId }, data: { status: 'CANCELADA' } })
        await tx.amenity.updateMany({ where: { id: { in: [amenityId, otherAmenityId] }, orgId }, data: { status: 'INACTIVA' } })
      }, { timeout: 15000 })
      console.log('Fixtures QA conservadas: tenant/usuario/amenidades inactivos y reservas canceladas; sin borrados.')
    }
  } finally { await prisma.$disconnect() }
})

test('QA PostgreSQL: reserva libre permitida', { skip: !enabled }, async () => {
  assert.equal((await post('15')).status, 200)
})
test('QA PostgreSQL: mismo horario rechazado', { skip: !enabled }, async () => {
  assert.equal((await post('16')).status, 200)
  assert.equal((await post('16')).status, 409)
})
test('QA PostgreSQL: solapamiento parcial rechazado', { skip: !enabled }, async () => {
  assert.equal((await post('17')).status, 200)
  assert.equal((await post('17', { startTime: '11:00', endTime: '13:00' })).status, 409)
})
test('QA PostgreSQL: horario contiguo permitido', { skip: !enabled }, async () => {
  assert.equal((await post('18')).status, 200)
  assert.equal((await post('18', { startTime: '12:00', endTime: '13:00' })).status, 200)
})
test('QA PostgreSQL: amenidad distinta permitida', { skip: !enabled }, async () => {
  assert.equal((await post('19')).status, 200)
  assert.equal((await post('19', { amenityId: otherAmenityId })).status, 200)
})
test('QA PostgreSQL: dos transacciones concurrentes, exactamente una gana', { skip: !enabled }, async () => {
  const pids = new Set()
  let release
  const bothStarted = new Promise(resolve => { release = resolve })
  let timer
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('No arrancaron ambas transacciones')), 5000) })
  const database = { $transaction: (work, options) => prisma.$transaction(async tx => {
    const [backend] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`
    pids.add(backend.pid)
    if (pids.size === 2) release()
    await Promise.race([bothStarted, timeout])
    return work(new Proxy(tx, { get: (target, key) => {
      if (key !== 'amenityReservation') return target[key]
      return new Proxy(target.amenityReservation, { get: (model, method) => {
        if (method !== 'findMany') return model[method]
        return async args => {
          const rows = await model.findMany(args)
          // Amplía la ventana original de carrera sin simular ninguna operación SQL.
          await new Promise(resolve => setTimeout(resolve, 200))
          return rows
        }
      } })
    } }))
  }, options) }
  try {
    const route = handler(database)
    const responses = await Promise.all([post('20', {}, route), post('20', {}, route)])
    assert.equal(pids.size, 2, 'Dos conexiones PostgreSQL independientes')
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 409])
    assert.equal(await prisma.amenityReservation.count({ where: { amenityId, date: new Date(2099, 5, 20), status: { in: ['PENDIENTE', 'CONFIRMADA'] } } }), 1)
    console.log('Concurrencia real: 2 conexiones PostgreSQL; respuestas 200/409; 1 reserva activa.')
  } finally { clearTimeout(timer) }
})

function mutationHandler(file, role, database = prisma) {
  const compiled = ts.transpileModule(readFileSync(new URL(`../src/app/api/reservas/${file}/route.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const dependencies = { 'next/server': { NextResponse }, '@/lib/prisma': { prisma: database },
    '@/lib/auth': { getSession: async () => ({ id: userId, orgId, role }) } }
  const exports = {}
  new Function('require', 'exports', compiled)(id => { assert.ok(Object.hasOwn(dependencies, id), id); return dependencies[id] }, exports)
  return exports
}
function approve(id, database = prisma, action = 'aprobar') {
  return mutationHandler('[id]', 'ADMIN', database).PATCH(new Request('http://kotta.test/api/reservas/qa', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
  }), { params: { id } })
}
function cancel(id, database = prisma) {
  return mutationHandler('cancelar', 'VECINO', database).POST(new Request('http://kotta.test/api/reservas/cancelar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reservaId: id }),
  }))
}
const pending = (day, extra = {}, database = prisma) => database.amenityReservation.create({ data: {
  amenityId, userId, date: new Date(2099, 5, day), startTime: '10:00', endTime: '12:00', status: 'PENDIENTE', notes: runId, ...extra,
} })
function signal() {
  let resolve, timer
  const ready = new Promise((res, reject) => { resolve = res; timer = setTimeout(() => reject(new Error('Intercalado concurrente no alcanzado')), 7000) })
  return { ready, release: () => { clearTimeout(timer); resolve() }, dispose: () => clearTimeout(timer) }
}

test('QA aprobación: pendiente libre se confirma', { skip: !enabled }, async () => {
  const row = await pending(21)
  assert.equal((await approve(row.id)).status, 200)
  assert.equal((await prisma.amenityReservation.findUnique({ where: { id: row.id } })).status, 'CONFIRMADA')
})
test('QA aprobación: cancelada no se confirma', { skip: !enabled }, async () => {
  const row = await pending(22, { status: 'CANCELADA' })
  assert.equal((await approve(row.id)).status, 409)
  assert.equal((await prisma.amenityReservation.findUnique({ where: { id: row.id } })).status, 'CANCELADA')
})
test('QA aprobación: ve un conflicto confirmado mientras esperaba el lock', { skip: !enabled }, async () => {
  const row = await pending(23)
  const lockHeld = signal(), atLock = signal()
  const writer = prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "amenities" WHERE "id" = ${amenityId} FOR UPDATE`
    lockHeld.release()
    await atLock.ready
    // Fixture de conflicto legado. La creación normal ya prohíbe este solape.
    await pending(23, { status: 'CONFIRMADA', startTime: '11:00', endTime: '13:00' }, tx)
  }, { timeout: 10000 })
  try {
    await lockHeld.ready
    const database = { $transaction: (work, options) => prisma.$transaction(tx => work(new Proxy(tx, { get: (target, key) => {
      if (key !== '$queryRaw') return target[key]
      return (...args) => { atLock.release(); return target.$queryRaw(...args) }
    } })), options) }
    const results = await Promise.allSettled([writer, approve(row.id, database)])
    for (const result of results) assert.equal(result.status, 'fulfilled')
    assert.equal(results[1].value.status, 409)
    assert.equal((await prisma.amenityReservation.findUnique({ where: { id: row.id } })).status, 'PENDIENTE')
  } finally { lockHeld.dispose(); atLock.dispose() }
})
test('QA aprobación/cancelación: cancelar después de leer PENDIENTE impide reconfirmar', { skip: !enabled }, async () => {
  const row = await pending(24)
  let cancellation
  const database = { $transaction: (work, options) => prisma.$transaction(tx => work(new Proxy(tx, { get: (target, key) => {
    if (key !== 'amenityReservation') return target[key]
    return new Proxy(target.amenityReservation, { get: (model, method) => {
      if (method !== 'findMany') return model[method]
      return async args => {
        const rows = await model.findMany(args)
        cancellation = await cancel(row.id) // Otra conexión confirma CANCELADA antes del UPDATE condicional.
        return rows
      }
    } })
  } })), options) }
  assert.equal((await approve(row.id, database)).status, 409)
  assert.equal(cancellation.status, 200)
  assert.equal((await prisma.amenityReservation.findUnique({ where: { id: row.id } })).status, 'CANCELADA')
})
test('QA aprobación/cancelación: si aprobar gana el UPDATE, cancelar espera y queda CANCELADA', { skip: !enabled }, async () => {
  const row = await pending(25)
  const cancelAtUpdate = signal()
  let cancellation
  const cancelDb = new Proxy(prisma, { get: (target, key) => {
    if (key !== 'amenityReservation') return target[key]
    return new Proxy(target.amenityReservation, { get: (model, method) => {
      if (method !== 'update') return model[method]
      return args => { cancelAtUpdate.release(); return model.update(args) }
    } })
  } })
  const database = { $transaction: (work, options) => prisma.$transaction(tx => work(new Proxy(tx, { get: (target, key) => {
    if (key !== 'amenityReservation') return target[key]
    return new Proxy(target.amenityReservation, { get: (model, method) => {
      if (method !== 'updateMany') return model[method]
      return async args => {
        const changed = await model.updateMany(args)
        cancellation = cancel(row.id, cancelDb)
        await cancelAtUpdate.ready
        return changed
      }
    } })
  } })), options) }
  try {
    assert.equal((await approve(row.id, database)).status, 200)
    assert.equal((await cancellation).status, 200)
    assert.equal((await prisma.amenityReservation.findUnique({ where: { id: row.id } })).status, 'CANCELADA')
  } finally { cancelAtUpdate.dispose() }
})
test('QA aprobaciones conflictivas: dos pendientes legadas se rechazan sin confirmar ambas', { skip: !enabled }, async () => {
  const first = await pending(26)
  const second = await pending(26, { startTime: '11:00', endTime: '13:00' })
  const both = signal()
  const pids = new Set()
  const database = { $transaction: (work, options) => prisma.$transaction(async tx => {
    const [backend] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`
    pids.add(backend.pid)
    if (pids.size === 2) both.release()
    await both.ready
    return work(tx)
  }, options) }
  try {
    const responses = await Promise.all([approve(first.id, database), approve(second.id, database)])
    assert.equal(pids.size, 2)
    assert.deepEqual(responses.map(r => r.status), [409, 409])
    assert.equal(await prisma.amenityReservation.count({ where: { id: { in: [first.id, second.id] }, status: 'CONFIRMADA' } }), 0)
  } finally { both.dispose() }
})
test('QA resolver conflicto: rechazar una pendiente permite aprobar solo la otra', { skip: !enabled }, async () => {
  const first = await pending(27)
  const second = await pending(27)
  assert.equal((await approve(second.id, prisma, 'rechazar')).status, 200)
  const responses = await Promise.all([approve(first.id), approve(second.id)])
  assert.deepEqual(responses.map(r => r.status), [200, 409])
  assert.equal(await prisma.amenityReservation.count({ where: { id: { in: [first.id, second.id] }, status: { in: ['PENDIENTE', 'CONFIRMADA'] } } }), 1)
})
