import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('kotta-session')?.value

    if (token) {
      await (prisma as any).session.deleteMany({ where: { token } })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.delete('kotta-session')
    return response
  } catch {
    return NextResponse.json({ ok: true })
  }
}