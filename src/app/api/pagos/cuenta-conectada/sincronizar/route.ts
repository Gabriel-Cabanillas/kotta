/**
 * Consulta directo a Stripe el estado real de la cuenta conectada
 * (chargesEnabled, payoutsEnabled, detailsSubmitted) y lo guarda en
 * CuentaConectada. Se relaciona con CuentaConectadaEmbed.tsx (se llama
 * al cerrar el formulario embebido) y hace lo mismo que el webhook
 * account.updated, pero de forma inmediata — sirve como red de
 * seguridad si el webhook no ha llegado todavía (por ejemplo, en
 * desarrollo local, si `stripe listen` no estaba corriendo).
 */
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 403 })

  let cuenta = null
  if (user.role === 'ADMIN' && user.orgId) {
    cuenta = await prisma.cuentaConectada.findUnique({ where: { orgId: user.orgId } })
  } else if (user.role === 'PROVEEDOR') {
    cuenta = await prisma.cuentaConectada.findUnique({ where: { proveedorId: user.id } })
  } else {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (!cuenta) return Response.json({ error: 'No encontrado' }, { status: 404 })

  const account = await stripe.accounts.retrieve(cuenta.stripeAccountId)

  const actualizada = await prisma.cuentaConectada.update({
    where: { id: cuenta.id },
    data: {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    },
  })

  return Response.json({
    chargesEnabled: actualizada.chargesEnabled,
    payoutsEnabled: actualizada.payoutsEnabled,
    detailsSubmitted: actualizada.detailsSubmitted,
  })
}