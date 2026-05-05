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