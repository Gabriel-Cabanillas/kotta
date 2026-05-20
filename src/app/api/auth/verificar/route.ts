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

export async function POST(req: Request) {
  try {
    const { email, codigo, tipo } = await req.json()

    if (!email || !codigo || !tipo) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Buscar código válido
    const verification = await (prisma as any).verificationCode.findFirst({
      where: {
        email,
        code:      codigo,
        type:      tipo,
        used:      false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 400 }
      )
    }

    // Marcar código como usado
    await (prisma as any).verificationCode.update({
      where: { id: verification.id },
      data:  { used: true },
    })

    // Activar usuario si es registro
    if (tipo === 'REGISTRO') {
      await (prisma as any).user.update({
        where: { email },
        data:  { isActive: true },
      })
    }

    // Crear sesión
    const user = await (prisma as any).user.findUnique({
      where:   { email },
      include: { org: true },
    })

    const token     = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

    await (prisma as any).session.create({
      data: { token, userId: user.id, expiresAt },
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
    console.error('Error en verificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
