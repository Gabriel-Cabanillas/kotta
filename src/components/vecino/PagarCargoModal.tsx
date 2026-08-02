'use client'

/**
 * Modal de pago del vecino: llama a /api/pagos/vecino/pagar-cargo para obtener
 * el clientSecret del PaymentIntent (Direct Charge en la cuenta conectada del
 * condominio) y muestra el Payment Element de Stripe.
 * Se relaciona con PagosVecinoList.tsx y el endpoint pagar-cargo.
 */

import { useEffect, useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripeForAccount } from '@/lib/stripe-connect-client'

export default function PagarCargoModal({
  cargoId, concepto, monto, stripeAccountId, onClose, onSuccess,
}: {
  cargoId: string
  concepto: string
  monto: number
  stripeAccountId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    fetch('/api/pagos/vecino/pagar-cargo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cargoId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelado) return
        if (data.error) setError(data.error)
        else setClientSecret(data.clientSecret)
      })
      .catch(() => { if (!cancelado) setError('No se pudo iniciar el pago. Intenta de nuevo.') })
    return () => { cancelado = true }
  }, [cargoId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <p className="text-sm font-medium text-neutral-900 mb-1">{concepto}</p>
        <p className="font-gotham text-3xl text-neutral-900 mb-5">${monto.toLocaleString('es-MX')} MXN</p>

        {error && <p className="text-sm text-red mb-4">{error}</p>}

        {!clientSecret && !error && (
          <div className="py-10 text-center text-sm text-neutral-400">Preparando el formulario de pago…</div>
        )}

        {clientSecret && (
          <Elements stripe={getStripeForAccount(stripeAccountId)} options={{ clientSecret, locale: 'es' }}>
            <FormularioPago onSuccess={onSuccess} />
          </Elements>
        )}
      </div>
    </div>
  )
}

function FormularioPago({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcesando(true)
    setError(null)

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${window.location.pathname}` },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'No se pudo procesar el pago.')
      setProcesando(false)
      return
    }

    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      onSuccess()
    } else {
      setProcesando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-sm text-red mt-3">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || procesando}
        className="w-full mt-5 bg-black text-white text-sm font-medium py-3 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
      >
        {procesando ? 'Procesando…' : 'Pagar ahora'}
      </button>
    </form>
  )
}