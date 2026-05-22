'use client'

/**
 * Vista operativa de ordenes asignadas al proveedor.
 * Contiene el listado de ordenes, el detalle seleccionado, el cambio de estado y la carga de evidencia.
 * Se relaciona con src/app/[coto]/proveedor/page.tsx,
 * /api/proveedor/actualizar y /api/proveedor/evidencia.
 * Existe dentro de Kotta para que el proveedor ejecute y documente trabajos
 * derivados de tickets vecinales.
 */

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Orden = {
  id: string
  status: string
  description: string | null
  beforePhotoUrl: string | null
  afterPhotoUrl: string | null
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

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDIENTE:  { color: '#F5A623', bg: '#FEF3E2', label: 'Pendiente'  },
  EN_PROCESO: { color: '#4FA8E8', bg: '#E8F4FD', label: 'En proceso' },
  COMPLETADA: { color: '#1DB87E', bg: '#E6F9F1', label: 'Completada' },
  CANCELADA:  { color: '#E8503A', bg: '#FEECEA', label: 'Cancelada'  },
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
  const fileRef = useRef<HTMLInputElement>(null)

  const handleIniciar = async (ordenId: string) => {
    setLoading(true)
    try {
      await fetch('/api/proveedor/actualizar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ordenId, status: 'EN_PROCESO' }),
      })
      router.refresh()
      setSelected(null)
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
      <div className="bg-white rounded-2xl border border-[#E2E8F0] py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E6F9F1] flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="#1DB87E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="#1DB87E" strokeWidth="1.8" fill="none"/>
          </svg>
        </div>
        <p className="text-[#0F1F34] font-medium mb-1">Todo al día</p>
        <p className="text-sm text-[#6B7A99]">No tienes órdenes pendientes.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-4">
        {ordenes.map((orden) => {
          const st = STATUS_CONFIG[orden.status] ?? STATUS_CONFIG.PENDIENTE
          return (
            <div
              key={orden.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:border-[#C5D5EE] hover:shadow-sm transition-all cursor-pointer"
              onClick={() => setSelected(orden)}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-[#6B7A99]">
                      #{orden.ticket.folio}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-[#0F1F34]">
                    {orden.ticket.title}
                  </h3>
                  <p className="text-xs text-[#6B7A99] mt-1">
                    {CATEGORY_LABELS[orden.ticket.category]} ·{' '}
                    {orden.ticket.reportedBy.name}
                    {orden.ticket.reportedBy.houseNumber &&
                      ` · Casa ${orden.ticket.reportedBy.houseNumber}`}
                  </p>
                  <p className="text-xs text-[#6B7A99] mt-0.5">
                    {new Date(orden.createdAt).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-1">
                  <path d="M9 18l6-6-6-6" stroke="#C5D5EE" strokeWidth="2" strokeLinecap="round"/>
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
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: step.done ? '#1DB87E' : '#E2E8F0' }}
                    >
                      {step.done && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: step.done ? '#1DB87E' : '#C5D5EE' }}>
                      {step.label}
                    </span>
                    {i < 2 && (
                      <div
                        className="flex-1 h-px"
                        style={{ background: step.done ? '#1DB87E' : '#E2E8F0' }}
                      />
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
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs font-mono text-[#6B7A99] mb-1">#{selected.ticket.folio}</p>
                <h3 className="font-medium text-[#0F1F34]">{selected.ticket.title}</h3>
                <span
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                  style={{
                    color:      STATUS_CONFIG[selected.status]?.color,
                    background: STATUS_CONFIG[selected.status]?.bg,
                  }}
                >
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
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

              {/* Descripción */}
              <div>
                <p className="text-xs text-[#6B7A99] mb-1">Descripción del problema</p>
                <p className="text-sm text-[#0F1F34] leading-relaxed">{selected.ticket.description}</p>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#6B7A99] mb-1">Reportado por</p>
                  <p className="text-sm text-[#0F1F34]">{selected.ticket.reportedBy.name}</p>
                  {selected.ticket.reportedBy.houseNumber && (
                    <p className="text-xs text-[#6B7A99]">Casa {selected.ticket.reportedBy.houseNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#6B7A99] mb-1">Categoría</p>
                  <p className="text-sm text-[#0F1F34]">{CATEGORY_LABELS[selected.ticket.category]}</p>
                </div>
              </div>

              {/* Fotos lado a lado */}
              <div>
                <p className="text-xs text-[#6B7A99] mb-3">Evidencia fotográfica</p>
                <div className="grid grid-cols-2 gap-3">

                  {/* Foto Antes */}
                  <div>
                    <p className="text-xs text-[#6B7A99] mb-1.5">Antes</p>
                    {selected.ticket.photoUrl ? (
                      <img
                        src={selected.ticket.photoUrl}
                        alt="Antes"
                        className="w-full aspect-square object-cover rounded-xl border border-[#E2E8F0]"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-center gap-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#CBD5E1" strokeWidth="1.5" fill="none"/>
                          <circle cx="8.5" cy="8.5" r="1.5" fill="#CBD5E1"/>
                          <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        </svg>
                        <p className="text-[10px] text-[#CBD5E1]">Sin foto</p>
                      </div>
                    )}
                  </div>

                  {/* Foto Después */}
                  <div>
                    <p className="text-xs text-[#1DB87E] mb-1.5">Después</p>
                    {selected.afterPhotoUrl ? (
                      <img
                        src={selected.afterPhotoUrl}
                        alt="Después"
                        className="w-full aspect-square object-cover rounded-xl border border-[#9FE1CB]"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-[#E6F9F1] rounded-xl border border-[#9FE1CB] flex flex-col items-center justify-center gap-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#9FE1CB" strokeWidth="1.5" fill="none"/>
                          <circle cx="8.5" cy="8.5" r="1.5" fill="#9FE1CB"/>
                          <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#9FE1CB" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        </svg>
                        <p className="text-[10px] text-[#9FE1CB]">Pendiente</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subir foto después */}
              {!selected.afterPhotoUrl && selected.status !== 'CANCELADA' && (
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
                    disabled={uploading || selected.status === 'PENDIENTE'}
                    className="w-full border-2 border-dashed border-[#C5D5EE] rounded-xl py-6 flex flex-col items-center gap-2 hover:border-[#4FA8E8] hover:bg-[#E8F4FD] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <p className="text-sm font-medium text-[#4FA8E8]">Subiendo foto...</p>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4FA8E8" strokeWidth="1.8" fill="none"/>
                          <circle cx="8.5" cy="8.5" r="1.5" fill="#4FA8E8"/>
                          <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#4FA8E8" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                        </svg>
                        <p className="text-sm font-medium text-[#4FA8E8]">
                          {selected.status === 'PENDIENTE'
                            ? 'Primero marca la orden como iniciada'
                            : 'Subir foto del trabajo terminado'}
                        </p>
                        {selected.status !== 'PENDIENTE' && (
                          <p className="text-xs text-[#6B7A99]">Requerida para completar la orden</p>
                        )}
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
                    className="w-full py-3.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50"
                    style={{ background: '#1DB87E' }}
                  >
                    {loading ? 'Iniciando...' : '✓ Marcar como iniciada'}
                  </button>
                )}

                {selected.status === 'EN_PROCESO' && !selected.afterPhotoUrl && (
                  <div className="bg-[#FEF3E2] rounded-xl px-4 py-3">
                    <p className="text-xs text-[#B56B00]">
                      Sube la foto del trabajo terminado para completar esta orden automáticamente.
                    </p>
                  </div>
                )}

                {selected.afterPhotoUrl && (
                  <div className="bg-[#E6F9F1] rounded-xl px-4 py-3">
                    <p className="text-xs text-[#0D7A4E] flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#0D7A4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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