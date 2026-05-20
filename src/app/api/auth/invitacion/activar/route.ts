/**
 * Activa una cuenta creada por invitación dentro de Kotta.
 *
 * Contiene la validación del token de invitación, las reglas mínimas de
 * contraseña, el hash de la contraseña final y la activación transaccional del
 * usuario junto con el marcado del token como usado.
 *
 * Se relaciona con `src/app/invitacion/page.tsx`,
 * `src/app/api/auth/invitacion/validar/route.ts`, `src/lib/prisma.ts` y los
 * modelos `User` y `VerificationCode`.
 *
 * Existe para completar el alta de usuarios invitados antes de que inicien el
 * flujo normal de verificación e ingreso.
 */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
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

    const hashedPassword = await bcrypt.hash(password, 12)

    await (prisma as any).$transaction([
      (prisma as any).user.update({
        where: { email: verification.email },
        data:  { password: hashedPassword, isActive: true },
      }),
      (prisma as any).verificationCode.update({
        where: { id: verification.id },
        data:  { used: true },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
