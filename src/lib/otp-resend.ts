import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { enviarCodigoVerificacion } from '@/lib/email'
import { emitirCodigo, OTP_CHALLENGE_COOKIE, OTP_CHALLENGE_SECONDS, setOtpChallenge, type OtpType } from '@/lib/otp'

export async function reenviarCodigo(req: Request, type: OtpType) {
  try {
    const { email } = await req.json()
    const challenge = cookies().get(OTP_CHALLENGE_COOKIE)?.value
    if (typeof email !== 'string' || !email || !challenge || !/^[a-f0-9]{64}$/.test(challenge)) {
      return NextResponse.json({ error: 'Inicia nuevamente la verificación.' }, { status: 400 })
    }
    const issued = await prisma.$transaction(async (tx) => {
      const eligible = await tx.user.updateMany({
        where: { email, ...(type === 'LOGIN'
          ? { isActive: true, role: { in: ['KOTTA_STAFF', 'ADMIN', 'VECINO', 'PROVEEDOR', 'GUARDIA'] as const } }
          : { isActive: false, role: 'ADMIN' as const, orgId: { not: null } }) },
        data: { isActive: type === 'LOGIN' },
      })
      if (eligible.count !== 1) return null
      const previous = await tx.verificationCode.findFirst({
        where: { id: challenge, email, type, used: false,
          createdAt: { gt: new Date(Date.now() - OTP_CHALLENGE_SECONDS * 1000) } },
        select: { id: true },
      })
      if (!previous) return null
      return emitirCodigo(tx, email, type)
    })
    if (!issued) return NextResponse.json({ error: 'Inicia nuevamente la verificación.' }, { status: 400 })
    if ('retryAfter' in issued) {
      return NextResponse.json({ error: 'Espera antes de solicitar otro código.' }, {
        status: 429, headers: { 'Retry-After': String(issued.retryAfter) },
      })
    }
    let response: NextResponse
    try {
      await enviarCodigoVerificacion(email, issued.code, type === 'LOGIN' ? 'login' : 'registro')
      response = NextResponse.json({ ok: true })
    } catch {
      response = NextResponse.json({ error: 'No pudimos enviar el correo. Intenta nuevamente en un minuto.' }, { status: 503 })
    }
    // También ante un fallo de entrega: conserva la posibilidad de reintentar,
    // sin revivir el código anterior ni saltarse el cooldown persistido.
    setOtpChallenge(response, issued.id)
    return response
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
