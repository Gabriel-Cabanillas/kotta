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
import { OTP_MAX_ATTEMPTS, OTP_CHALLENGE_COOKIE } from '@/lib/otp'

class InvalidVerificationError extends Error {}

export async function POST(req: Request) {
  try {
    const { email, codigo, tipo } = await req.json()

    if (typeof email !== 'string' || !email || typeof codigo !== 'string' || !/^\d{6}$/.test(codigo) || !['LOGIN', 'REGISTRO'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    const token     = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

    const result = await prisma.$transaction(async (tx) => {
      // Bloquear primero el usuario, igual que toggle, para serializar la revocación.
      // REGISTRO permanece inactivo hasta consumir un código válido. Los errores
      // de OTP retornan un resultado para confirmar el contador, sin rollback.
      const eligible = await tx.user.updateMany({
        where: {
          email,
          ...(tipo === 'LOGIN'
            ? { isActive: true, role: { in: ['KOTTA_STAFF', 'ADMIN', 'VECINO', 'PROVEEDOR', 'GUARDIA'] as const } }
            : { isActive: false, role: 'ADMIN' as const, orgId: { not: null } }),
        },
        data: { isActive: tipo === 'LOGIN' },
      })
      if (eligible.count !== 1) return 'invalid'

      const verification = await tx.verificationCode.findFirst({
        where: { email, type: tipo }, orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, used: true, attempts: true, expiresAt: true },
      })
      if (!verification || verification.used || verification.expiresAt <= new Date()) return 'invalid'
      if (verification.attempts >= OTP_MAX_ATTEMPTS) return 'blocked'
      if (verification.code !== codigo) {
        const attempted = await tx.verificationCode.updateMany({
          where: { id: verification.id, used: false, attempts: { lt: OTP_MAX_ATTEMPTS }, expiresAt: { gt: new Date() } },
          data: { attempts: { increment: 1 } },
        })
        // attempts=5 inutiliza el código. No se reinicia nunca: un reenvío crea
        // otra fila; used queda reservado para consumo/revocación definitivos.
        return attempted.count === 1 && verification.attempts + 1 >= OTP_MAX_ATTEMPTS ? 'blocked' : 'invalid'
      }
      const consumed = await tx.verificationCode.updateMany({
        where: { id: verification.id, used: false, attempts: { lt: OTP_MAX_ATTEMPTS }, expiresAt: { gt: new Date() } },
        data: { used: true },
      })
      if (consumed.count !== 1) throw new InvalidVerificationError()
      if (tipo === 'REGISTRO') await tx.user.update({ where: { email }, data: { isActive: true } })
      const user = await tx.user.findUniqueOrThrow({ where: { email }, select: { id: true } })
      await tx.session.create({ data: { token, userId: user.id, expiresAt } })
      return 'ok'
    })
    if (result === 'blocked') {
      return NextResponse.json({ error: 'Código bloqueado tras 5 intentos incorrectos. Solicita uno nuevo.' }, { status: 429 })
    }
    if (result !== 'ok') throw new InvalidVerificationError()

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
    response.cookies.set(OTP_CHALLENGE_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth', maxAge: 0 })

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
