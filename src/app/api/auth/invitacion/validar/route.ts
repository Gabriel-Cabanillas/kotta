/**
 * Valida que un token de invitación pueda usarse para activar una cuenta.
 *
 * Contiene la lectura del token desde la URL y la consulta del código de tipo
 * `INVITACION` que aún no ha sido usado ni expirado.
 *
 * Se relaciona con `src/app/invitacion/page.tsx`,
 * `src/app/api/auth/invitacion/route.ts`,
 * `src/app/api/auth/invitacion/activar/route.ts` y `VerificationCode` en Prisma.
 *
 * Existe para mostrar el formulario de activación solo cuando la invitación sigue
 * siendo válida.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    const verification = await (prisma as any).verificationCode.findFirst({
      where: {
        code:      token,
        type:      'INVITACION',
        used:      false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Invitación inválida o expirada' },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, email: verification.email })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
