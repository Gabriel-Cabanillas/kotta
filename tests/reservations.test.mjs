import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { NextResponse } = require('next/server')
const user = { id: 'resident-qa', role: 'VECINO', orgId: 'org-qa' }
const date = '2099-06-15'
const source = readFileSync(new URL('../src/app/api/reservas/crear/route.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText

function scenario({ reservations = [], amenity = {}, session = user } = {}) {
  const row = { id: 'amenity-qa', orgId: user.orgId, status: 'ACTIVA', weekDays: [0, 1, 2, 3, 4, 5, 6], startTime: '08:00', endTime: '22:00', requiresApproval: false, ...amenity }
  const state = structuredClone(reservations)
  let locked = false
  const tx = {
    $queryRaw: async (strings, id, orgId) => {
      assert.match(strings.join('?'), /FOR UPDATE/)
      locked = true
      return id === row.id && orgId === row.orgId ? [{ id }] : []
    },
    amenity: { findUnique: async () => { assert.ok(locked); return row } },
    amenityReservation: {
      findMany: async ({ where }) => {
        assert.ok(locked, 'La disponibilidad se consulta después del lock')
        return state.filter(r => r.amenityId === where.amenityId && r.date.getTime() === where.date.getTime() && where.status.in.includes(r.status))
      },
      create: async ({ data }) => { assert.ok(locked); const saved = { id: `reservation-${state.length}`, ...data }; state.push(saved); return saved },
    },
  }
  // Solo se ofrece $transaction: cualquier consulta accidental fuera de ella falla.
  const prisma = { $transaction: async (work, options) => {
    assert.equal(options.isolationLevel, 'ReadCommitted')
    try { return await work(tx) } finally { locked = false }
  } }
  const dependencies = { 'next/server': { NextResponse }, '@/lib/prisma': { prisma }, '@/lib/auth': { getSession: async () => session } }
  const exports = {}
  new Function('require', 'exports', compiled)(id => { assert.ok(Object.hasOwn(dependencies, id), id); return dependencies[id] }, exports)
  return { state, post: (body = {}) => exports.POST(new Request('http://kotta.test/api/reservas/crear', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amenityId: row.id, date, startTime: '10:00', endTime: '12:00', ...body }),
  })) }
}
const reservation = (extra = {}) => ({ amenityId: 'amenity-qa', date: new Date(2099, 5, 15), startTime: '10:00', endTime: '12:00', status: 'CONFIRMADA', ...extra })

test('reserva libre se crea dentro de la transacción', async () => {
  const env = scenario()
  assert.equal((await env.post()).status, 200)
  assert.equal(env.state.length, 1)
})
for (const status of ['PENDIENTE', 'CONFIRMADA']) {
  test(`${status}: rechaza mismo horario, solapamientos parciales y contención`, async () => {
    for (const [startTime, endTime] of [['10:00', '12:00'], ['09:00', '11:00'], ['11:00', '13:00'], ['10:30', '11:30'], ['09:00', '13:00']]) {
      const env = scenario({ reservations: [reservation({ status })] })
      assert.equal((await env.post({ startTime, endTime })).status, 409)
      assert.equal(env.state.length, 1)
    }
  })
}
test('horarios contiguos antes y después son válidos', async () => {
  for (const [startTime, endTime] of [['09:00', '10:00'], ['12:00', '13:00']]) {
    const env = scenario({ reservations: [reservation()] })
    assert.equal((await env.post({ startTime, endTime })).status, 200)
  }
})
test('otra amenidad o fecha y reservas canceladas no bloquean', async () => {
  for (const extra of [{ amenityId: 'other' }, { date: new Date(2099, 5, 16) }, { status: 'CANCELADA' }]) {
    assert.equal((await scenario({ reservations: [reservation(extra)] }).post()).status, 200)
  }
})
test('conserva aprobación requerida y controles de tenant y sesión', async () => {
  const pending = await scenario({ amenity: { requiresApproval: true } }).post()
  assert.equal((await pending.json()).status, 'PENDIENTE')
  assert.equal((await scenario({ amenity: { orgId: 'foreign-org' } }).post()).status, 404)
  assert.equal((await scenario({ session: null }).post()).status, 403)
  assert.equal((await scenario({ session: { ...user, orgId: null } }).post()).status, 403)
})
test('fechas y horas inválidas no pueden evitar el control de traslapes', async () => {
  for (const body of [{ date: '2099-02-30' }, { date: '2099-13-01' }, { startTime: 'NaN' }, { endTime: '24:00' }, { endTime: '11:60' }, { endTime: '09:00' }, { startTime: {} }]) {
    const env = scenario()
    assert.equal((await env.post(body)).status, 400)
    assert.equal(env.state.length, 0)
  }
})
test('conserva restricciones de estado, días y horario de amenidad', async () => {
  for (const amenity of [{ status: 'INACTIVA' }, { weekDays: [] }, { startTime: '11:00' }, { endTime: '11:00' }]) {
    assert.equal((await scenario({ amenity }).post()).status, 400)
  }
})
