import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Fail-closed hasta disponer de una reserva de refunds persistente y atómica.
 * No usar DistribucionPago como si un refund fuera un retiro a Connect.
 */
export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN' || !user.orgId) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }
  const { pagoId } = await req.json() as { pagoId?: string }
  if (typeof pagoId !== 'string' || !pagoId) return Response.json({ error: 'Falta pagoId' }, { status: 400 })
  const pago = await prisma.pago.findFirst({
    where: { id: pagoId, orgId: user.orgId, tipoOperacion: 'CARGO', enPlataforma: true },
    select: { id: true },
  })
  if (!pago) return Response.json({ error: 'Pago no encontrado' }, { status: 404 })
  return Response.json({
    error: 'Reembolsos temporalmente bloqueados: falta una reserva atómica de saldo y conciliación de refunds. No se inició ninguna operación en Stripe.',
    code: 'REFUND_RESERVATION_REQUIRED',
  }, { status: 409 })
}
