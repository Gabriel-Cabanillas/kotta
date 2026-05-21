/**
 * Componente de gestion de ordenes de trabajo del panel administrativo de Kotta.
 * Contiene resumen por estado, filtros, detalle de ordenes, costos, notas y
 * actualizacion de cierre o cancelacion.
 * Se relaciona con la pagina admin de ordenes, los tickets asignados a
 * proveedores y la API /api/ordenes/actualizar.
 * Existe para que el ADMIN de seguimiento al trabajo de proveedores y mantenga
 * sincronizado el flujo entre tickets y ordenes.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDIENTE:   { color: '#6B7A99', bg: '#F1F5F9', label: 'Pendiente'   },
  EN_PROCESO:  { color: '#F5A623', bg: '#FEF3E2', label: 'En proceso'  },
  COMPLETADA:  { color: '#1DB87E', bg: '#E6F9F1', label: 'Completada'  },
  CANCELADA:   { color: '#E8503A', bg: '#FEECEA', label: 'Cancelada'   },
}

type Orden = {
  id: string
  status: string
  description: string | null
  cost: any
  beforePhotoUrl: string | null // Podrías eliminar este eventualmente si ya no se usa
  afterPhotoUrl: string | null
  notes: string | null
  createdAt: Date
  closedAt: Date | null
  ticket: {
    folio: string
    title: string
    reportedBy: { name: string; houseNumber: string | null }
    photoUrl: string | null // ← Línea agregada/verificada
  }
  provider: { name: string }
}

export default function OrdenesList({
  ordenes,
  coto,
}: {
  ordenes: Orden[]
  coto: string
}) {
  const router = useRouter()
  const [selected, setSelected]     = useState<Orden | null>(null)
  const [filterStatus, setFilter]   = useState('TODOS')
  const [loading, setLoading]       = useState(false)
  const [costInput, setCostInput]   = useState('')
  const [notesInput, setNotesInput] = useState('')

  const filtered = filterStatus === 'TODOS'
    ? ordenes
    : ordenes.filter((o) => o.status === filterStatus)

  const counts = {
    PENDIENTE:  ordenes.filter((o) => o.status === 'PENDIENTE').length,
    EN_PROCESO: ordenes.filter((o) => o.status === 'EN_PROCESO').length,
    COMPLETADA: ordenes.filter((o) => o.status === 'COMPLETADA').length,
    CANCELADA:  ordenes.filter((o) => o.status === 'CANCELADA').length,
  }

  const openDetail = (orden: Orden) => {
    setSelected(orden)
    setCostInput(orden.cost ? String(orden.cost) : '')
    setNotesInput(orden.notes ?? '')
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selected) return
    setLoading(true)
    try {
      await fetch('/api/ordenes/actualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordenId: selected.id,
          status,
          cost:    costInput || null,
          notes:   notesInput || null,
          closedAt: status === 'COMPLETADA' ? new Date() : null,
        }),
      })
      setSelected(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <p className="text-xs text-[#6B7A99] mb-2">{cfg.label}</p>
            <p className="font-display text-3xl" style={{ color: cfg.color }}>
              {counts[key as keyof typeof counts]}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['TODOS', ...Object.keys(STATUS_CONFIG)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filterStatus === s
                ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                : 'bg-white text-[#4A5568] border-[#E2E8F0] hover:border-[#C5D5EE]'
            }`}
          >
            {s === 'TODOS' ? 'Todas' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#6B7A99] text-sm">No hay órdenes en esta categoría.</p>
            <p className="text-xs text-[#6B7A99] mt-1">
              Las órdenes se crean al asignar un ticket a un proveedor.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filtered.map((orden) => {
              const st = STATUS_CONFIG[orden.status] ?? STATUS_CONFIG.PENDIENTE
              return (
                <div
                  key={orden.id}
                  className="flex items-start justify-between px-6 py-4 hover:bg-[#F7F9FC] transition-colors cursor-pointer"
                  onClick={() => openDetail(orden)}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: st.bg }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                          stroke={st.color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F1F34] mb-0.5">
                        {orden.ticket.title}
                      </p>
                      <p className="text-xs text-[#6B7A99]">
                        Ticket #{orden.ticket.folio} ·{' '}
                        {orden.ticket.reportedBy.name}
                        {orden.ticket.reportedBy.houseNumber &&
                          ` · Casa ${orden.ticket.reportedBy.houseNumber}`}
                      </p>
                      <p className="text-xs text-[#4FA8E8] mt-0.5">
                        Proveedor: {orden.provider.name}
                      </p>
                      {orden.cost && (
                        <p className="text-xs text-[#1DB87E] mt-0.5">
                          Costo: ${Number(orden.cost).toLocaleString('es-MX')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <p className="text-xs text-[#6B7A99] hidden sm:block">
                      {new Date(orden.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs font-mono text-[#6B7A99] mb-1">
                  Ticket #{selected.ticket.folio}
                </p>
                <h3 className="font-medium text-[#0F1F34]">{selected.ticket.title}</h3>
                <p className="text-xs text-[#4FA8E8] mt-1">
                  {selected.provider.name}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-[#6B7A99] hover:text-[#0F1F34] p-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Estado actual */}
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    color:      STATUS_CONFIG[selected.status]?.color,
                    background: STATUS_CONFIG[selected.status]?.bg,
                  }}
                >
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
                <span className="text-xs text-[#6B7A99]">
                  Creada el{' '}
                  {new Date(selected.createdAt).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long',
                  })}
                </span>
              </div>

              {/* Fotos evidencia */}
              <div>
                <p className="text-xs text-[#6B7A99] mb-2">Evidencia fotográfica</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Columna ANTES (Ticket original) */}
                  <div>
                    <p className="text-xs text-[#6B7A99] mb-1.5">Antes</p>
                    {selected.ticket.photoUrl ? (
                      <img
                        src={selected.ticket.photoUrl}
                        alt="Antes"
                        className="w-full aspect-square object-cover rounded-xl border border-[#E2E8F0]"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] flex items-center justify-center">
                        <p className="text-xs text-[#C5D5EE]">Sin foto</p>
                      </div>
                    )}
                  </div>

                  {/* Columna DESPUÉS (Orden finalizada) */}
                  <div>
                    <p className="text-xs text-[#1DB87E] mb-1.5">Después</p>
                    {selected.afterPhotoUrl ? (
                      <img
                        src={selected.afterPhotoUrl}
                        alt="Después"
                        className="w-full aspect-square object-cover rounded-xl border border-[#9FE1CB]"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-[#E6F9F1] rounded-xl border border-[#9FE1CB] flex items-center justify-center">
                        <p className="text-xs text-[#9FE1CB]">Pendiente</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Costo y notas */}
              {selected.status !== 'COMPLETADA' && selected.status !== 'CANCELADA' && (
                <>
                  <div>
                    <label className="text-xs text-[#6B7A99] mb-1.5 block">
                      Costo real (MXN)
                    </label>
                    <input
                      type="number"
                      value={costInput}
                      onChange={(e) => setCostInput(e.target.value)}
                      placeholder="Ej. 1200"
                      className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#6B7A99] mb-1.5 block">Notas</label>
                    <textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Observaciones sobre el trabajo..."
                      rows={2}
                      className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE] resize-none"
                    />
                  </div>
                </>
              )}

              {/* Costo registrado si ya está cerrada */}
              {selected.cost && (
                <div className="bg-[#E6F9F1] rounded-xl px-4 py-3">
                  <p className="text-xs text-[#0D7A4E] font-medium">
                    Costo registrado: ${Number(selected.cost).toLocaleString('es-MX')} MXN
                  </p>
                  {selected.closedAt && (
                    <p className="text-xs text-[#0D7A4E] mt-0.5">
                      Cerrada el{' '}
                      {new Date(selected.closedAt).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long',
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Acciones */}
              {selected.status !== 'COMPLETADA' && selected.status !== 'CANCELADA' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleUpdateStatus('CANCELADA')}
                    disabled={loading}
                    className="btn-ghost flex-1 py-3 text-sm justify-center text-[#E8503A] border-[#FACAC3] hover:bg-[#FEECEA]"
                  >
                    Cancelar orden
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('COMPLETADA')}
                    disabled={loading}
                    className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Marcar completada'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
