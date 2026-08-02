/**
 * Cliente reutilizable de Stripe para todo el backend de Kotta.
 * Se relaciona con los endpoints de cuentas conectadas, cargos,
 * transferencias y el webhook en app/api/webhooks/stripe.
 * Existe para no repetir la inicialización de Stripe en cada archivo.
 */
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Falta STRIPE_SECRET_KEY en las variables de entorno')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-06-24.dahlia', // usa la que te muestre el dashboard si es distinta
})