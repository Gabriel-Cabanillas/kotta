/**
 * Ruta API para activar o desactivar usuarios de un coto en Kotta.
 * Contiene la funcionalidad administrativa que cambia el campo isActive de un
 * usuario existente.
 * Se relaciona con getSession, prisma y las pantallas de administracion de
 * usuarios.
 * Existe para controlar el acceso de usuarios por organizacion, validando que
 * el ADMIN solo modifique cuentas dentro de su propio coto.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { userId: targetUserId, isActive } = await req.json()
  const target = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!target || target.orgId !== admin.orgId) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  await prisma.user.update({ where: { id: targetUserId }, data: { isActive } })
  return NextResponse.json({ ok: true })
}
