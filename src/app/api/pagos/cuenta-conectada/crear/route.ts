/**
 * Crea (o reutiliza) la cuenta conectada de Stripe para el condominio
 * o el proveedor que hace la petición, y la guarda en CuentaConectada.
 * Se relaciona con lib/stripe.ts, el modelo CuentaConectada, y el endpoint
 * de account-session (paso 1.2) que genera el formulario embebido.
 * Existe para dar de alta la cuenta de Stripe una sola vez por condominio
 * o proveedor, de forma segura incluso si se dispara más de una vez casi
 * al mismo tiempo (por ejemplo, por doble efecto de React en desarrollo).
 */
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSession()

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (user.role === 'ADMIN') {
    if (!user.orgId) {
      return Response.json({ error: 'Usuario sin condominio asignado' }, { status: 400 })
    }
    return crearOReutilizar({ tipo: 'CONDOMINIO', where: { orgId: user.orgId }, data: { orgId: user.orgId } })
  }

  if (user.role === 'PROVEEDOR') {
    return crearOReutilizar({ tipo: 'PROVEEDOR', where: { proveedorId: user.id }, data: { proveedorId: user.id } })
  }

  return Response.json({ error: 'No autorizado' }, { status: 403 })
}

async function crearOReutilizar({
  tipo,
  where,
  data,
}: {
  tipo: 'CONDOMINIO' | 'PROVEEDOR'
  where: { orgId: string } | { proveedorId: string }
  data: { orgId: string } | { proveedorId: string }
}) {
  const existente = await prisma.cuentaConectada.findUnique({ where: where as any })
  if (existente) {
    return Response.json({ stripeAccountId: existente.stripeAccountId })
  }

  const account = await crearCuentaStripe()

  try {
    const cuenta = await prisma.cuentaConectada.create({
      data: { tipo, stripeAccountId: account.id, ...data },
    })
    return Response.json({ stripeAccountId: cuenta.stripeAccountId })
  } catch (err: any) {
    // Carrera: otra petición casi simultánea ya la creó primero.
    // Reutilizamos la que ya quedó guardada en vez de tronar.
    if (err.code === 'P2002') {
      const cuenta = await prisma.cuentaConectada.findUnique({ where: where as any })
      if (cuenta) return Response.json({ stripeAccountId: cuenta.stripeAccountId })
    }
    throw err
  }
}

async function crearCuentaStripe() {
  return stripe.accounts.create({
    country: 'MX',
    controller: {
      stripe_dashboard: { type: 'none' },
      fees: { payer: 'application' },
      losses: { payments: 'stripe' },
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
}








/*



controller.stripe_dashboard.type: 'express' — esto es lo que le dice a Stripe "quiero el comportamiento de una cuenta Express" 
(verificación simplificada, no acceso al dashboard completo de Stripe). Es la sintaxis actual; la forma vieja (type: 'express' como parámetro raíz) 
sigue funcionando en cuentas viejas pero ya no es la recomendada para cuentas nuevas.


fees.payer: 'application' — significa que Kotta (la plataforma) es quien paga las comisiones de Stripe, no el condominio directamente. 
Esto se relaciona con la decisión pendiente que anotaste en la sección 2 de tu plan (el application_fee) — lo vamos a retomar en la Fase 2.




capabilities — pedimos card_payments (para poder cobrar) y transfers (para poder mover dinero entre cuentas conectadas). 
Sin esto, la cuenta se crea pero no puede hacer ninguna de las dos cosas.


Por qué separé crearCuentaStripe() en su propia función: para no repetir el mismo bloque dos veces 
(condominio y proveedor usan exactamente la misma configuración de cuenta, solo cambia a qué se liga en tu base de datos).

*/