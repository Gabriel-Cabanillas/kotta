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
  if (!admin || admin.role !== 'ADMIN' || !admin.orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { userId: targetUserId, isActive } = await req.json()
  if (typeof targetUserId !== 'string' || !targetUserId || typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const target = await prisma.user.findFirst({
    where: { id: targetUserId, orgId: admin.orgId, role: { in: ['ADMIN', 'VECINO', 'PROVEEDOR', 'GUARDIA'] } },
    select: { id: true, email: true },
  })
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: target.id, orgId: admin.orgId }, data: { isActive } })
    if (!isActive) {
      await tx.session.deleteMany({ where: { userId: target.id } })
      // Incluye invitaciones y registro: ningún código anterior puede reactivar la cuenta.
      await tx.verificationCode.updateMany({ where: { email: target.email, used: false }, data: { used: true } })
    }
  })
  return NextResponse.json({ ok: true })
}
