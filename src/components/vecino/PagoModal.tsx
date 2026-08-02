'use client'

/**
 * Modal de pago con Stripe Elements (Payment Element): tarjeta y, si está
 * activado en el Dashboard, SPEI/otros métodos automáticamente.
 * Se relaciona con /api/pagos/vecino/pagar-cargo y con el webhook
 * payment_intent.succeeded que confirma el pago de forma autoritativa.
 * Existe como la pieza final del flujo de cobro a vecinos (Fase 2).
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

type Cargo = { id: string; concepto: string; monto: any }

export default function PagoModal({ cargo, onClose }: { cargo: Cargo; onClose: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/pagos/vecino/pagar-cargo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cargoId: cargo.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setClientSecret(data.clientSecret)
          setStripePromise(
            loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
              stripeAccount: data.stripeAccountId,
            })
          )
        }
      })
      .catch(() => setError('No se pudo iniciar el pago.'))
  }, [cargo.id])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl border border-neutral-100 w-full max-w-md shadow-black" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div>
            <h3 className="font-medium text-neutral-900">{cargo.concepto}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">${Number(cargo.monto).toLocaleString('es-MX')} MXN</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!error && (!clientSecret || !stripePromise) && (
            <p className="text-sm text-neutral-400">Cargando formulario de pago…</p>
          )}
          {clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <FormularioPago onClose={onClose} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}

function FormularioPago({ onClose }: { onClose: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  const handlePagar = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'No se pudo procesar el pago.')
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      router.refresh()
      onClose()
    } else {
      setError('El pago no se completó. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement
        onReady={() => setListo(true)}
        onLoadError={(e) => setError(e.error.message ?? 'No se pudo cargar el formulario de pago.')}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handlePagar}
        disabled={!stripe || !listo || loading}
        className="btn-primary w-full py-3 text-sm justify-center disabled:opacity-50"
      >
        {loading ? 'Procesando...' : listo ? 'Pagar' : 'Cargando...'}
      </button>
    </div>
  )
}