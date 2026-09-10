import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { randomBytes, randomInt } from 'node:crypto'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { NextResponse } = require('next/server')
const email = 'otp-qa@example.invalid'
const challenge = 'a'.repeat(64)
const minutesAgo = n => new Date(Date.now() - n * 60_000)
const request = body => new Request('http://kotta.test/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

function matches(row, where = {}) {
  return Object.entries(where).every(([key, expected]) => {
    const value = row[key]
    if (expected === null || typeof expected !== 'object') return value === expected
    if ('in' in expected && !expected.in.includes(value)) return false
    if ('not' in expected && value === expected.not) return false
    if ('gt' in expected && !(value > expected.gt)) return false
    if ('lt' in expected && !(value < expected.lt)) return false
    return true
  })
}
function project(row, select) {
  if (!row) return null
  return structuredClone(select ? Object.fromEntries(Object.keys(select).map(key => [key, row[key]])) : row)
}
function apply(row, data) {
  for (const [key, value] of Object.entries(data)) row[key] = value && typeof value === 'object' && 'increment' in value ? row[key] + value.increment : value
}
function environment(type = 'LOGIN', overrides = {}) {
  const state = {
    user: [{ id: 'qa-user', email, password: 'fake-hash', role: 'ADMIN', orgId: 'qa-org', isActive: type === 'LOGIN' }],
    verificationCode: [{ id: challenge, email, type, code: '123456', used: false, attempts: 0, createdAt: minutesAgo(2), expiresAt: new Date(Date.now() + 480_000) }],
    session: [], organization: [], kottaSubscription: [], kottaSubscriptionEvent: [],
  }
  const db = {}
  for (const model of Object.keys(state)) {
    const rows = (args = {}) => {
      const selected = state[model].filter(row => matches(row, args.where))
      if (args.orderBy) {
        const [key, order] = Object.entries(args.orderBy)[0]
        selected.sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (order === 'desc' ? -1 : 1))
      }
      return selected
    }
    db[model] = {
      findFirst: async args => project(rows(args)[0], args.select),
      findUnique: async args => project(rows(args)[0], args.select),
      findUniqueOrThrow: async args => { const row = rows(args)[0]; assert.ok(row); return project(row, args.select) },
      count: async args => rows(args).length,
      create: async ({ data, select }) => {
        const row = { id: `${model}-${state[model].length}`, createdAt: new Date(), used: false, attempts: 0, ...data }
        state[model].push(row)
        return project(row, select)
      },
      update: async ({ where, data }) => { const row = rows({ where })[0]; assert.ok(row); apply(row, data); return structuredClone(row) },
      updateMany: async ({ where, data }) => { const selected = rows({ where }); selected.forEach(row => apply(row, data)); return { count: selected.length } },
    }
  }
  // Serializa transacciones del doble y revierte excepciones. Las pruebas de
  // concurrencia no sustituyen una certificación de los locks de PostgreSQL.
  let queue = Promise.resolve()
  db.$transaction = work => {
    const result = queue.then(async () => {
      const before = structuredClone(state)
      try { return await work(db) } catch (error) { Object.assign(state, before); throw error }
    })
    queue = result.catch(() => {})
    return result
  }
  return { db, state, cookie: challenge, mails: [], modules: new Map(), env: { NODE_ENV: 'test' }, ...overrides }
}
function load(file, env) {
  if (env.modules.has(file)) return env.modules.get(file)
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { fileName: file, compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText
  const dependencies = {
    'next/server': { NextResponse },
    'next/headers': { cookies: () => ({ get: name => name === 'kotta-otp-challenge' && env.cookie ? { value: env.cookie } : undefined }) },
    'crypto': { randomBytes, randomInt: env.randomInt ?? randomInt },
    '@/lib/prisma': { prisma: env.db },
    '@/lib/email': { enviarCodigoVerificacion: async (...args) => { env.mails.push(args); if (env.deliveryFails) throw new Error('Simulated mail failure') } },
    'bcryptjs': { compare: async () => true, hash: async () => 'fake-hash' },
  }
  const exports = {}
  new Function('require', 'exports', 'console', 'process', compiled)(id => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id]
    if (['@/lib/otp', '@/lib/otp-resend'].includes(id)) return load(`src/${id.slice(2)}.ts`, env)
    throw new Error(`Dependencia no aislada: ${id}`)
  }, exports, { error() {}, warn() {} }, { env: env.env })
  env.modules.set(file, exports)
  return exports
}
const verify = (env, code = '123456', type = 'LOGIN') => load('src/app/api/auth/verificar/route.ts', env).POST(request({ email, codigo: code, tipo: type }))
const resend = (env, type = 'LOGIN', body = { email }) => load(`src/app/api/auth/${type.toLowerCase()}/reenviar/route.ts`, env).POST(request(body))

for (const type of ['LOGIN', 'REGISTRO']) {
  test(`${type}: código correcto funciona una vez y establece cookie segura`, async () => {
    const env = environment(type, { env: { NODE_ENV: 'production' } })
    const response = await verify(env, '123456', type)
    assert.equal(response.status, 200)
    assert.match(response.headers.get('set-cookie'), /HttpOnly/)
    assert.match(response.headers.get('set-cookie'), /Secure/)
    assert.equal((await verify(env, '123456', type)).status, 400)
    assert.equal(env.state.session.length, 1)
    assert.equal(env.state.verificationCode[0].used, true)
  })
  test(`${type}: quinto error queda persistido y bloquea incluso el código correcto`, async () => {
    const env = environment(type)
    for (let attempt = 1; attempt <= 5; attempt++) {
      assert.equal((await verify(env, '999999', type)).status, attempt === 5 ? 429 : 400)
      assert.equal(env.state.verificationCode[0].attempts, attempt)
      assert.equal(env.state.user[0].isActive, type === 'LOGIN')
    }
    assert.equal((await verify(env, '123456', type)).status, 429)
    assert.equal(env.state.verificationCode[0].attempts, 5)
    assert.equal(env.state.session.length, 0)
  })
  test(`${type}: cuatro errores permiten un acierto sin reiniciar attempts`, async () => {
    const env = environment(type)
    for (let i = 0; i < 4; i++) await verify(env, '999999', type)
    assert.equal((await verify(env, '123456', type)).status, 200)
    assert.equal(env.state.verificationCode[0].attempts, 4)
  })
  for (const condition of ['expired', 'used']) {
    test(`${type}: ${condition} falla sin crear sesión ni activar usuario`, async () => {
      const env = environment(type)
      Object.assign(env.state.verificationCode[0], condition === 'used' ? { used: true } : { expiresAt: minutesAgo(1) })
      assert.equal((await verify(env, '123456', type)).status, 400)
      assert.equal(env.state.session.length, 0)
      assert.equal(env.state.user[0].isActive, type === 'LOGIN')
    })
  }
  test(`${type}: reenvío emite otro código, invalida anterior y limita el siguiente`, async () => {
    const env = environment(type)
    const response = await resend(env, type)
    assert.equal(response.status, 200)
    const old = env.state.verificationCode[0]
    const current = env.state.verificationCode[1]
    assert.equal(old.used, true)
    assert.notEqual(current.code, old.code)
    assert.equal(current.attempts, 0)
    assert.match(current.code, /^\d{6}$/)
    assert.ok(current.expiresAt > new Date())
    assert.deepEqual(env.mails, [[email, current.code, type.toLowerCase()]])
    env.cookie = response.cookies.get('kotta-otp-challenge').value
    assert.equal(env.cookie, current.id)
    const limited = await resend(env, type)
    assert.equal(limited.status, 429)
    assert.ok(Number(limited.headers.get('retry-after')) > 0)
    assert.equal(env.state.verificationCode.length, 2)
    assert.equal(env.mails.length, 1)
    assert.equal((await verify(env, old.code, type)).status, 400)
    assert.equal((await verify(env, current.code, type)).status, 200)
  })
  test(`${type}: reenvío tras bloqueo/expiración crea una fila y nunca reinicia la anterior`, async () => {
    for (const condition of [{ attempts: 5 }, { expiresAt: minutesAgo(1) }]) {
      const env = environment(type)
      Object.assign(env.state.verificationCode[0], condition)
      const previous = structuredClone(env.state.verificationCode[0])
      assert.equal((await resend(env, type)).status, 200)
      assert.deepEqual(env.state.verificationCode[0], { ...previous, used: true })
      assert.equal(env.state.verificationCode[1].attempts, 0)
    }
  })
}

test('LOGIN: usuario desactivado no verifica ni reenvía', async () => {
  const env = environment()
  env.state.user[0].isActive = false
  assert.equal((await verify(env)).status, 400)
  assert.equal((await resend(env)).status, 400)
  assert.equal(env.state.session.length, 0)
  assert.equal(env.mails.length, 0)
})
test('REGISTRO: desactivación que revocó el código no se puede revertir por reenvío', async () => {
  const env = environment('REGISTRO')
  env.state.verificationCode[0].used = true
  assert.equal((await verify(env, '123456', 'REGISTRO')).status, 400)
  assert.equal((await resend(env, 'REGISTRO')).status, 400)
  assert.equal(env.state.user[0].isActive, false)
})
test('verificaciones concurrentes del mismo código solo crean una sesión', async () => {
  const env = environment()
  const responses = await Promise.all(Array.from({ length: 8 }, () => verify(env)))
  assert.equal(responses.filter(r => r.status === 200).length, 1)
  assert.equal(env.state.session.length, 1)
})
test('errores concurrentes no pierden incrementos ni exceden cinco intentos', async () => {
  const env = environment()
  const responses = await Promise.all(Array.from({ length: 10 }, () => verify(env, '999999')))
  assert.equal(env.state.verificationCode[0].attempts, 5)
  assert.equal(responses.filter(r => r.status === 400).length, 4)
  assert.equal(responses.filter(r => r.status === 429).length, 6)
  assert.equal(env.state.session.length, 0)
})
test('fallo de sesión revierte consumo y activación, sin dejar un acceso parcial', async () => {
  const env = environment('REGISTRO')
  env.db.session.create = async () => { throw new Error('Database unavailable') }
  assert.equal((await verify(env, '123456', 'REGISTRO')).status, 500)
  assert.equal(env.state.verificationCode[0].used, false)
  assert.equal(env.state.user[0].isActive, false)
})
test('un código anterior no funciona aunque exista una fila antigua sin revocar', async () => {
  const env = environment()
  env.state.verificationCode.push({ ...env.state.verificationCode[0], id: 'b'.repeat(64), code: '234567', createdAt: minutesAgo(1) })
  assert.equal((await verify(env)).status, 400)
  assert.equal(env.state.verificationCode[1].attempts, 1)
  assert.equal(env.state.session.length, 0)
})
test('login y registro generan códigos mediante crypto y crean capacidad HttpOnly de reenvío', async () => {
  for (const route of ['login', 'registro']) {
    let calls = 0
    const env = environment('LOGIN', { randomInt: (min, max) => { assert.equal(min, 100000); assert.equal(max, 1000000); calls++; return 654321 } })
    env.state.verificationCode = []
    if (route === 'registro') env.state.user = []
    const response = await load(`src/app/api/auth/${route}/route.ts`, env).POST(request({ email, password: 'Password-QA-123', nombreCoto: 'Coto QA' }))
    assert.equal(response.status, 200)
    assert.equal(calls, 1)
    assert.equal(env.state.verificationCode[0].code, '654321')
    assert.match(response.cookies.get('kotta-otp-challenge').value, /^[a-f0-9]{64}$/)
    assert.match(response.headers.get('set-cookie'), /HttpOnly/)
    assert.ok(!JSON.stringify(await response.json()).includes('654321'))
  }
})
test('generación evita repetir el código inmediatamente anterior', () => {
  const numbers = [123456, 234567]
  const env = environment('LOGIN', { randomInt: () => numbers.shift() })
  assert.equal(load('src/lib/otp.ts', env).generarCodigo('123456'), '234567')
})
test('login repetido no salta el cooldown del reenvío', async () => {
  const env = environment()
  assert.equal((await resend(env)).status, 200)
  const response = await load('src/app/api/auth/login/route.ts', env).POST(request({ email, password: 'valid' }))
  assert.equal(response.status, 429)
  assert.equal(env.mails.length, 1)
})
test('máximo cinco emisiones en 15 minutos aunque todas estén usadas', async () => {
  const env = environment()
  for (let i = 1; i < 5; i++) env.state.verificationCode.push({ ...env.state.verificationCode[0], id: `used-${i}`, used: true, createdAt: minutesAgo(2 + i) })
  const limited = await resend(env)
  assert.equal(limited.status, 429)
  assert.ok(Number(limited.headers.get('retry-after')) <= 9 * 60)
  const response = await load('src/app/api/auth/login/route.ts', env).POST(request({ email, password: 'valid' }))
  assert.equal(response.status, 429)
  assert.equal(env.state.verificationCode.length, 5)
  assert.equal(env.mails.length, 0)
})
test('reenvío requiere capacidad vigente del correo y tipo originales', async () => {
  for (const change of [env => { env.cookie = undefined }, env => { env.cookie = 'b'.repeat(64) }, env => { env.state.verificationCode[0].createdAt = minutesAgo(24 * 60 + 1) }, env => { env.state.verificationCode[0].email = 'other@example.invalid' }, env => { env.state.verificationCode[0].type = 'REGISTRO' }]) {
    const env = environment()
    change(env)
    assert.equal((await resend(env)).status, 400)
    assert.equal(env.mails.length, 0)
    assert.equal(env.state.verificationCode.length, 1)
  }
})
test('reenvíos concurrentes emiten solo un código', async () => {
  const env = environment()
  const responses = await Promise.all([resend(env), resend(env)])
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 400])
  assert.equal(env.mails.length, 1)
  assert.equal(env.state.verificationCode.length, 2)
})
test('fallo de correo conserva límites y permite reintento posterior con la capacidad nueva', async () => {
  const env = environment('LOGIN', { deliveryFails: true })
  const response = await resend(env)
  assert.equal(response.status, 503)
  env.cookie = response.cookies.get('kotta-otp-challenge').value
  assert.equal((await resend(env)).status, 429)
  assert.equal(env.state.verificationCode[0].used, true)
  assert.equal(env.mails.length, 1)
})
test('dev-codigo rechaza producción incluso con DEV_MODE=true, antes de consultar BD', async () => {
  for (const DEV_MODE of ['true', 'false', undefined]) {
    const env = environment('LOGIN', { env: { NODE_ENV: 'production', DEV_MODE } })
    env.db.verificationCode.findFirst = async () => { assert.fail('Producción no debe consultar códigos') }
    const response = await load('src/app/api/auth/dev-codigo/route.ts', env).GET(new Request(`http://kotta.test/api/auth/dev-codigo?email=${email}`))
    assert.equal(response.status, 404)
    assert.ok(!JSON.stringify(await response.json()).includes('123456'))
  }
})
test('dev-codigo exige opt-in local y excluye códigos expirados, usados o bloqueados', async () => {
  for (const condition of [{}, { used: true }, { attempts: 5 }, { expiresAt: minutesAgo(1) }]) {
    const env = environment('LOGIN', { env: { NODE_ENV: 'development', DEV_MODE: 'true' } })
    Object.assign(env.state.verificationCode[0], condition)
    const response = await load('src/app/api/auth/dev-codigo/route.ts', env).GET(new Request(`http://kotta.test/api/auth/dev-codigo?email=${email}`))
    assert.equal((await response.json()).codigo, Object.keys(condition).length ? null : '123456')
    assert.equal(response.headers.get('cache-control'), 'no-store')
  }
  for (const config of [{ NODE_ENV: 'development' }, { NODE_ENV: 'development', DEV_MODE: 'true', VERCEL_ENV: 'production' }]) {
    const env = environment('LOGIN', { env: config })
    assert.equal((await load('src/app/api/auth/dev-codigo/route.ts', env).GET(new Request(`http://kotta.test/api/auth/dev-codigo?email=${email}`))).status, 404)
  }
})
