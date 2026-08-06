/**
 * Genera el client_secret temporal (Account Session) que el frontend usa
 * para mostrar el formulario embebido de Stripe (onboarding/edición de
 * datos bancarios) dentro de la interfaz de Kotta.
 * Se relaciona con el endpoint de creación de cuenta (paso 1.1) y con el
 * componente ConfiguracionForm.tsx / ProveedorCuentaPago.tsx (paso 1.3).
 * Existe porque el componente embebido de Stripe no puede mostrarse sin
 * este boleto temporal ligado a la cuenta conectada específica.
 */
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSession()

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  let cuenta = null

  if (user.role === 'ADMIN' && user.orgId) {
    cuenta = await prisma.cuentaConectada.findUnique({
      where: { orgId: user.orgId },
    })
  } else if (user.role === 'PROVEEDOR') {
    cuenta = await prisma.cuentaConectada.findUnique({
      where: { proveedorId: user.id },
    })
  } else {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (!cuenta) {
    return Response.json({ error: 'No encontrado' }, { status: 404 })
  }

  const accountSession = await stripe.accountSessions.create({
    account: cuenta.stripeAccountId,
    components: {
      account_onboarding: { enabled: true },
    },
  })

  return Response.json({ clientSecret: accountSession.client_secret })
}