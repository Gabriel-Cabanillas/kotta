/**
 * Completa la verificación por código y crea la sesión de Kotta.
 *
 * Contiene la búsqueda del código vigente, su marcado como usado, la activación
 * de usuarios registrados y la creación de la cookie `kotta-session`.
 *
 * Se relaciona con `src/app/verificar/page.tsx`, `src/lib/auth.ts`,
 * `src/middleware.ts`, `src/lib/prisma.ts` y los modelos `Session` y
 * `VerificationCode`.
 *
 * Existe para convertir un código válido en una sesión autenticada que luego
 * `dashboard` puede redirigir según rol y organización.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

class InvalidVerificationError extends Error {}

export async function POST(req: Request) {
  try {
    const { email, codigo, tipo } = await req.json()

    if (typeof email !== 'string' || !email || typeof codigo !== 'string' || !codigo || !['LOGIN', 'REGISTRO'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    const token     = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

    await prisma.$transaction(async (tx) => {
      // Bloquear primero el usuario, igual que toggle, para serializar la revocación.
      // Cualquier fallo del código revierte también la activación de registro.
      const eligible = await tx.user.updateMany({
        where: {
          email,
          ...(tipo === 'LOGIN'
            ? { isActive: true, role: { in: ['KOTTA_STAFF', 'ADMIN', 'VECINO', 'PROVEEDOR', 'GUARDIA'] as const } }
            : { isActive: false, role: 'ADMIN' as const, orgId: { not: null } }),
        },
        data: { isActive: true },
      })
      if (eligible.count !== 1) throw new InvalidVerificationError()

      const verification = await tx.verificationCode.findFirst({
        where: { email, code: codigo, type: tipo, used: false, expiresAt: { gt: new Date() } },
        select: { id: true },
      })
      if (!verification) throw new InvalidVerificationError()
      const consumed = await tx.verificationCode.updateMany({
        where: { id: verification.id, used: false, expiresAt: { gt: new Date() } },
        data: { used: true },
      })
      if (consumed.count !== 1) throw new InvalidVerificationError()
      const user = await tx.user.findUniqueOrThrow({ where: { email }, select: { id: true } })
      await tx.session.create({ data: { token, userId: user.id, expiresAt } })
    })

    // Determinar redirección
    let redirectTo = '/dashboard'

    const response = NextResponse.json({ ok: true, redirectTo })
    response.cookies.set('kotta-session', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires:  expiresAt,
      path:     '/',
    })

    return response
  } catch (error: any) {
    if (error instanceof InvalidVerificationError) {
      return NextResponse.json({ error: 'Código inválido, expirado o cuenta inactiva' }, { status: 400 })
    }
    console.error('Error en verificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
