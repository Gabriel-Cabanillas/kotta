/**
 * Componente de gestion de activos del panel administrativo de Kotta.
 * Contiene resumen por estado, filtros, alta y edicion de activos del
 * condominio, incluyendo mantenimiento y ubicacion.
 * Se relaciona con la pagina admin de activos y con las APIs
 * /api/activos/crear y /api/activos/actualizar.
 * Existe para que el ADMIN mantenga el inventario operativo del coto dentro de
 * la administracion central de Kotta.
 */

// Ya se rediseño
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  X,
  Droplet,
  DoorOpen,
  Lightbulb,
  Users,
  Zap,
  Droplets,
  Box,
  MapPin,
  Calendar,
  PackageSearch,
  type LucideIcon,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  OK:       { dot: '#2BC842', text: '#178B4E', bg: '#EAFBEE', label: 'OK'       },
  REVISION: { dot: '#FFBA2E', text: '#B4790A', bg: '#FFF8E7', label: 'Revisar'  },
  URGENTE:  { dot: '#FD5F56', text: '#D5453C', bg: '#FEECEA', label: 'Urgente'  },
  INACTIVO: { dot: '#A6A6A6', text: '#71716F', bg: '#F2F2F1', label: 'Inactivo' },
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  BOMBA:             { label: 'Bomba',            icon: Droplet   },
  PORTON:            { label: 'Portón',            icon: DoorOpen  },
  ILUMINACION:       { label: 'Iluminación',       icon: Lightbulb },
  AREA_COMUN:        { label: 'Área común',        icon: Users     },
  SISTEMA_ELECTRICO: { label: 'Sistema eléctrico', icon: Zap       },
  CISTERNA:          { label: 'Cisterna',          icon: Droplets  },
  OTRO:              { label: 'Otro',              icon: Box       },
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
      {/* Resumen por estado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div
            key={key}
            className="bg-white border border-neutral-100 rounded-2xl px-5 py-4 transition-all duration-200 hover:border-neutral-200 hover:shadow-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: cfg.dot }}
              />
              <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                {cfg.label}
              </p>
            </div>
            <p className="font-display text-3xl font-medium text-neutral-900 tabular-nums">
              {counts[key as keyof typeof counts]}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros + botón */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-1 bg-neutral-100/70 p-1 rounded-full overflow-x-auto">
          {['TODOS', 'OK', 'REVISION', 'URGENTE', 'INACTIVO'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 ${
                filterStatus === s
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {s === 'TODOS' ? 'Todos' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2.5 px-5">
          <Plus size={15} strokeWidth={2.5} />
          Agregar activo
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <PackageSearch size={20} strokeWidth={1.75} className="text-neutral-400" />
            </div>
            <p className="text-neutral-400 text-sm">No hay activos registrados.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm font-medium text-neutral-900 hover:text-red transition-colors inline-flex items-center gap-1"
            >
              Agregar el primero
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((activo) => {
              const st  = STATUS_CONFIG[activo.status] ?? STATUS_CONFIG.OK
              const cat = CATEGORY_CONFIG[activo.category] ?? CATEGORY_CONFIG.OTRO
              const Icon = cat.icon
              const diasParaMantenimiento = activo.nextMaintenance
                ? Math.ceil(
                    (new Date(activo.nextMaintenance).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                  )
                : null

              return (
                <div
                  key={activo.id}
                  className="group flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-100/40 transition-colors cursor-pointer"
                  onClick={() => openEdit(activo)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{ background: st.bg }}
                    >
                      <Icon size={17} strokeWidth={1.75} style={{ color: st.text }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{activo.name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">
                        {cat.label}
                        {activo.location && (
                          <span className="inline-flex items-center gap-1 ml-1.5">
                            <MapPin size={11} strokeWidth={2} className="inline -mt-0.5" />
                            {activo.location}
                          </span>
                        )}
                      </p>
                      {activo.lastMaintenance && (
                        <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                          <Calendar size={11} strokeWidth={2} />
                          Último mant. {new Date(activo.lastMaintenance).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {diasParaMantenimiento !== null && (
                      <span
                        className={`hidden sm:inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          diasParaMantenimiento <= 0
                            ? 'bg-red/10 text-red'
                            : diasParaMantenimiento <= 30
                            ? 'bg-[#FFBA2E]/15 text-[#B4790A]'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {diasParaMantenimiento <= 0
                          ? 'Mant. vencido'
                          : `Mant. en ${diasParaMantenimiento}d`}
                      </span>
                    )}
                    <span
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ color: st.text, background: st.bg }}
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
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-neutral-100 w-full max-w-md shadow-black max-h-[90vh] overflow-y-auto animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <h3 className="font-medium text-neutral-900">
                {selectedActivo ? 'Editar activo' : 'Agregar activo'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5 block">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Bomba principal cisterna norte"
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400/70"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5 block">
                    Categoría
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5 block">
                    Estado
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5 block">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Ej. Cisterna norte, Área B"
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400/70"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5 block">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Notas adicionales sobre este activo..."
                  rows={2}
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400/70 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5 block">
                    Último mantenimiento
                  </label>
                  <input
                    type="date"
                    value={form.lastMaintenance}
                    onChange={(e) => setForm((f) => ({ ...f, lastMaintenance: e.target.value }))}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5 block">
                    Próximo mantenimiento
                  </label>
                  <input
                    type="date"
                    value={form.nextMaintenance}
                    onChange={(e) => setForm((f) => ({ ...f, nextMaintenance: e.target.value }))}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost flex-1 py-3 text-sm justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || loading}
                className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50 disabled:pointer-events-none"
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