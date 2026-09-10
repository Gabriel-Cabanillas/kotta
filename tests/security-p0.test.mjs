import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import ts from 'typescript'

// Handlers/Server Components reales, transpilados solo en memoria. Ningún módulo
// de infraestructura se importa: una dependencia no declarada hace fallar el test.
const require = createRequire(import.meta.url)
const enums = require('@prisma/client')
const forbidden = new Proxy({}, { get: (_, key) => () => { throw new Error(`Servicio bloqueado: ${String(key)}`) } })
const admin = { id: 'admin-a', role: 'ADMIN', orgId: 'org-a', org: { slug: 'coto-a' } }
const resident = { id: 'resident-a', role: 'VECINO', orgId: 'org-a', org: { slug: 'coto-a' }, name: 'Residente A' }
const provider = { id: 'provider-a', role: 'PROVEEDOR', orgId: 'org-a', org: { slug: 'coto-a' }, name: 'Proveedor A' }
const hash = 'HASH_FICTICIO_QUE_NUNCA_DEBE_LLEGAR_AL_CLIENTE'
const future = () => new Date(Date.now() + 60_000)
const request = (body) => new Request('http://kotta.test/api', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

function load(file, { prisma = forbidden, session = admin, overrides = {}, expose } = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { fileName: file, compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText
  const dependencies = {
    'next/server': { NextResponse: class extends Response {
      static json(body, init) { const response = Response.json(body, init); response.cookies = { set() {} }; return response }
    } },
    'next/navigation': { redirect(path) { throw new Error(`REDIRECT:${path}`) } },
    'next/headers': { cookies: () => ({ get: () => ({ value: 'session-token' }) }) },
    'react': { cache: (fn) => fn, Suspense: 'Suspense' },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'crypto': { randomBytes },
    '@prisma/client': enums,
    '@/lib/prisma': { prisma },
    '@/lib/auth': { getSession: async () => session },
    '@/lib/email': { enviarInvitacion: async () => {}, enviarCodigoVerificacion: async () => {} },
    '@/lib/notificaciones': { notificarCargoAVecinos: async () => {} },
    'bcryptjs': { hash: async () => 'FAKE_HASH', compare: async () => true },
    '@/lib/stripe': { stripe: forbidden },
    '@/lib/stripe/fees': forbidden,
    '@/lib/stripe/financial-safety': forbidden,
    '@/lib/stripe/balance': { obtenerLiquidezPlataformaMx: async () => null, calcularDisponibleAhoraCoto: forbidden.calculate },
    'cloudinary': { v2: { config() {}, uploader: forbidden } },
    '@react-pdf/renderer': { renderToBuffer: async () => Buffer.from('FAKE_PDF') },
    '@/lib/pdf/ReporteProveedorDocument': { ReporteProveedorDocument: (props) => props },
    ...overrides,
  }
  const exports = {}
  const mockRequire = (id) => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id]
    if (id.startsWith('@/components/')) return { default: id }
    throw new Error(`Importación no aislada: ${id}`)
  }
  new Function('require', 'exports', 'console', compiled + (expose ? `\nexports.testData = ${expose};` : ''))(
    mockRequire, exports, { time() {}, timeEnd() {}, error() {}, warn() {} },
  )
  return exports
}

// Doble pequeño de Prisma: aplica los filtros/select enviados por el código real.
// No sustituye una prueba de integración PostgreSQL ni prueba sus bloqueos reales.
function matches(row, where = {}) {
  if (row == null) return false
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'OR') return expected.some((part) => matches(row, part))
    if (key === 'AND') return expected.every((part) => matches(row, part))
    const actual = row[key]
    if (expected == null || typeof expected !== 'object') return actual === expected
    if ('in' in expected) return expected.in.includes(actual)
    if ('not' in expected) return actual !== expected.not
    if ('gt' in expected) return actual > expected.gt
    if ('gte' in expected || 'lt' in expected) return (!('gte' in expected) || actual >= expected.gte) && (!('lt' in expected) || actual < expected.lt)
    if (key === 'cargoId_viviendaId' || key === 'orgId_userId_month_year') return matches(row, expected)
    return matches(actual, expected)
  })
}
function project(row, query = {}) {
  if (row == null || (query.where && !matches(row, query.where))) return null
  const result = query.select ? {} : Object.fromEntries(Object.entries(row).filter(([, value]) => value == null || typeof value !== 'object' || value instanceof Date))
  for (const [key, spec] of Object.entries(query.select ?? query.include ?? {})) {
    if (spec === true) result[key] = row[key]
    else if (Array.isArray(row[key])) result[key] = row[key].map((item) => project(item, spec)).filter(Boolean)
    else result[key] = project(row[key], spec)
  }
  return result
}
function database(seed = {}) {
  const state = structuredClone(seed)
  const writes = []
  const db = {}
  for (const model of ['user', 'organization', 'session', 'verificationCode', 'ticket', 'workOrder', 'cargo', 'cargoDestinatario', 'payment', 'pago', 'cuentaConectada', 'distribucionPago']) {
    state[model] ??= []
    const rows = (args = {}) => state[model].filter((row) => matches(row, args.where))
    db[model] = {
      findMany: async (args = {}) => rows(args).map((row) => project(row, args)),
      findFirst: async (args = {}) => project(rows(args)[0], args),
      findUnique: async (args = {}) => project(rows(args)[0], args),
      findUniqueOrThrow: async (args) => { const row = project(rows(args)[0], args); assert.ok(row); return row },
      count: async (args = {}) => rows(args).length,
      groupBy: async () => [],
      aggregate: async () => ({ _sum: { monto: 0 } }),
      create: async ({ data, ...args }) => { const row = { id: `${model}-${state[model].length}`, used: false, ...data }; state[model].push(row); writes.push(model); return project(row, args) },
      createMany: async ({ data }) => { state[model].push(...data); writes.push(model); return { count: data.length } },
      update: async ({ where, data }) => { const row = rows({ where })[0]; assert.ok(row); Object.assign(row, data); writes.push(model); return row },
      updateMany: async ({ where, data }) => { const selected = rows({ where }); selected.forEach((row) => Object.assign(row, data)); if (selected.length) writes.push(model); return { count: selected.length } },
      deleteMany: async ({ where }) => { const selected = rows({ where }); state[model] = state[model].filter((row) => !selected.includes(row)); writes.push(model); return { count: selected.length } },
      upsert: async ({ create }) => { state[model].push(create); writes.push(model); return create },
    }
  }
  db.$transaction = async (operation) => {
    if (Array.isArray(operation)) return Promise.all(operation)
    const before = structuredClone(state)
    try { return await operation(db) } catch (error) { Object.assign(state, before); throw error }
  }
  return { db, state, writes }
}
const userRow = (user, extra = {}) => ({ ...user, email: `${user.id}@example.test`, password: hash, phone: null, houseNumber: '1', isActive: true, ...extra })
const ticketRow = (extra = {}) => ({ id: 'ticket-a', orgId: 'org-a', reportedBy: userRow(resident), workOrder: null, createdAt: new Date(), ...extra })
const orderRow = (extra = {}) => ({ id: 'order-a', orgId: 'org-a', providerId: provider.id, provider: userRow(provider), ticketId: 'ticket-a', ticket: ticketRow(), status: 'PENDIENTE', createdAt: new Date(), distribucionesPago: [], ...extra })

for (const route of ['auth/invitacion', 'usuarios/crear']) {
  test(`${route}: rechaza roles privilegiados/desconocidos y orgId falsificado sin escrituras`, async () => {
    for (const role of ['KOTTA_STAFF', 'SUPERADMIN', 'UNKNOWN', null, ['ADMIN']]) {
      const { db, writes } = database()
      const response = await load(`src/app/api/${route}/route.ts`, { prisma: db }).POST(request({ role, orgId: 'org-a' }))
      assert.equal(response.status, 403)
      assert.deepEqual(writes, [])
    }
    const response = await load(`src/app/api/${route}/route.ts`).POST(request({ role: 'VECINO', orgId: 'org-b' }))
    assert.equal(response.status, 403)
  })
  test(`${route}: permite roles del coto y deriva orgId de la sesión`, async () => {
    for (const role of ['ADMIN', 'VECINO', 'PROVEEDOR', 'GUARDIA']) {
      const { db, state } = database({ organization: [{ id: 'org-a', name: 'Coto A' }] })
      const response = await load(`src/app/api/${route}/route.ts`, { prisma: db }).POST(request({ role, email: 'new@example.test', name: 'Nuevo', nombre: 'Nuevo' }))
      assert.equal(response.status, 200)
      assert.equal(state.user[0].orgId, 'org-a')
      assert.equal(state.user[0].role, role)
      assert.equal(state.user[0].isActive, false)
    }
  })
}

test('asignación: rechaza proveedor ajeno, rol incorrecto e inactivo; permite proveedor propio', async () => {
  for (const [extra, status] of [[{ orgId: 'org-b' }, 404], [{ role: 'VECINO' }, 404], [{ isActive: false }, 404], [{}, 200]]) {
    const { db, state, writes } = database({ ticket: [ticketRow()], user: [userRow(provider, extra)] })
    const response = await load('src/app/api/tickets/assign/route.ts', { prisma: db }).POST(request({ ticketId: 'ticket-a', providerId: provider.id }))
    assert.equal(response.status, status)
    if (status === 404) assert.deepEqual(writes, [])
    else assert.equal(state.workOrder[0].orgId, 'org-a')
  }
})

test('cargos: valida TODOS los destinatarios antes de crear cargo o notificar', async () => {
  for (const [extra, status] of [[{ orgId: 'org-b' }, 403], [{ role: 'ADMIN' }, 403], [{ isActive: false }, 403], [{}, 200]]) {
    const { db, state, writes } = database({ user: [userRow(resident), userRow(resident, { id: 'second', ...extra })] })
    const response = await load('src/app/api/pagos/asignar/crear/route.ts', { prisma: db }).POST(request({ concepto: 'Cuota', monto: 100, fechaLimite: '2026-10-01', viviendaIds: [resident.id, 'second'] }))
    assert.equal(response.status, status)
    if (status !== 200) assert.deepEqual(writes, [])
    else assert.equal(state.cargoDestinatario.length, 2)
  }
})

test('Payment legado: valida usuario y organización sin cambiar el upsert financiero', async () => {
  for (const [extra, status] of [[{ orgId: 'org-b' }, 404], [{ role: 'PROVEEDOR' }, 404], [{}, 200]]) {
    const { db, writes, state } = database({ user: [userRow(resident, extra)] })
    const response = await load('src/app/api/pagos/crear/route.ts', { prisma: db }).POST(request({ userId: resident.id, amount: 100, month: 9, year: 2026, status: 'PENDIENTE' }))
    assert.equal(response.status, status)
    if (status === 404) assert.deepEqual(writes, [])
    else assert.equal(state.payment[0].orgId, 'org-a')
    const existing = database({ payment: [{ id: 'payment-a', orgId: 'org-a', user: userRow(resident, extra) }] })
    const update = await load('src/app/api/pagos/actualizar/route.ts', { prisma: existing.db }).POST(request({ pagoId: 'payment-a', status: 'PAGADO' }))
    assert.equal(update.status, status)
    if (status === 404) assert.deepEqual(existing.writes, [])
  }
})

test('cargo cruzado existente: pagar-cargo rechaza antes de consultar cuentas o Stripe', async () => {
  const { db, writes } = database({ cargoDestinatario: [{ cargoId: 'cargo-b', viviendaId: resident.id, cargo: { orgId: 'org-b' } }] })
  db.cuentaConectada = forbidden
  const response = await load('src/app/api/pagos/vecino/pagar-cargo/route.ts', { prisma: db, session: resident }).POST(request({ cargoId: 'cargo-b', metodoPagoSeleccionado: 'tarjeta' }))
  assert.equal(response.status, 403)
  assert.deepEqual(writes, [])
})

test('órdenes cruzadas existentes: actualización/evidencia/transferencia fallan antes de efectos externos', async () => {
  for (const extra of [{ orgId: 'org-b' }, { ticket: ticketRow({ orgId: 'org-b' }) }, { ticket: ticketRow({ reportedBy: userRow(resident, { orgId: 'org-b' }) }) }]) {
    for (const route of ['proveedor/actualizar', 'proveedor/evidencia', 'ordenes/actualizar', 'pagos/transferir-proveedor']) {
      const { db, writes } = database({ workOrder: [orderRow(extra)] })
      const handler = load(`src/app/api/${route}/route.ts`, { prisma: db, session: route.startsWith('proveedor') ? provider : admin })
      const req = route.endsWith('evidencia') ? { formData: async () => new Map([['ordenId', 'order-a'], ['file', { arrayBuffer: forbidden.read }]]) } : request({ ordenId: 'order-a', status: 'CANCELADA' })
      assert.equal((await handler.POST(req)).status, 404)
      assert.deepEqual(writes, [])
    }
  }
  const { db } = database({ workOrder: [orderRow({ provider: userRow(provider, { orgId: 'org-b' }) })] })
  assert.equal((await load('src/app/api/pagos/transferir-proveedor/route.ts', { prisma: db }).POST(request({ ordenId: 'order-a' }))).status, 404)
})

test('proveedor: puede actualizar su orden propia; no la de otro proveedor', async () => {
  for (const [providerId, status] of [[provider.id, 200], ['other', 404]]) {
    const { db } = database({ workOrder: [orderRow({ providerId })] })
    const response = await load('src/app/api/proveedor/actualizar/route.ts', { prisma: db, session: provider }).POST(request({ ordenId: 'order-a', status: 'CANCELADA' }))
    assert.equal(response.status, status)
  }
})

for (const [file, expose, session] of [
  ['admin/usuarios', 'UsuariosData', admin], ['admin/tickets', 'TicketsData', admin],
  ['admin/ordenes', 'OrdenesData', admin], ['admin/pagos', 'PagosData', admin], ['proveedor', null, provider],
]) {
  test(`${file}: props cliente sin password ni hashes, incluso en relaciones anidadas`, async () => {
    const { db } = database({
      user: [userRow(resident), userRow(provider), userRow({ ...resident, id: 'guard-a', role: 'GUARDIA' })],
      ticket: [ticketRow({ workOrder: orderRow() })], workOrder: [orderRow()],
    })
    const page = load(`src/app/[coto]/${file}/page.tsx`, { prisma: db, session, expose })
    const tree = expose ? await page.testData({ orgId: 'org-a', coto: 'coto-a', statusFilter: 'TODOS' }) : await page.default({ params: { coto: 'coto-a' } })
    const serialized = JSON.stringify(tree)
    assert.ok(serialized.includes('Residente A'), 'El caso positivo conserva el nombre que usa la interfaz')
    assert.ok(!serialized.includes('password'))
    assert.ok(!serialized.includes(hash))
  })
}

test('pantallas proveedor/residente y reporte excluyen relaciones cruzadas preexistentes', async () => {
  const { db } = database({ workOrder: ['PENDIENTE', 'COMPLETADA'].map((status) => orderRow({ orgId: 'org-b', status, createdAt: new Date(2026, 8, 7), ticket: ticketRow({ title: 'DATO_AJENO' }) })), cargoDestinatario: [{ viviendaId: resident.id, cargo: { orgId: 'org-b', concepto: 'DATO_AJENO' } }] })
  for (const file of ['proveedor', 'proveedor/ordenes', 'vecino/pagos']) {
    const page = load(`src/app/[coto]/${file}/page.tsx`, { prisma: db, session: file.startsWith('proveedor') ? provider : resident })
    assert.ok(!JSON.stringify(await page.default({ params: { coto: 'coto-a' } })).includes('DATO_AJENO'))
  }
  let report
  const handler = load('src/app/api/proveedor/reporte/route.ts', { prisma: db, session: provider, overrides: { '@/lib/pdf/ReporteProveedorDocument': { ReporteProveedorDocument: (props) => { report = props; return props } } } })
  await handler.GET(new Request('http://kotta.test/api?month=9&year=2026'))
  assert.deepEqual(report.ordenes, [])
})

test('pagos admin: oculta contrapartes ajenas sin eliminar sus registros contables', async () => {
  const foreign = userRow(resident, { orgId: 'org-b', name: 'DATO_AJENO' })
  const { db } = database({
    cargo: [{ id: 'cargo-a', orgId: 'org-a', createdAt: new Date(), fechaLimite: future(), destinatarios: [{ vivienda: foreign }], pagos: [] }],
    pago: [{ id: 'pago-a', orgId: 'org-a', tipoOperacion: 'CARGO', estado: 'PAGADO', monto: 100, updatedAt: new Date(), vecino: foreign, cargo: { orgId: 'org-b', concepto: 'DATO_AJENO' } }],
    distribucionPago: [{ id: 'dist-a', orgId: 'org-a', monto: 50, montoOriginal: 50, destino: 'PROVEEDOR', estado: 'PAGADO', updatedAt: new Date(), workOrder: orderRow({ provider: foreign }) }],
  })
  const page = load('src/app/[coto]/admin/pagos/page.tsx', { prisma: db, expose: 'PagosData' })
  const tree = await page.testData({ orgId: 'org-a', coto: 'coto-a' })
  assert.ok(!JSON.stringify(tree).includes('DATO_AJENO'))
  assert.equal(tree.props.movimientos.length, 2)
  assert.deepEqual(tree.props.movimientos.map((row) => row.monto).sort((a, b) => a - b), [50, 100])
})

test('getSession: acepta los cinco roles oficiales activos; rechaza inactivos, expirados y SUPERADMIN', async () => {
  for (const role of ['KOTTA_STAFF', 'ADMIN', 'VECINO', 'PROVEEDOR', 'GUARDIA', 'SUPERADMIN']) {
    for (const isActive of [true, false]) {
      const { db } = database({ session: [{ token: 'session-token', expiresAt: future(), user: userRow({ ...resident, role }, { isActive }) }] })
      const session = await load('src/lib/auth.ts', { prisma: db }).getSession()
      assert.equal(Boolean(session), isActive && role !== 'SUPERADMIN')
      assert.ok(!JSON.stringify(session).includes(hash))
    }
  }
  const { db } = database({ session: [{ token: 'session-token', expiresAt: new Date(0), user: userRow(resident) }] })
  assert.equal(await load('src/lib/auth.ts', { prisma: db }).getSession(), null)
})

test('desactivar revoca todas las sesiones y códigos; reactivar no restaura los anteriores', async () => {
  const { db, state } = database({ user: [userRow(resident)], session: [{ userId: resident.id }, { userId: resident.id }, { userId: 'other' }], verificationCode: ['LOGIN', 'REGISTRO', 'INVITACION'].map((type) => ({ email: `${resident.id}@example.test`, type, used: false })) })
  const handler = load('src/app/api/usuarios/toggle/route.ts', { prisma: db })
  assert.equal((await handler.POST(request({ userId: resident.id, isActive: false }))).status, 200)
  assert.equal(state.user[0].isActive, false)
  assert.deepEqual(state.session, [{ userId: 'other' }])
  assert.ok(state.verificationCode.every((code) => code.used))
  assert.equal((await handler.POST(request({ userId: resident.id, isActive: true }))).status, 200)
  assert.deepEqual(state.session, [{ userId: 'other' }])
  assert.ok(state.verificationCode.every((code) => code.used))
})

test('toggle rechaza otros tenants, cuentas privilegiadas y isActive no booleano', async () => {
  for (const extra of [{ orgId: 'org-b' }, { role: 'KOTTA_STAFF' }, { role: 'SUPERADMIN' }]) {
    const { db, writes } = database({ user: [userRow(resident, extra)] })
    assert.equal((await load('src/app/api/usuarios/toggle/route.ts', { prisma: db }).POST(request({ userId: resident.id, isActive: false }))).status, 404)
    assert.deepEqual(writes, [])
  }
  assert.equal((await load('src/app/api/usuarios/toggle/route.ts').POST(request({ userId: resident.id, isActive: 'false' }))).status, 400)
})

test('verificación LOGIN: inactivo no obtiene sesión; activo consume código una sola vez', async () => {
  for (const isActive of [true, false]) {
    const { db, state } = database({ user: [userRow(resident, { isActive })], verificationCode: [{ id: 'code', email: `${resident.id}@example.test`, type: 'LOGIN', code: '123456', used: false, expiresAt: future() }] })
    const handler = load('src/app/api/auth/verificar/route.ts', { prisma: db })
    const body = { email: `${resident.id}@example.test`, tipo: 'LOGIN', codigo: '123456' }
    assert.equal((await handler.POST(request(body))).status, isActive ? 200 : 400)
    assert.equal(state.session.length, isActive ? 1 : 0)
    assert.equal((await handler.POST(request(body))).status, 400)
    assert.equal(state.session.length, isActive ? 1 : 0)
  }
  assert.equal((await load('src/app/api/auth/verificar/route.ts').POST(request({ email: 'a', tipo: 'INVITACION', codigo: 'token' }))).status, 400)
})

test('REGISTRO legítimo activa ADMIN; código revocado no reactiva y revierte la transacción', async () => {
  for (const used of [false, true]) {
    const { db, state } = database({ user: [userRow(admin, { isActive: false })], verificationCode: [{ id: 'code', email: 'admin-a@example.test', type: 'REGISTRO', code: '123456', used, expiresAt: future() }] })
    const response = await load('src/app/api/auth/verificar/route.ts', { prisma: db }).POST(request({ email: 'admin-a@example.test', tipo: 'REGISTRO', codigo: '123456' }))
    assert.equal(response.status, used ? 400 : 200)
    assert.equal(state.user[0].isActive, !used)
    assert.equal(state.session.length, used ? 0 : 1)
  }
})

test('activación de invitación: bloquea roles privilegiados y tokens revocados durante la activación', async () => {
  for (const role of ['KOTTA_STAFF', 'SUPERADMIN', 'ADMIN', 'VECINO', 'PROVEEDOR', 'GUARDIA']) {
    const { db, state } = database({ user: [userRow(resident, { isActive: false, role })], verificationCode: [{ id: 'code', email: `${resident.id}@example.test`, type: 'INVITACION', code: 'token', used: false, expiresAt: future() }] })
    const allowed = !['KOTTA_STAFF', 'SUPERADMIN'].includes(role)
    const response = await load('src/app/api/auth/invitacion/activar/route.ts', { prisma: db }).POST(request({ token: 'token', password: 'password-test' }))
    assert.equal(response.status, allowed ? 200 : 400)
    assert.equal(state.user[0].isActive, allowed)
  }
  const { db, state } = database({ user: [userRow(resident, { isActive: false })], verificationCode: [{ id: 'code', email: `${resident.id}@example.test`, type: 'INVITACION', code: 'token', used: false, expiresAt: future() }] })
  const response = await load('src/app/api/auth/invitacion/activar/route.ts', { prisma: db, overrides: { 'bcryptjs': { hash: async () => { state.verificationCode[0].used = true; return 'new-hash' } } } }).POST(request({ token: 'token', password: 'password-test' }))
  assert.equal(response.status, 400)
  assert.equal(state.user[0].isActive, false)
  assert.equal(state.user[0].password, hash)
})

test('login no emite código si la cuenta se desactiva mientras valida la contraseña', async () => {
  const { db, state } = database({ user: [userRow(resident)] })
  const response = await load('src/app/api/auth/login/route.ts', { prisma: db, overrides: { 'bcryptjs': { compare: async () => { state.user[0].isActive = false; return true } } } }).POST(request({ email: `${resident.id}@example.test`, password: 'test' }))
  assert.equal(response.status, 401)
  assert.deepEqual(state.verificationCode, [])
})
