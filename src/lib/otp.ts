import { randomBytes, randomInt } from 'crypto'
import type { Prisma } from '@prisma/client'
import type { NextResponse } from 'next/server'

export const OTP_MAX_ATTEMPTS = 5
export const OTP_TTL_MS = 10 * 60 * 1000
export const OTP_COOLDOWN_SECONDS = 60
const OTP_SEND_WINDOW_MS = 15 * 60 * 1000
const OTP_MAX_SENDS = 5
export const OTP_CHALLENGE_COOKIE = 'kotta-otp-challenge'
export const OTP_CHALLENGE_SECONDS = 24 * 60 * 60
export type OtpType = 'LOGIN' | 'REGISTRO'

export function generarCodigo(previous?: string): string {
  let code: string
  do { code = randomInt(100000, 1000000).toString() } while (code === previous)
  return code
}

// El llamador debe bloquear primero la fila del usuario dentro de esta misma
// transacción. Login, reenvío, verificación y desactivación comparten ese orden.
export async function emitirCodigo(tx: Prisma.TransactionClient, email: string, type: OtpType) {
  const now = new Date()
  const latest = await tx.verificationCode.findFirst({
    where: { email, type }, orderBy: { createdAt: 'desc' },
    select: { code: true, createdAt: true },
  })
  if (latest && now.getTime() - latest.createdAt.getTime() < OTP_COOLDOWN_SECONDS * 1000) {
    return { retryAfter: Math.max(1, Math.ceil((latest.createdAt.getTime() + OTP_COOLDOWN_SECONDS * 1000 - now.getTime()) / 1000)) } as const
  }
  const recent = await tx.verificationCode.count({
    where: { email, type, createdAt: { gt: new Date(now.getTime() - OTP_SEND_WINDOW_MS) } },
  })
  if (recent >= OTP_MAX_SENDS) {
    const oldest = await tx.verificationCode.findFirst({
      where: { email, type, createdAt: { gt: new Date(now.getTime() - OTP_SEND_WINDOW_MS) } },
      orderBy: { createdAt: 'asc' }, select: { createdAt: true },
    })
    return { retryAfter: Math.max(1, Math.ceil(((oldest?.createdAt.getTime() ?? now.getTime()) + OTP_SEND_WINDOW_MS - now.getTime()) / 1000)) } as const
  }

  const code = generarCodigo(latest?.code)
  await tx.verificationCode.updateMany({ where: { email, type, used: false }, data: { used: true } })
  // ID aleatorio como capacidad para reenvío; nunca se devuelve en JSON.
  const verification = await tx.verificationCode.create({
    data: { id: randomBytes(32).toString('hex'), email, type, code, expiresAt: new Date(now.getTime() + OTP_TTL_MS) },
    select: { id: true },
  })
  return { id: verification.id, code } as const
}

export function setOtpChallenge(response: NextResponse, id: string) {
  response.cookies.set(OTP_CHALLENGE_COOKIE, id, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/api/auth', maxAge: OTP_CHALLENGE_SECONDS,
  })
}
