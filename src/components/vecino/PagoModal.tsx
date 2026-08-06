/** Modal de pago de vecinos con recargo transparente de Stripe para tarjeta. */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { calcularRecargoTarjeta, TARJETA_CARGO_FIJO, TARJETA_PORCENTAJE } from '@/lib/stripe/fees'

type Cargo = { id: string; concepto: string; monto: number }
type MetodoPago = 'tarjeta' | 'spei'
const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

export default function PagoModal({ cargo, onClose }: { cargo: Cargo; onClose: () => void }) {
  const [metodo, setMetodo] = useState<MetodoPago | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const recargo = calcularRecargoTarjeta(Number(cargo.monto))

  const continuar = async (seleccion: MetodoPago) => {
    setMetodo(seleccion); setCargando(true); setError(null); setClientSecret(null)
    try {
      const respuesta = await fetch('/api/pagos/vecino/pagar-cargo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cargoId: cargo.id, metodoPagoSeleccionado: seleccion }) })
      const datos = await respuesta.json() as { error?: string; clientSecret?: string }
      if (!respuesta.ok || !datos.clientSecret) throw new Error(datos.error ?? 'No se pudo iniciar el pago.')
      setClientSecret(datos.clientSecret)
    } catch (causa) { setError(causa instanceof Error ? causa.message : 'No se pudo iniciar el pago.') } finally { setCargando(false) }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" onClick={onClose}><div className="w-full max-w-md rounded-3xl border border-neutral-100 bg-white shadow-black" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b border-neutral-100 p-6"><div><h3 className="font-medium text-neutral-900">{cargo.concepto}</h3><p className="mt-0.5 text-xs text-neutral-400">Cargo: {moneda.format(Number(cargo.monto))}</p></div><button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-900">×</button></div><div className="p-6">{!metodo && <div className="space-y-3"><p className="text-sm font-medium text-neutral-900">¿Cómo quieres pagar?</p><button onClick={() => continuar('tarjeta')} className="w-full rounded-xl border border-neutral-200 p-4 text-left hover:border-black"><p className="text-sm font-medium text-neutral-900">Tarjeta</p><p className="mt-1 text-xs text-neutral-500">Stripe cobra {(TARJETA_PORCENTAJE * 100).toFixed(1)}% + {moneda.format(TARJETA_CARGO_FIJO)} más IVA.</p></button><button onClick={() => continuar('spei')} className="w-full rounded-xl border border-neutral-200 p-4 text-left hover:border-black"><p className="text-sm font-medium text-neutral-900">SPEI u otro método disponible</p><p className="mt-1 text-xs text-neutral-500">Sin recargo en esta fase; Stripe mostrará los métodos disponibles.</p></button></div>}{metodo === 'tarjeta' && <div className="space-y-4"><div className="rounded-xl bg-neutral-50 p-4 text-sm"><div className="flex justify-between"><span>Monto del cargo</span><b>{moneda.format(recargo.montoOriginal)}</b></div><div className="mt-2 flex justify-between text-neutral-600"><span>Comisión de Stripe (4.1% + $3 + IVA)</span><b>{moneda.format(recargo.comisionStripe)}</b></div><div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-neutral-900"><span className="font-medium">Total a pagar con tarjeta</span><b>{moneda.format(recargo.montoConRecargo)}</b></div><p className="mt-3 text-xs text-neutral-500">Esta comisión la cobra Stripe. Kotta no cobra nada por esta transacción.</p></div>{error && <p className="text-xs text-red">{error}</p>}{cargando && <p className="text-sm text-neutral-400">Cargando pago con tarjeta...</p>}{clientSecret && <Elements stripe={loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)} options={{ clientSecret }}><FormularioPago etiqueta={`Pagar ${moneda.format(recargo.montoConRecargo)} con tarjeta`} onClose={onClose} /></Elements>}<button onClick={() => { setMetodo(null); setClientSecret(null); setError(null) }} className="text-xs text-neutral-500 underline">Cambiar método</button></div>}{metodo === 'spei' && <div className="space-y-4">{error && <p className="text-xs text-red">{error}</p>}{cargando && <p className="text-sm text-neutral-400">Cargando formulario de pago...</p>}{clientSecret && <Elements stripe={loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)} options={{ clientSecret }}><FormularioPago etiqueta="Pagar" onClose={onClose} /></Elements>}<button onClick={() => { setMetodo(null); setClientSecret(null); setError(null) }} className="text-xs text-neutral-500 underline">Cambiar método</button></div>}</div></div></div>
}

function FormularioPago({ etiqueta, onClose }: { etiqueta: string; onClose: () => void }) {
  const stripe = useStripe(), elements = useElements(), router = useRouter()
  const [loading, setLoading] = useState(false), [listo, setListo] = useState(false), [error, setError] = useState<string | null>(null)
  const pagar = async () => { if (!stripe || !elements) return; setLoading(true); setError(null); const { error: fallo, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' }); if (fallo) { setError(fallo.message ?? 'No se pudo procesar el pago.'); setLoading(false); return } if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') { router.refresh(); onClose() } else { setError('El pago no se completó. Intenta de nuevo.'); setLoading(false) } }
  return <div className="space-y-4"><PaymentElement onReady={() => setListo(true)} onLoadError={(evento) => setError(evento.error.message ?? 'No se pudo cargar el formulario.')} />{error && <p className="text-xs text-red">{error}</p>}<button onClick={pagar} disabled={!stripe || !listo || loading} className="btn-primary w-full py-3 text-sm justify-center disabled:opacity-50">{loading ? 'Procesando...' : listo ? etiqueta : 'Cargando...'}</button></div>
}
