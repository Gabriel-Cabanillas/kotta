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