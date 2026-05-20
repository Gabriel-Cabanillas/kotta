/**
 * Expone el último código de verificación disponible para entornos de desarrollo.
 *
 * Contiene una ruta GET protegida por ambiente que consulta el código pendiente
 * más reciente de un correo para facilitar pruebas cuando el envío de email no
 * está disponible.
 *
 * Se relaciona con `src/app/api/auth/login/route.ts`,
 * `src/app/api/auth/registro/route.ts`, `src/app/verificar/page.tsx` y
 * `VerificationCode` en Prisma.
 *
 * Existe para desbloquear pruebas locales del flujo de verificación sin alterar
 * el comportamiento de producción.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.DEV_MODE !== 'true') {
    return NextResponse.json({ error: 'No disponible' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  const codigo = await (prisma as any).verificationCode.findFirst({
    where:   { email, used: false },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ codigo: codigo?.code ?? null })
}
