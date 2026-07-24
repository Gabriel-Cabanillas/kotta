'use client'

/**
 * Vista operativa de ordenes asignadas al proveedor.
 * Contiene el listado de ordenes, el detalle seleccionado, la definicion de precio,
 * el cambio de estado y la carga de evidencia.
 * Se relaciona con src/app/[coto]/proveedor/page.tsx,
 * /api/proveedor/actualizar y /api/proveedor/evidencia.
 * Existe dentro de Kotta para que el proveedor cotice, ejecute y documente trabajos
 * derivados de tickets vecinales.
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/components/lib/utils'

type Orden = {
  id: string
  status: string
  description: string | null
  beforePhotoUrl: string | null
  afterPhotoUrl: string | null
  cost: number | null
  costNote: string | null
  createdAt: Date
  ticket: {
    folio: string
    title: string
    description: string
    category: string
    photoUrl: string | null
    reportedBy: { name: string; houseNumber: string | null }
  }
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  PENDIENTE:  { color: '#8A5A00', bg: '#FFF6E2', dot: '#FFBA2E', label: 'Pendiente'  },
  EN_PROCESO: { color: '#262624', bg: '#EDEDED', dot: '#262624', label: 'En proceso' },
  COMPLETADA: { color: '#1C8A38', bg: '#EAFBEE', dot: '#2BC842', label: 'Completada' },
  CANCELADA:  { color: '#C23C34', bg: '#FFF0EF', dot: '#FD5F56', label: 'Cancelada'  },
}

const CATEGORY_LABELS: Record<string, string> = {
  PLOMERIA:        'Plomería',
  ELECTRICIDAD:    'Electricidad',
  HERRERIA:        'Herrería',
  JARDINERIA:      'Jardinería',
  LIMPIEZA:        'Limpieza',
  SEGURIDAD:       'Seguridad',
  INFRAESTRUCTURA: 'Infraestructura',
  OTRO:            'Otro',
}

export default function OrdenesProveedor({ ordenes }: { ordenes: Orden[] }) {
  const router    = useRouter()
  const [selected, setSelected]   = useState<Orden | null>(null)
  const [loading, setLoading]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [priceInput, setPriceInput] = useState('')
  const [noteInput, setNoteInput]   = useState('')
  const [priceError, setPriceError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Reinicia los campos de cotización cada vez que se abre una orden distinta
  useEffect(() => {
    setPriceInput('')
    setNoteInput('')
    setPriceError('')
  }, [selected?.id])

  const handleIniciar = async (ordenId: string) => {
    const priceValue = Number(priceInput)
    if (!priceInput || priceValue <= 0) {
      setPriceError('Ingresa un precio válido para el trabajo.')
      return
    }
    if (!noteInput.trim()) {
      setPriceError('Agrega una breve justificación del precio.')
      return
    }
    setPriceError('')
    setLoading(true)
    try {
      const res = await fetch('/api/proveedor/actualizar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ordenId,
          status:   'EN_PROCESO',
          cost:     priceValue,
          costNote: noteInput.trim(),
        }),
      })
      if (res.ok) {
        router.refresh()
        setSelected(null)
      } else {
        const data = await res.json().catch(() => null)
        setPriceError(data?.error ?? 'No se pudo guardar el precio. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubirFoto = async (ordenId: string) => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file',    file)
      formData.append('ordenId', ordenId)
      const res = await fetch('/api/proveedor/evidencia', {
        method: 'POST',
        body:   formData,
      })
      if (res.ok) {
        router.refresh()
        setSelected(null)
      }
    } finally {
      setUploading(false)
    }
  }

  if (ordenes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 py-24 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="#262624" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="#262624" strokeWidth="1.6" fill="none"/>
          </svg>
        </div>
        <p className="text-neutral-900 font-medium mb-1">Todo al día</p>
        <p className="text-sm text-neutral-400">No tienes órdenes pendientes.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {ordenes.map((orden, idx) => {
          const st = STATUS_CONFIG[orden.status] ?? STATUS_CONFIG.PENDIENTE
          return (
            <div
              key={orden.id}
              className="group bg-white rounded-2xl border border-neutral-100 p-5 hover:border-black/15 hover:shadow-card-hover transition-all duration-200 cursor-pointer animate-fade-up"
              style={{ animationDelay: `${idx * 40}ms` }}
              onClick={() => setSelected(orden)}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono tracking-wide text-neutral-400">
                      #{orden.ticket.folio}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{ color: st.color, background: st.bg }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                      {st.label}
                    </span>
                    {orden.cost != null && (
                      <span className="text-[11px] font-medium text-neutral-900">
                        ${Number(orden.cost).toLocaleString('es-MX')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-medium text-neutral-900 truncate">
                    {orden.ticket.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {CATEGORY_LABELS[orden.ticket.category]} ·{' '}
                    {orden.ticket.reportedBy.name}
                    {orden.ticket.reportedBy.houseNumber &&
                      ` · Casa ${orden.ticket.reportedBy.houseNumber}`}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(orden.createdAt).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  className="flex-shrink-0 mt-1 text-neutral-200 group-hover:text-black transition-colors"
                >
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              {/* Barra de progreso */}
              <div className="flex items-center gap-2">
                {[
                  { label: 'Asignada',  done: true },
                  { label: 'Iniciada',  done: orden.status === 'EN_PROCESO' || orden.status === 'COMPLETADA' },
                  { label: 'Evidencia', done: !!orden.afterPhotoUrl },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200',
                        step.done ? 'bg-black' : 'bg-neutral-100'
                      )}
                    >
                      {step.done && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className={cn('text-[11px]', step.done ? 'text-neutral-900' : 'text-neutral-300')}>
                      {step.label}
                    </span>
                    {i < 2 && (
                      <div className={cn('flex-1 h-px', step.done ? 'bg-black' : 'bg-neutral-100')} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal detalle */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl border border-neutral-100 w-full max-w-lg shadow-black max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-neutral-100">
              <div>
                <p className="text-[11px] font-mono tracking-wide text-neutral-400 mb-1.5">#{selected.ticket.folio}</p>
                <h3 className="text-lg font-medium text-neutral-900">{selected.ticket.title}</h3>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full mt-2"
                  style={{
                    color:      STATUS_CONFIG[selected.status]?.color,
                    background: STATUS_CONFIG[selected.status]?.bg,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: STATUS_CONFIG[selected.status]?.dot }}
                  />
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-neutral-400 hover:text-black p-1.5 -mr-1.5 -mt-1.5 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Descripción */}
              <div>
                <p className="text-xs text-neutral-400 mb-1.5">Descripción del problema</p>
                <p className="text-sm text-neutral-900 leading-relaxed">{selected.ticket.description}</p>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 mb-1.5">Reportado por</p>
                  <p className="text-sm text-neutral-900">{selected.ticket.reportedBy.name}</p>
                  {selected.ticket.reportedBy.houseNumber && (
                    <p className="text-xs text-neutral-400 mt-0.5">Casa {selected.ticket.reportedBy.houseNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-1.5">Categoría</p>
                  <p className="text-sm text-neutral-900">{CATEGORY_LABELS[selected.ticket.category]}</p>
                </div>
              </div>

              {/* Foto del reporte (siempre visible: es lo que el proveedor cotiza) */}
              <div>
                <p className="text-xs text-neutral-400 mb-1.5">Foto del problema</p>
                {selected.ticket.photoUrl ? (
                  <img
                    src={selected.ticket.photoUrl}
                    alt="Foto del problema"
                    className="w-full max-h-56 object-cover rounded-xl border border-neutral-100"
                  />
                ) : (
                  <div className="w-full h-32 bg-neutral-100 rounded-xl border border-neutral-100 flex flex-col items-center justify-center gap-1.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#A6A6A6" strokeWidth="1.5" fill="none"/>
                      <circle cx="8.5" cy="8.5" r="1.5" fill="#A6A6A6"/>
                      <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#A6A6A6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    </svg>
                    <p className="text-[10px] text-neutral-400">Sin foto</p>
                  </div>
                )}
              </div>

              {/* ── Precio: captura obligatoria en PENDIENTE, lectura después ── */}
              {selected.status === 'PENDIENTE' ? (
                <div className="space-y-3 rounded-xl border border-neutral-100 p-4">
                  <p className="text-xs font-medium text-neutral-900">Cotiza este trabajo</p>

                  <div>
                    <label className="text-xs text-neutral-400 mb-1.5 block">Precio del trabajo</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3.5 py-2.5 text-sm rounded-lg border border-neutral-100 focus:border-black focus:outline-none transition-colors duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 mb-1.5 block">Justificación del precio</label>
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Ej. incluye materiales y 2 horas de mano de obra"
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-100 focus:border-black focus:outline-none transition-colors duration-200 resize-none"
                    />
                  </div>

                  {priceError && (
                    <p className="text-xs text-red">{priceError}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-100 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-neutral-400">Precio acordado</p>
                    <p className="text-sm font-medium text-neutral-900">
                      ${selected.cost != null ? Number(selected.cost).toLocaleString('es-MX') : '—'}
                    </p>
                  </div>
                  {selected.costNote && (
                    <p className="text-xs text-neutral-400 leading-relaxed">{selected.costNote}</p>
                  )}
                </div>
              )}

              {/* Evidencia después (solo relevante una vez iniciada) */}
              {selected.status !== 'PENDIENTE' && (
                <div>
                  <p className="text-xs text-neutral-400 mb-1.5">Evidencia del trabajo terminado</p>
                  {selected.afterPhotoUrl ? (
                    <img
                      src={selected.afterPhotoUrl}
                      alt="Después"
                      className="w-full aspect-video object-cover rounded-xl border-2 border-black"
                    />
                  ) : (
                    <div className="w-full h-24 bg-neutral-100 rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center">
                      <p className="text-[11px] text-neutral-400">Pendiente de subir</p>
                    </div>
                  )}
                </div>
              )}

              {/* Subir foto después */}
              {selected.status === 'EN_PROCESO' && !selected.afterPhotoUrl && (
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={() => handleSubirFoto(selected.id)}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-neutral-200 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-black hover:bg-neutral-100/60 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <p className="text-sm font-medium text-neutral-900">Subiendo foto...</p>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#262624" strokeWidth="1.8" fill="none"/>
                          <circle cx="8.5" cy="8.5" r="1.5" fill="#262624"/>
                          <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#262624" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                        </svg>
                        <p className="text-sm font-medium text-neutral-900">Subir foto del trabajo terminado</p>
                        <p className="text-xs text-neutral-400">Requerida para completar la orden</p>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Acciones */}
              <div className="space-y-3 pt-1">
                {selected.status === 'PENDIENTE' && (
                  <button
                    onClick={() => handleIniciar(selected.id)}
                    disabled={loading}
                    className="w-full py-3.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-neutral-900 transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Confirmar precio y marcar como iniciada'}
                  </button>
                )}

                {selected.status === 'EN_PROCESO' && !selected.afterPhotoUrl && (
                  <div className="rounded-xl px-4 py-3" style={{ background: STATUS_CONFIG.PENDIENTE.bg }}>
                    <p className="text-xs" style={{ color: STATUS_CONFIG.PENDIENTE.color }}>
                      Sube la foto del trabajo terminado para completar esta orden automáticamente.
                    </p>
                  </div>
                )}

                {selected.afterPhotoUrl && (
                  <div className="rounded-xl px-4 py-3" style={{ background: STATUS_CONFIG.COMPLETADA.bg }}>
                    <p className="text-xs flex items-center gap-1.5" style={{ color: STATUS_CONFIG.COMPLETADA.color }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 13l4 4L19 7"
                          stroke={STATUS_CONFIG.COMPLETADA.color}
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        />
                      </svg>
                      Orden completada con evidencia fotográfica.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}