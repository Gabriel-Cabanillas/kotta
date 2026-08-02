'use client'

/**
 * Dibuja el formulario embebido de Stripe (Connect embedded components)
 * para que el condominio o el proveedor configure/edite su cuenta bancaria,
 * usando los colores y tipografía de Kotta.
 * Se relaciona con los endpoints /api/pagos/cuenta-conectada/crear y /sesion.
 * Existe para reutilizarse tanto en ConfiguracionForm.tsx (admin) como en
 * la pantalla de datos bancarios del proveedor, sin duplicar la lógica
 * de carga de Stripe Connect.
 */
import { useEffect, useState, useCallback } from 'react'
import { loadConnectAndInitialize, type StripeConnectInstance } from '@stripe/connect-js'
import { ConnectComponentsProvider, ConnectAccountOnboarding } from '@stripe/react-connect-js'

interface Props {
  onCompletado?: () => void
}

export function CuentaConectadaEmbed({ onCompletado }: Props) {
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    // 1. Asegura que la cuenta conectada exista (idempotente, ver sub-paso 1.1)
    const crearRes = await fetch('/api/pagos/cuenta-conectada/crear', { method: 'POST' })
    if (!crearRes.ok) throw new Error('No se pudo crear la cuenta conectada')

    // 2. Pide el boleto temporal para mostrar el formulario (ver sub-paso 1.2)
    const sesionRes = await fetch('/api/pagos/cuenta-conectada/sesion', { method: 'POST' })
    if (!sesionRes.ok) throw new Error('No se pudo generar la sesión')

    const { clientSecret } = await sesionRes.json()
    return clientSecret as string
  }, [])

  useEffect(() => {
    try {
      const connectInstance = loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        fetchClientSecret,
        appearance: {
          overlays: 'dialog',
          variables: {
            colorPrimary: '#000000',
            colorBackground: '#FFFFFF',
            colorText: '#262624',
            colorDanger: '#FD5F56',
            fontFamily: 'var(--font-gotham), sans-serif',
            borderRadius: '16px',
          },
        },
      })
      setInstance(connectInstance)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el formulario de pagos.')
    }
  }, [fetchClientSecret])

  if (error) {
    return <div className="card text-red text-sm">{error}</div>
  }

  if (!instance) {
    return (
      <div className="card animate-pulse text-neutral-400 text-sm">
        Cargando formulario de pagos…
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <ConnectComponentsProvider connectInstance={instance}>
        <ConnectAccountOnboarding
            onExit={async () => {
                try {
                await fetch('/api/pagos/cuenta-conectada/sincronizar', { method: 'POST' })
                } catch (err) {
                console.error(err)
                }
                onCompletado?.()
            }}
            />
      </ConnectComponentsProvider>
    </div>
  )
}