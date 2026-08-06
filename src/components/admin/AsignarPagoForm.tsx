'use client'

/**
 * Modal de "Asignar pago": crea un Cargo con sus CargoDestinatario,
 * usando SelectorVecinos para elegir a quién le toca.
 * Se relaciona con /api/pagos/asignar/crear y con PagosList.tsx,
 * donde se coloca el botón que lo abre.
 * Existe como el flujo nuevo de cargos (Stripe) que convive junto al
 * flujo manual viejo (Payment) hasta que se unifiquen en la Fase 4.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import SelectorVecinos from './SelectorVecinos'

type Vecino = {
  id: string
  name: string
  houseNumber: string | null
}

export default function AsignarPagoForm({ vecinos }: { vecinos: Vecino[] }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const reset = () => {
    setConcepto('')
    setMonto('')
    setFechaLimite('')
    setSelectedIds([])
  }

  const handleSubmit = async () => {
    if (!concepto || !monto || !fechaLimite || selectedIds.length === 0) return
    setLoading(true)
    try {
      await fetch('/api/pagos/asignar/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepto,
          monto: Number(monto),
          fechaLimite,
          viviendaIds: selectedIds,
        }),
      })
      setShowModal(false)
      reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn-ghost text-sm py-2.5 px-5">
        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
        Asignar pago
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-neutral-100 w-full max-w-md shadow-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h3 className="font-medium text-neutral-900">Asignar pago</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 p-1 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                  Concepto *
                </label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej. Mantenimiento Agosto"
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                    Monto (MXN) *
                  </label>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="1500"
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                    Fecha límite *
                  </label>
                  <input
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                  Destinatarios *
                </label>
                <SelectorVecinos vecinos={vecinos} selectedIds={selectedIds} onChange={setSelectedIds} />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 py-3 text-sm justify-center">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!concepto || !monto || !fechaLimite || selectedIds.length === 0 || loading}
                className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50"
              >
                {loading ? 'Asignando...' : 'Asignar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}