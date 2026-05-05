import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { enviarCodigoVerificacion } from '@/lib/email'

function generarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo y contraseña son requeridos' }, { status: 400 })
    }

    const user = await (prisma as any).user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Tu cuenta no está activada. Revisa tu correo.' }, { status: 401 })
    }

    const passwordValido = await bcrypt.compare(password, user.password)
    if (!passwordValido) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 })
    }

    const codigo = generarCodigo()
    const expira = new Date(Date.now() + 10 * 60 * 1000)

    await (prisma as any).verificationCode.updateMany({
      where: { email, type: 'LOGIN', used: false },
      data:  { used: true },
    })

    await (prisma as any).verificationCode.create({
      data: { email, code: codigo, type: 'LOGIN', expiresAt: expira },
    })

    // Intentar enviar correo — si falla, igual dejamos pasar (modo desarrollo)
    try {
      await enviarCodigoVerificacion(email, codigo, 'login')
    } catch (emailError) {
      console.warn('⚠️ No se pudo enviar el correo (usa /api/auth/dev-codigo para obtener el código):', email)
    }

    return NextResponse.json({ ok: true, email })
  } catch (error: any) {
    console.error('Error en login:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}