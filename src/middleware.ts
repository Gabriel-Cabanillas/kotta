/**
 * Protege las rutas privadas de Kotta antes de que lleguen a las páginas o APIs.
 *
 * Contiene la lista de rutas públicas, la detección de la cookie `kotta-session`
 * y las redirecciones iniciales para usuarios autenticados o visitantes sin
 * sesión.
 *
 * Se relaciona con `src/lib/auth.ts`, las rutas de `src/app/api/auth/*`, las
 * páginas públicas de acceso y los dashboards protegidos bajo `src/app`.
 *
 * Existe para aplicar una primera barrera de navegación a nivel de Next.js y
 * evitar que las secciones privadas se carguen sin una sesión presente.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/privacidad',
  '/terminos',
  '/sign-in',
  '/sign-up',
  '/verificar',
  '/invitacion',
  '/api/auth/registro',
  '/api/auth/login',
  '/api/auth/verificar',
  '/api/auth/invitacion',
  '/api/auth/logout',
  '/api/auth/dev-codigo',
  '/api/webhooks/stripe',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.some((route) =>
    pathname === route || (route !== '/' && pathname.startsWith(`${route}/`))
  )
  const token    = req.cookies.get('kotta-session')?.value

  if (isPublic) {
    // Una cookie presente no garantiza acceso. Redirigir por su presencia
    // genera un bucle dashboard/sign-in para organizaciones bloqueadas.
    return NextResponse.next()
  }

  if (!token) {
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
