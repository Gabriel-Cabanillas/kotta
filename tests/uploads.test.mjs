import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { EventEmitter } from 'node:events'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { NextResponse } = require('next/server')
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0S8AAAAASUVORK5CYII=', 'base64')
const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKAP/2Q==', 'base64')
const WEBP = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64')
const image = (bytes = PNG, type = 'image/png', name = 'photo.png') => new File([bytes], name, { type })
const routes = [
  { label: 'ticket', file: 'src/app/api/tickets/crear/route.ts', method: 'POST', role: 'VECINO', field: 'foto', folder: 'tickets' },
  { label: 'evidencia', file: 'src/app/api/proveedor/evidencia/route.ts', method: 'POST', role: 'PROVEEDOR', field: 'file', folder: 'evidencias' },
  { label: 'amenidad nueva', file: 'src/app/api/amenidades/route.ts', method: 'POST', role: 'ADMIN', field: 'imagen', folder: 'amenidades' },
  { label: 'amenidad editada', file: 'src/app/api/amenidades/[id]/route.ts', method: 'PATCH', role: 'ADMIN', field: 'imagen', folder: 'amenidades' },
]

function matches(row, where) {
  return !!row && Object.entries(where).every(([key, value]) => value && typeof value === 'object' ? matches(row[key], value) : row[key] === value)
}
function environment(route) {
  const env = {
    session: { id: 'user-a', orgId: 'org-a', role: route.role }, uploads: [], writes: [], logs: [], modules: new Map(),
    order: { id: 'order-a', orgId: 'org-a', providerId: 'user-a', ticketId: 'ticket-a', ticket: { orgId: 'org-a', reportedBy: { orgId: 'org-a' } } },
    amenity: { id: 'amenity-a', orgId: 'org-a', imageUrl: 'https://res.cloudinary.com/qa/previous.webp' },
  }
  const save = model => async args => { env.writes.push({ model, ...args }); return { id: `${model}-a`, ...args.data } }
  env.prisma = {
    ticket: { count: async () => 0, create: save('ticket'), update: save('ticket') },
    workOrder: { findFirst: async ({ where }) => matches(env.order, where) ? env.order : null, update: save('workOrder') },
    amenity: { findUnique: async ({ where }) => matches(env.amenity, where) ? env.amenity : null, create: save('amenity'), update: save('amenity') },
    $transaction: async operations => Promise.all(operations),
  }
  env.cloudinary = {
    config: value => { env.config = value },
    uploader: { upload_stream: (options, callback) => {
      const stream = new EventEmitter()
      stream.end = buffer => {
        env.uploads.push({ options, buffer })
        queueMicrotask(() => {
          if (env.streamError) { stream.emit('error', new Error('SECRET_FROM_STREAM')); return }
          callback(env.cloudError, { resource_type: 'image', format: 'webp', width: 1, height: 1,
            public_id: `${options.folder}/${options.public_id}`, secure_url: `https://res.cloudinary.com/qa/image/upload/${options.folder}/${options.public_id}.webp`, ...env.cloudResult })
        })
      }
      return stream
    } },
  }
  return env
}
function load(file, env) {
  if (env.modules.has(file)) return env.modules.get(file)
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const dependencies = { 'server-only': {}, 'crypto': { randomBytes }, 'next/server': { NextResponse },
    '@/lib/prisma': { prisma: env.prisma }, '@/lib/auth': { getSession: async () => env.session }, 'cloudinary': { v2: env.cloudinary } }
  const exports = {}
  new Function('require', 'exports', 'process', 'console', code)(id => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id]
    if (id === '@/lib/cloudinary-upload') return load('src/lib/cloudinary-upload.ts', env)
    throw new Error(`Dependencia no aislada: ${id}`)
  }, exports, { env: { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'qa', CLOUDINARY_API_KEY: 'SECRET_KEY_SENTINEL', CLOUDINARY_API_SECRET: 'SECRET_SECRET_SENTINEL' } },
  { error: (...args) => env.logs.push(args), warn: (...args) => env.logs.push(args) })
  env.modules.set(file, exports)
  return exports
}
function invoke(route, env, file = image(), fields = {}) {
  const form = new FormData()
  for (const [key, value] of Object.entries({ title: 'QA ticket', description: 'QA', category: 'OTRO', orgId: 'org-a', ordenId: 'order-a', name: 'QA amenidad', startTime: '08:00', endTime: '22:00', ...fields })) form.set(key, value)
  if (file !== null) form.set(route.field, file)
  return load(route.file, env)[route.method](new Request('http://kotta.test/api', { method: route.method, body: form }), { params: { id: 'amenity-a' } })
}

for (const route of routes) {
  test(`${route.label}: JPEG, PNG y WebP válidos llegan al upload como imagen y se guardan`, async () => {
    for (const [bytes, type] of [[JPEG, 'image/jpeg'], [PNG, 'image/png'], [WEBP, 'image/webp']]) {
      const env = environment(route)
      assert.equal((await invoke(route, env, image(bytes, type))).status, 200)
      assert.equal(env.uploads.length, 1)
      assert.ok(env.writes.length > 0)
      assert.equal(env.uploads[0].options.resource_type, 'image')
      assert.equal(env.uploads[0].options.format, 'webp')
      assert.deepEqual(env.uploads[0].options.allowed_formats, ['jpg', 'png', 'webp'])
      assert.deepEqual(env.uploads[0].buffer, bytes)
    }
  })
  test(`${route.label}: tipos no permitidos se rechazan antes de Cloudinary`, async () => {
    for (const type of ['image/svg+xml', 'image/gif', 'application/pdf', 'application/octet-stream']) {
      const env = environment(route)
      assert.equal((await invoke(route, env, image(PNG, type, 'foto.jpg'))).status, 415)
      assert.equal(env.uploads.length, 0)
      assert.equal(env.writes.length, 0)
    }
  })
  test(`${route.label}: imagen mayor a 4 MB se rechaza`, async () => {
    const env = environment(route)
    assert.equal((await invoke(route, env, image(Buffer.alloc(4 * 1024 * 1024 + 1)))).status, 413)
    assert.equal(env.uploads.length, 0)
    assert.equal(env.writes.length, 0)
  })
  test(`${route.label}: imagen vacía o campo de texto se rechaza`, async () => {
    for (const value of [image(Buffer.alloc(0)), 'https://malicious.test/file.png']) {
      const env = environment(route)
      assert.equal((await invoke(route, env, value)).status, 400)
      assert.equal(env.uploads.length, 0)
      assert.equal(env.writes.length, 0)
    }
  })
  test(`${route.label}: MIME/nombre falsificados no evitan la comprobación de firma`, async () => {
    for (const file of [image(Buffer.from('<svg onload="alert(1)"></svg>')), image(PNG, 'image/jpeg', 'photo.jpg'), image(PNG.subarray(0, 4))]) {
      const env = environment(route)
      assert.equal((await invoke(route, env, file)).status, 415)
      assert.equal(env.uploads.length, 0)
      assert.equal(env.writes.length, 0)
    }
  })
  test(`${route.label}: corrupción rechazada por el decodificador no produce escrituras`, async () => {
    const env = environment(route)
    env.cloudError = { http_code: 400, message: 'Invalid image: SECRET_SECRET_SENTINEL' }
    const response = await invoke(route, env, image(PNG.subarray(0, 8)))
    assert.equal(response.status, 400)
    assert.equal(env.writes.length, 0)
    assert.ok(!JSON.stringify(await response.json()).includes('SECRET'))
    assert.deepEqual(env.logs, [])
  })
  test(`${route.label}: usuario incorrecto, sin sesión o sin tenant no sube archivos`, async () => {
    for (const session of [null, { id: 'other', role: 'GUARDIA', orgId: 'org-a' }, { id: 'user-a', role: route.role, orgId: null }]) {
      const env = environment(route)
      env.session = session
      assert.equal((await invoke(route, env)).status, 403)
      assert.equal(env.uploads.length, 0)
      assert.equal(env.writes.length, 0)
    }
  })
  test(`${route.label}: nombre y campos maliciosos no controlan folder, ID ni overwrite`, async () => {
    const env = environment(route)
    const fields = { folder: '../../other-org', public_id: 'existing-logo', overwrite: 'true', userId: 'other-user' }
    for (let i = 0; i < 2; i++) assert.equal((await invoke(route, env, image(PNG, 'image/png', '../../org-b/existing-logo.exe'), fields)).status, 200)
    const options = env.uploads.map(u => u.options)
    assert.notEqual(options[0].public_id, options[1].public_id)
    for (const option of options) {
      assert.equal(option.folder, `kotta/org-a/${route.folder}`)
      assert.match(option.public_id, /^[a-f0-9]{48}$/)
      assert.equal(option.overwrite, false)
      assert.equal(option.use_filename, false)
      assert.equal(option.unique_filename, true)
    }
  })
  test(`${route.label}: errores del SDK no filtran credenciales ni guardan cambios`, async () => {
    const env = environment(route)
    env.cloudError = { http_code: 401, message: 'SECRET_KEY_SENTINEL:SECRET_SECRET_SENTINEL', api_secret: 'SECRET_SECRET_SENTINEL' }
    const response = await invoke(route, env)
    assert.equal(response.status, 502)
    assert.ok(!JSON.stringify(await response.json()).includes('SECRET'))
    assert.equal(env.writes.length, 0)
    assert.deepEqual(env.logs, [])
  })
}

test('tickets: orgId ajeno se rechaza antes del upload', async () => {
  const env = environment(routes[0])
  assert.equal((await invoke(routes[0], env, image(), { orgId: 'org-b' })).status, 403)
  assert.equal(env.uploads.length, 0)
  assert.equal(env.writes.length, 0)
})
test('evidencia: orden/proveedor/tenant ajenos se rechazan antes del upload', async () => {
  for (const extra of [{ orgId: 'org-b' }, { providerId: 'other-provider' }, { ticket: { orgId: 'org-b', reportedBy: { orgId: 'org-a' } } }, { ticket: { orgId: 'org-a', reportedBy: { orgId: 'org-b' } } }]) {
    const env = environment(routes[1])
    Object.assign(env.order, extra)
    assert.equal((await invoke(routes[1], env)).status, 404)
    assert.equal(env.uploads.length, 0)
    assert.equal(env.writes.length, 0)
  }
})
test('amenidad editada: pertenencia al tenant se valida antes de leer el archivo', async () => {
  const env = environment(routes[3])
  env.amenity.orgId = 'org-b'
  assert.equal((await invoke(routes[3], env)).status, 404)
  assert.equal(env.uploads.length, 0)
  assert.equal(env.writes.length, 0)
})
test('amenidades y evidencias: orgId del formulario no cambia el destino del servidor', async () => {
  for (const route of routes.slice(1)) {
    const env = environment(route)
    assert.equal((await invoke(route, env, image(), { orgId: 'org-b' })).status, 200)
    assert.equal(env.uploads[0].options.folder, `kotta/org-a/${route.folder}`)
    if (route.label === 'amenidad nueva') assert.equal(env.writes[0].data.orgId, 'org-a')
  }
})
test('foto opcional ausente mantiene creación/edición; evidencia sigue siendo obligatoria', async () => {
  for (const route of routes) {
    const env = environment(route)
    assert.equal((await invoke(route, env, null)).status, route.field === 'file' ? 400 : 200)
    assert.equal(env.uploads.length, 0)
  }
})
test('quitar imagen continúa funcionando; imagen inválida no borra la anterior', async () => {
  const env = environment(routes[3])
  assert.equal((await invoke(routes[3], env, null, { removeImage: 'true' })).status, 200)
  assert.equal(env.writes[0].data.imageUrl, null)
  const invalid = environment(routes[3])
  assert.equal((await invoke(routes[3], invalid, image(Buffer.alloc(0)), { removeImage: 'true' })).status, 400)
  assert.equal(invalid.writes.length, 0)
})
test('límite se verifica antes de arrayBuffer y destinos del servidor se validan', async () => {
  const env = environment(routes[0])
  const { uploadImage } = load('src/lib/cloudinary-upload.ts', env)
  const large = image(Buffer.alloc(4 * 1024 * 1024 + 1))
  large.arrayBuffer = async () => assert.fail('No se debe leer un archivo demasiado grande')
  await assert.rejects(uploadImage(large, 'org-a', 'tickets'), error => error.status === 413)
  for (const orgId of ['../org-b', 'org/a', 'org\\a', '', 'org?x=1']) {
    await assert.rejects(uploadImage(image(), orgId, 'tickets'), error => error.status === 400)
  }
  await assert.rejects(uploadImage(image(), 'org-a', '../other'), error => error.status === 400)
  assert.equal(env.uploads.length, 0)
})
test('la transformación enviada por el SDK convierte explícitamente a WebP', async () => {
  const env = environment(routes[0])
  assert.equal((await invoke(routes[0], env, image(JPEG, 'image/jpeg'))).status, 200)
  const params = require('cloudinary').v2.utils.build_upload_params(env.uploads[0].options)
  assert.equal(params.transformation, 'f_webp,q_auto')
})

test('colisión, respuesta inválida o error del stream no se aceptan como upload correcto', async () => {
  for (const cloudResult of [{ existing: true }, { overwritten: true }, { resource_type: 'raw' }, { format: 'svg' }, { format: 'jpg' }, { secure_url: 'http://example.test/image' }, { width: 0 }]) {
    const env = environment(routes[0])
    env.cloudResult = cloudResult
    assert.equal((await invoke(routes[0], env)).status, 502)
    assert.equal(env.writes.length, 0)
  }
  const env = environment(routes[0])
  env.streamError = true
  assert.equal((await invoke(routes[0], env)).status, 502)
  assert.equal(env.writes.length, 0)
  assert.deepEqual(env.logs, [])
})
