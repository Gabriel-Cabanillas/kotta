import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get('kotta-session')?.value

  if (!token) return null

  const session = await (prisma as any).session.findUnique({
    where:   { token },
    include: {
      user: {
        include: { org: true },
      },
    },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await (prisma as any).session.delete({ where: { token } })
    return null
  }

  return session.user
}