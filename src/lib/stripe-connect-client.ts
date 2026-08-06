import { loadStripe, Stripe } from '@stripe/stripe-js'

const cache = new Map<string, Promise<Stripe | null>>()

// Cachea por stripeAccountId para no volver a cargar Stripe.js
// cada vez que se abre el modal con el mismo condominio.
export function getStripeForAccount(stripeAccountId: string) {
  if (!cache.has(stripeAccountId)) {
    cache.set(
      stripeAccountId,
      loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, { stripeAccount: stripeAccountId })
    )
  }
  return cache.get(stripeAccountId)!
}