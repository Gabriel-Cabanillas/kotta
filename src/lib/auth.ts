/**
 * Resuelve la sesión autenticada actual de Kotta desde la cookie del usuario.
 *
 * Contiene la lectura de `kotta-session`, la búsqueda de la sesión en base de
 * datos, la validación de expiración y la carga del usuario junto con su
 * organización.
 *
 * Se relaciona con `src/lib/prisma.ts`, `src/middleware.ts`, las rutas de
 * `src/app/api/auth/*` y las páginas protegidas por rol bajo `src/app`.
 *
 * Existe para ofrecer una forma compartida de conocer quién está usando la app
 * antes de renderizar dashboards, validar roles o ejecutar acciones privadas.
 *
 * getSession() esta envuelta en cache() de React: si layout.tsx y page.tsx
 * la llaman dentro del mismo request del servidor, la segunda llamada reutiliza
 * el resultado ya resuelto en vez de volver a consultar la base de datos. La
 * memoizacion es por request (se descarta al terminar), no persiste entre
 * navegaciones ni afecta la validacion de expiracion.
 */
import { cache } from 'react'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export const getSession = cache(async () => {
  const cookieStore = cookies()
  const token = cookieStore.get('kotta-session')?.value

  if (!token) return null

  // 1. Inicia el temporizador aquí
  console.time('[getSession] db query')

  const session = await (prisma as any).session.findUnique({
    where:   { token },




    select: {
    user: {
        select: {
            id: true,
            name: true,
            role: true,
            orgId: true,
            org: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            }
        }
    }
  }
})

  // 2. Termina el temporizador justo después de que la query de la DB responde
    console.timeEnd('[getSession] db query')

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await (prisma as any).session.delete({ where: { token } })
    return null
  }

  return session.user
})