/**
 * Lista de solicitudes de reserva de amenidades para el panel administrativo.
 * Contiene las reservas pendientes de aprobacion (con acciones de aprobar y
 * rechazar) y el historial de reservas ya confirmadas o rechazadas.
 * Se relaciona con la pagina admin de amenidades y la ruta /api/reservas/[id].
 * Existe para que el ADMIN gestione las solicitudes generadas por amenidades
 * configuradas con aprobacion manual (requiresApproval).
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, Clock } from 'lucide-react'

type Reserva = {
  id: string
  date: Date
  startTime: string
  endTime: string
  status: string
  notes: string | null
  amenity: { name: string }
  user: { name: string; houseNumber: string | null }
}

const STATUS_CONFIG: Record<string, { text: string; bg: string; label: string }> = {
  PENDIENTE:  { text: 'text-warning', bg: 'bg-warning/10', label: 'Pendiente'  },
  CONFIRMADA: { text: 'text-success', bg: 'bg-success/10', label: 'Confirmada' },
  CANCELADA:  { text: 'text-danger',  bg: 'bg-danger/10',  label: 'Rechazada'  },
}

export default function AdminReservasList({ reservaciones }: { reservaciones: Reserva[] }) {
  const router = useRouter()
  const [filtro, setFiltro]     = useState<'PENDIENTE' | 'TODAS'>('PENDIENTE')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const pendientes = reservaciones.filter((r) => r.status === 'PENDIENTE')
  const visibles    = filtro === 'PENDIENTE' ? pendientes : reservaciones

  const resolver = async (id: string, action: 'aprobar' | 'rechazar') => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'No se pudo procesar la solicitud')
        return
      }
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      {/* Filtro */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFiltro('PENDIENTE')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
            filtro === 'PENDIENTE'
              ? 'bg-black text-white border-black'
              : 'bg-white text-neutral-400 border-neutral-100 hover:border-black hover:text-neutral-900'
          }`}
        >
          Pendientes {pendientes.length > 0 && `(${pendientes.length})`}
        </button>
        <button
          onClick={() => setFiltro('TODAS')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
            filtro === 'TODAS'
              ? 'bg-black text-white border-black'
              : 'bg-white text-neutral-400 border-neutral-100 hover:border-black hover:text-neutral-900'
          }`}
        >
          Todas
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {visibles.length === 0 ? (
          <div className="py-16 text-center">
            <Clock size={20} className="text-neutral-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-medium text-neutral-900">
              {filtro === 'PENDIENTE' ? 'No hay solicitudes pendientes' : 'Aún no hay reservas'}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {filtro === 'PENDIENTE' && 'Las nuevas solicitudes de amenidades con aprobación manual aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {visibles.map((r) => {
              const st = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PENDIENTE
              const loading = loadingId === r.id
              return (
                <div key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900">
                      {r.amenity.name}
                      <span className="text-neutral-400 font-normal">
                        {' '}· {r.user.name}{r.user.houseNumber ? ` · Casa ${r.user.houseNumber}` : ''}
                      </span>
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {new Date(r.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {' · '}{r.startTime}–{r.endTime}
                    </p>
                    {r.notes && <p className="text-xs text-neutral-900/70 mt-1">"{r.notes}"</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.status === 'PENDIENTE' ? (
                      loading ? (
                        <Loader2 size={16} className="animate-spin text-neutral-400" strokeWidth={2} />
                      ) : (
                        <>
                          <button
                            onClick={() => resolver(r.id, 'rechazar')}
                            className="text-neutral-400 hover:text-danger hover:bg-danger/5 rounded-lg p-2 transition-colors"
                            title="Rechazar"
                          >
                            <X size={16} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => resolver(r.id, 'aprobar')}
                            className="text-white bg-black hover:bg-neutral-900 rounded-lg p-2 transition-colors"
                            title="Aprobar"
                          >
                            <Check size={16} strokeWidth={2} />
                          </button>
                        </>
                      )
                    ) : (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.text} ${st.bg}`}>
                        {st.label}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}