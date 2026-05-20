/**
 * Cierra la sesión autenticada actual de Kotta.
 *
 * Contiene la lectura de la cookie `kotta-session`, la eliminación de la sesión
 * persistida en base de datos y la limpieza de la cookie en la respuesta.
 *
 * Se relaciona con `src/lib/auth.ts`, `src/middleware.ts`, el modelo `Session`
 * de Prisma y los componentes o páginas que disparan cierre de sesión.
 *
 * Existe para invalidar el acceso del usuario tanto en navegador como en base de
 * datos sin depender solo de borrar la cookie local.
 */
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
