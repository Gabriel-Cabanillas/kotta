import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// SOLO PARA DESARROLLO — eliminar antes de producción
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
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