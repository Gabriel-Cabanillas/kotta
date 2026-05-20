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
 */
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get('kotta-session')?.value

  if (!token) return null

  const session = await (prisma as any).session.findUnique({
    where:   { token },
    include: {
      user: {
        include: { org: true },
      },
    },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await (prisma as any).session.delete({ where: { token } })
    return null
  }

  return session.user
}
