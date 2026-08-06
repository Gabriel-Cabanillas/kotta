'use client'

/**
 * Muestra el estado de la cuenta bancaria del proveedor y el botón para
 * conectarla o editarla, usando el formulario embebido de Stripe.
 * Se relaciona con CuentaConectadaEmbed.tsx y los endpoints de
 * cuenta-conectada (crear, sesion, sincronizar).
 * Existe para que el proveedor gestione sus propios datos bancarios
 * desde su panel, sin depender del admin ni salir de Kotta.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Landmark } from 'lucide-react'
import { CuentaConectadaEmbed } from '@/components/pagos/CuentaConectadaEmbed'

type CuentaConectada = {
  payoutsEnabled: boolean
  detailsSubmitted: boolean
} | null

export default function ProveedorCuentaPago({ cuentaConectada }: { cuentaConectada: CuentaConectada }) {
  const router = useRouter()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  return (
    <section className="bg-white rounded-2xl border border-neutral-100 p-7 md:p-8 max-w-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-[0.9375rem] font-medium text-neutral-900">Datos bancarios</h2>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100/60">
          <span className={`w-1.5 h-1.5 rounded-full ${cuentaConectada?.payoutsEnabled ? 'bg-green' : 'bg-yellow'}`} />
          <span className="text-xs font-medium text-neutral-900">
            {cuentaConectada?.payoutsEnabled ? 'Listo para recibir pagos' : 'Pendiente de configurar'}
          </span>
        </div>
      </div>

      <p className="text-xs text-neutral-400 mb-5">
        {cuentaConectada?.payoutsEnabled
          ? 'Tu cuenta está lista — los pagos por tus servicios se depositan aquí directamente.'
          : 'Conecta tu cuenta bancaria para poder recibir pagos por los servicios que realizas.'}
      </p>

      {mostrarFormulario ? (
        <CuentaConectadaEmbed
          onCompletado={() => {
            setMostrarFormulario(false)
            router.refresh()
          }}
        />
      ) : (
        <button
          onClick={() => setMostrarFormulario(true)}
          className="btn-primary py-2.5 px-6 text-sm"
        >
          {cuentaConectada?.detailsSubmitted ? 'Actualizar información' : 'Conectar cuenta bancaria'}
        </button>
      )}
    </section>
  )
}