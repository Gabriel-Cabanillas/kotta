/**
 * Componente de gestion de activos del panel administrativo de Kotta.
 * Contiene resumen por estado, filtros, alta y edicion de activos del
 * condominio, incluyendo mantenimiento y ubicacion.
 * Se relaciona con la pagina admin de activos y con las APIs
 * /api/activos/crear y /api/activos/actualizar.
 * Existe para que el ADMIN mantenga el inventario operativo del coto dentro de
 * la administracion central de Kotta.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  OK:       { color: '#1DB87E', bg: '#E6F9F1', label: 'OK'       },
  REVISION: { color: '#F5A623', bg: '#FEF3E2', label: 'Revisar'  },
  URGENTE:  { color: '#E8503A', bg: '#FEECEA', label: 'Urgente'  },
  INACTIVO: { color: '#6B7A99', bg: '#F1F5F9', label: 'Inactivo' },
}

const CATEGORY_LABELS: Record<string, string> = {
  BOMBA:            'Bomba',
  PORTON:           'Portón',
  ILUMINACION:      'Iluminación',
  AREA_COMUN:       'Área común',
  SISTEMA_ELECTRICO:'Sistema eléctrico',
  CISTERNA:         'Cisterna',
  OTRO:             'Otro',
}

type Activo = {
  id: string
  name: string
  category: string
  status: string
  location: string | null
  description: string | null
  lastMaintenance: Date | null
  nextMaintenance: Date | null
}

export default function ActivosList({
  activos,
  orgId,
}: {
  activos: Activo[]
  orgId: string
}) {
  const router = useRouter()
  const [showModal, setShowModal]       = useState(false)
  const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null)
  const [loading, setLoading]           = useState(false)
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [form, setForm] = useState({
    name:            '',
    category:        'BOMBA',
    status:          'OK',
    location:        '',
    description:     '',
    lastMaintenance: '',
    nextMaintenance: '',
  })

  const filtered = filterStatus === 'TODOS'
    ? activos
    : activos.filter((a) => a.status === filterStatus)

  const counts = {
    OK:       activos.filter((a) => a.status === 'OK').length,
    REVISION: activos.filter((a) => a.status === 'REVISION').length,
    URGENTE:  activos.filter((a) => a.status === 'URGENTE').length,
    INACTIVO: activos.filter((a) => a.status === 'INACTIVO').length,
  }

  const openCreate = () => {
    setSelectedActivo(null)
    setForm({
      name: '', category: 'BOMBA', status: 'OK',
      location: '', description: '',
      lastMaintenance: '', nextMaintenance: '',
    })
    setShowModal(true)
  }

  const openEdit = (activo: Activo) => {
    setSelectedActivo(activo)
    setForm({
      name:            activo.name,
      category:        activo.category,
      status:          activo.status,
      location:        activo.location ?? '',
      description:     activo.description ?? '',
      lastMaintenance: activo.lastMaintenance
        ? new Date(activo.lastMaintenance).toISOString().split('T')[0]
        : '',
      nextMaintenance: activo.nextMaintenance
        ? new Date(activo.nextMaintenance).toISOString().split('T')[0]
        : '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.name) return
    setLoading(true)
    try {
      const endpoint = selectedActivo
        ? '/api/activos/actualizar'
        : '/api/activos/crear'
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          orgId,
          activoId: selectedActivo?.id,
          lastMaintenance: form.lastMaintenance || null,
          nextMaintenance: form.nextMaintenance || null,
        }),
      })
      setShowModal(false)
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

      {/* Filtros + botón */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['TODOS', 'OK', 'REVISION', 'URGENTE', 'INACTIVO'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                filterStatus === s
                  ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                  : 'bg-white text-[#4A5568] border-[#E2E8F0] hover:border-[#C5D5EE]'
              }`}
            >
              {s === 'TODOS' ? 'Todos' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2.5 px-5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Agregar activo
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#6B7A99] text-sm">No hay activos registrados.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm text-[#4FA8E8] hover:underline"
            >
              Agregar el primero →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filtered.map((activo) => {
              const st = STATUS_CONFIG[activo.status] ?? STATUS_CONFIG.OK
              const diasParaMantenimiento = activo.nextMaintenance
                ? Math.ceil(
                    (new Date(activo.nextMaintenance).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                  )
                : null

              return (
                <div
                  key={activo.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F9FC] transition-colors cursor-pointer"
                  onClick={() => openEdit(activo)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: st.bg }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="3" width="20" height="14" rx="2"
                          stroke={st.color} strokeWidth="1.8" fill="none"/>
                        <path d="M8 21h8M12 17v4"
                          stroke={st.color} strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0F1F34]">{activo.name}</p>
                      <p className="text-xs text-[#6B7A99]">
                        {CATEGORY_LABELS[activo.category]}
                        {activo.location && ` · ${activo.location}`}
                      </p>
                      {activo.lastMaintenance && (
                        <p className="text-xs text-[#6B7A99] mt-0.5">
                          Último mant:{' '}
                          {new Date(activo.lastMaintenance).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {diasParaMantenimiento !== null && (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full ${
                          diasParaMantenimiento <= 0
                            ? 'bg-[#FEECEA] text-[#E8503A]'
                            : diasParaMantenimiento <= 30
                            ? 'bg-[#FEF3E2] text-[#F5A623]'
                            : 'bg-[#F1F5F9] text-[#6B7A99]'
                        }`}
                      >
                        {diasParaMantenimiento <= 0
                          ? 'Mant. vencido'
                          : `Mant. en ${diasParaMantenimiento}d`}
                      </span>
                    )}
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

      {/* Modal crear/editar */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <h3 className="font-medium text-[#0F1F34]">
                {selectedActivo ? 'Editar activo' : 'Agregar activo'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#6B7A99] hover:text-[#0F1F34] p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Bomba principal cisterna norte"
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B7A99] mb-1.5 block">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6B7A99] mb-1.5 block">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Ubicación</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Ej. Cisterna norte, Área B"
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
                />
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Notas adicionales sobre este activo..."
                  rows={2}
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B7A99] mb-1.5 block">
                    Último mantenimiento
                  </label>
                  <input
                    type="date"
                    value={form.lastMaintenance}
                    onChange={(e) => setForm((f) => ({ ...f, lastMaintenance: e.target.value }))}
                    className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B7A99] mb-1.5 block">
                    Próximo mantenimiento
                  </label>
                  <input
                    type="date"
                    value={form.nextMaintenance}
                    onChange={(e) => setForm((f) => ({ ...f, nextMaintenance: e.target.value }))}
                    className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost flex-1 py-3 text-sm justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || loading}
                className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50"
              >
                {loading ? 'Guardando...' : selectedActivo ? 'Guardar cambios' : 'Agregar activo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
