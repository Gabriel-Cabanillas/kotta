'use client'

/**
 * ADVERTENCIA: componente huérfano, no usado por ningún flujo activo.
 * Conserva el patrón stripeAccount anterior y no es compatible con Separate Charges.
 */

/**
 * Lista de cargos del vecino con su estado y acceso al modal de pago.
 * Se relaciona con app/[coto]/vecino/pagos/page.tsx y PagarCargoModal.tsx.
 * Existe para separar la consulta a Prisma (server) de la interactividad
 * del botón "Pagar" y el modal (client).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PagarCargoModal from './PagarCargoModal'

type CargoItem = {
  id: string
  concepto: string
  monto: number
  fechaLimite: string
  estado: 'PAGADO' | 'PROCESANDO' | 'FALLIDO' | 'VENCIDO' | 'PENDIENTE'
}

const STATUS_CONFIG: Record<CargoItem['estado'], { color: string; bg: string; label: string }> = {
  PAGADO:     { color: '#1E8A34', bg: 'rgba(43,200,66,0.12)',  label: 'Pagado' },
  PROCESANDO: { color: '#2563EB', bg: 'rgba(37,99,235,0.12)',  label: 'Procesando' },
  FALLIDO:    { color: '#D8352C', bg: 'rgba(253,95,86,0.12)',  label: 'Pago fallido' },
  VENCIDO:    { color: '#D8352C', bg: 'rgba(253,95,86,0.12)',  label: 'Vencido' },
  PENDIENTE:  { color: '#B8860B', bg: 'rgba(255,186,46,0.16)', label: 'Pendiente' },
}

export default function PagosVecinoList({
  items, totalPagado, stripeAccountId, condominioListoParaCobrar,
}: {
  items: CargoItem[]
  totalPagado: number
  stripeAccountId: string | null
  condominioListoParaCobrar: boolean
}) {
  const router = useRouter()
  const [cargoSeleccionado, setCargoSeleccionado] = useState<CargoItem | null>(null)

  const puedePagar = (estado: CargoItem['estado']) =>
    condominioListoParaCobrar && stripeAccountId && estado !== 'PAGADO' && estado !== 'PROCESANDO'

  const handleSuccess = () => {
    setCargoSeleccionado(null)
    router.refresh()
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-gotham text-2xl text-neutral-900 mb-1">Mis pagos</h1>
        <p className="text-sm text-neutral-400">Cargos y cuotas del condominio</p>
      </div>

      {!condominioListoParaCobrar && (
        <div className="mb-6 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-400">
          El condominio todavía está terminando de configurar su cuenta para recibir pagos. En cuanto esté listo podrás pagar aquí directamente.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pagados',    value: items.filter((i) => i.estado === 'PAGADO').length,    color: '#1E8A34' },
          { label: 'Pendientes', value: items.filter((i) => i.estado === 'PENDIENTE').length, color: '#B8860B' },
          { label: 'Vencidos',   value: items.filter((i) => i.estado === 'VENCIDO').length,   color: '#D8352C' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
            <p className="text-xs text-neutral-400 mb-2">{s.label}</p>
            <p className="font-gotham text-4xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {items.length === 0 ? (
          <div className="py-16 text-center"><p className="text-neutral-400 text-sm">No hay cargos registrados aún.</p></div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {items.map((item) => {
              const st = STATUS_CONFIG[item.estado]
              return (
                <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-100/60 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.concepto}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      ${item.monto.toLocaleString('es-MX')} MXN · Vence el {new Date(item.fechaLimite).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                    {puedePagar(item.estado) && (
                      <button
                        onClick={() => setCargoSeleccionado(item)}
                        className="text-xs font-medium bg-black text-white px-3.5 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {totalPagado > 0 && (
        <div className="mt-4 text-right">
          <p className="text-xs text-neutral-400">Total pagado: <span className="font-medium" style={{ color: '#1E8A34' }}>${totalPagado.toLocaleString('es-MX')} MXN</span></p>
        </div>
      )}

      {cargoSeleccionado && stripeAccountId && (
        <PagarCargoModal
          cargoId={cargoSeleccionado.id}
          concepto={cargoSeleccionado.concepto}
          monto={cargoSeleccionado.monto}
          stripeAccountId={stripeAccountId}
          onClose={() => setCargoSeleccionado(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
