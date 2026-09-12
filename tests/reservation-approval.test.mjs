import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { NextResponse } = require('next/server')
const admin = { id: 'admin-qa', orgId: 'org-qa', role: 'ADMIN' }
const original = { id: 'reservation-qa', amenityId: 'amenity-qa', amenity: { orgId: admin.orgId }, date: new Date(2099, 5, 21), startTime: '10:00', endTime: '12:00', status: 'PENDIENTE' }
const code = ts.transpileModule(readFileSync(new URL('../src/app/api/reservas/[id]/route.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function scenario({ reservation = {}, others = [], session = admin, beforeUpdate } = {}) {
  const row = structuredClone({ ...original, ...reservation })
  let locked = false
  let updates = 0
  const tx = {
    $queryRaw: async (strings, id, orgId) => {
      assert.match(strings.join('?'), /FOR UPDATE OF a/)
      locked = true
      return id === row.id && orgId === row.amenity.orgId ? [{ id: row.amenityId }] : []
    },
    amenityReservation: {
      findUnique: async () => { assert.ok(locked); return structuredClone(row) },
      findMany: async ({ where }) => {
        assert.ok(locked)
        return [row, ...others].filter(r => r.id !== where.id.not && r.amenityId === where.amenityId && r.date.getTime() === where.date.getTime() && where.status.in.includes(r.status))
      },
      updateMany: async ({ where, data }) => {
        assert.ok(locked)
        assert.equal(where.status, 'PENDIENTE')
        if (beforeUpdate) beforeUpdate(row)
        if (row.id !== where.id || row.amenityId !== where.amenityId || row.status !== where.status) return { count: 0 }
        updates++
        Object.assign(row, data)
        return { count: 1 }
      },
      findUniqueOrThrow: async () => structuredClone(row),
    },
  }
  const prisma = { $transaction: (work, options) => { assert.equal(options.isolationLevel, 'ReadCommitted'); return work(tx) } }
  const dependencies = { 'next/server': { NextResponse }, '@/lib/prisma': { prisma }, '@/lib/auth': { getSession: async () => session } }
  const exports = {}
  new Function('require', 'exports', code)(id => { assert.ok(Object.hasOwn(dependencies, id), id); return dependencies[id] }, exports)
  return { row, updates: () => updates, patch: (action = 'aprobar') => exports.PATCH(new Request('http://kotta.test/api/reservas/qa', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
  }), { params: { id: original.id } }) }
}

test('aprobación: pendiente libre pasa a confirmada', async () => {
  const env = scenario()
  assert.equal((await env.patch()).status, 200)
  assert.equal(env.row.status, 'CONFIRMADA')
  assert.equal(env.updates(), 1)
})
test('aprobación: cancelada o ya confirmada devuelve 409', async () => {
  for (const status of ['CANCELADA', 'CONFIRMADA']) {
    const env = scenario({ reservation: { status } })
    assert.equal((await env.patch()).status, 409)
    assert.equal(env.row.status, status)
    assert.equal(env.updates(), 0)
  }
})
test('aprobación: conflictos pendientes/confirmados, parciales y contenidos se rechazan', async () => {
  for (const status of ['PENDIENTE', 'CONFIRMADA']) {
    for (const [startTime, endTime] of [['10:00', '12:00'], ['09:00', '11:00'], ['11:00', '13:00'], ['10:30', '11:30'], ['09:00', '13:00']]) {
      const env = scenario({ others: [{ ...original, id: 'other', status, startTime, endTime }] })
      assert.equal((await env.patch()).status, 409)
      assert.equal(env.row.status, 'PENDIENTE')
    }
  }
})
test('aprobación: contiguas, canceladas y otros recursos/fechas no bloquean', async () => {
  for (const extra of [{ endTime: '10:00', startTime: '09:00' }, { startTime: '12:00', endTime: '13:00' }, { status: 'CANCELADA' }, { amenityId: 'other-amenity' }, { date: new Date(2099, 5, 22) }]) {
    assert.equal((await scenario({ others: [{ ...original, id: 'other', ...extra }] }).patch()).status, 200)
  }
})
test('aprobación: cancelación entre lectura y escritura no revive la reserva', async () => {
  const env = scenario({ beforeUpdate: row => { row.status = 'CANCELADA' } })
  assert.equal((await env.patch()).status, 409)
  assert.equal(env.row.status, 'CANCELADA')
  assert.equal(env.updates(), 0)
})
test('rechazo sigue disponible para resolver conflictos y conserva condición PENDIENTE', async () => {
  const env = scenario({ others: [{ ...original, id: 'other' }] })
  assert.equal((await env.patch('rechazar')).status, 200)
  assert.equal(env.row.status, 'CANCELADA')
  const canceled = scenario({ beforeUpdate: row => { row.status = 'CANCELADA' } })
  assert.equal((await canceled.patch('rechazar')).status, 409)
})
test('aprobación: conserva autorización de ADMIN y pertenencia al coto', async () => {
  for (const session of [null, { ...admin, role: 'VECINO' }, { ...admin, orgId: null }]) {
    assert.equal((await scenario({ session }).patch()).status, 403)
  }
  assert.equal((await scenario({ reservation: { amenity: { orgId: 'foreign' } } }).patch()).status, 404)
  assert.equal((await scenario().patch('invalid')).status, 400)
})
