import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/verificar',
  '/invitacion',
  '/api/auth/registro',
  '/api/auth/login',
  '/api/auth/verificar',
  '/api/auth/invitacion',
  '/api/auth/logout',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const token    = req.cookies.get('kotta-session')?.value

 if (isPublic) {
    // Si ya tiene sesión y va a login/registro → redirigir al dashboard
    if (token && (pathname === '/sign-in' || pathname === '/sign-up')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!token) return NextResponse.redirect(new URL('/sign-in', req.url))

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}