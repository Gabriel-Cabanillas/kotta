/**
 * Componente de gestion de amenidades del panel administrativo de Kotta.
 * Contiene el catalogo de amenidades reservables (horario, capacidad,
 * aprobacion, costo, reglas) y el alta/edicion/eliminacion desde el admin.
 * Se relaciona con la pagina admin de amenidades y las rutas
 * /api/amenidades y /api/amenidades/[id].
 * Existe para que el ADMIN configure el catalogo que luego vera el VECINO
 * al momento de reservar.
 */
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarCheck,
  Ban,
  Wrench,
  X,
  ImageOff,
  ImagePlus,
  Check,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react'

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; text: string; bg: string }
> = {
  ACTIVA:        { label: 'Activa',        icon: CalendarCheck, text: 'text-success',     bg: 'bg-success/10'  },
  INACTIVA:      { label: 'Inactiva',      icon: Ban,           text: 'text-neutral-400', bg: 'bg-neutral-100' },
  MANTENIMIENTO: { label: 'Mantenimiento', icon: Wrench,        text: 'text-warning',     bg: 'bg-warning/10'  },
}

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
]

type Amenidad = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  capacity: number | null
  durationMinutes: number
  startTime: string
  endTime: string
  weekDays: number[]
  requiresApproval: boolean
  extraCost: number | null
  rules: string | null
  status: string
  createdAt: Date
}

type FormState = {
  name: string
  description: string
  capacity: string
  durationMinutes: string
  startTime: string
  endTime: string
  weekDays: number[]
  requiresApproval: boolean
  extraCost: string
  rules: string
  status: string
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  capacity: '',
  durationMinutes: '60',
  startTime: '08:00',
  endTime: '22:00',
  weekDays: [0, 1, 2, 3, 4, 5, 6],
  requiresApproval: false,
  extraCost: '',
  rules: '',
  status: 'ACTIVA',
}

function toForm(a: Amenidad): FormState {
  return {
    name: a.name,
    description: a.description ?? '',
    capacity: a.capacity ? String(a.capacity) : '',
    durationMinutes: String(a.durationMinutes),
    startTime: a.startTime,
    endTime: a.endTime,
    weekDays: a.weekDays,
    requiresApproval: a.requiresApproval,
    extraCost: a.extraCost ? String(a.extraCost) : '',
    rules: a.rules ?? '',
    status: a.status,
  }
}

export default function AmenidadesList({
  amenidades,
  coto,
}: {
  amenidades: Amenidad[]
  coto: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing]     = useState<Amenidad | null>(null)
  const [creating, setCreating]   = useState(false)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Imagen: la existente (al editar) es una URL; la nueva es un File hasta que se sube
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [imagenFile, setImagenFile]               = useState<File | null>(null)
  const [removeImage, setRemoveImage]             = useState(false)

  const resetImageState = (a?: Amenidad | null) => {
    setExistingImageUrl(a?.imageUrl ?? null)
    setImagenFile(null)
    setRemoveImage(false)
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    resetImageState(null)
    setError(null)
    setCreating(true)
  }

  const openEdit = (a: Amenidad) => {
    setForm(toForm(a))
    resetImageState(a)
    setError(null)
    setEditing(a)
  }

  const closeModal = () => {
    setCreating(false)
    setEditing(null)
    setError(null)
  }

  const handleQuitarFoto = () => {
    if (imagenFile) {
      setImagenFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } else if (existingImageUrl) {
      setExistingImageUrl(null)
      setRemoveImage(true)
    }
  }

  const imagenPreviewUrl = imagenFile ? URL.createObjectURL(imagenFile) : existingImageUrl

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      weekDays: f.weekDays.includes(day)
        ? f.weekDays.filter((d) => d !== day)
        : [...f.weekDays, day].sort(),
    }))
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('name', form.name.trim())
    fd.append('description', form.description || '')
    fd.append('capacity', form.capacity || '')
    fd.append('durationMinutes', form.durationMinutes || '60')
    fd.append('startTime', form.startTime)
    fd.append('endTime', form.endTime)
    fd.append('weekDays', JSON.stringify(form.weekDays))
    fd.append('requiresApproval', String(form.requiresApproval))
    fd.append('extraCost', form.extraCost || '')
    fd.append('rules', form.rules || '')
    fd.append('status', form.status)
    if (imagenFile) fd.append('imagen', imagenFile)
    if (removeImage) fd.append('removeImage', 'true')
    return fd
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url    = editing ? `/api/amenidades/${editing.id}` : '/api/amenidades'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        body: buildFormData(),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ocurrió un error al guardar')
        return
      }
      closeModal()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (a: Amenidad) => {
    if (!confirm(`¿Eliminar "${a.name}"? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/amenidades/${a.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'No se pudo eliminar')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-end mb-6">
        <button onClick={openCreate} className="btn-primary text-sm">
          <Plus size={16} strokeWidth={2} />
          Agregar amenidad
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {amenidades.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-900 text-sm font-medium">
              Aún no hay amenidades registradas
            </p>
            <p className="text-xs text-neutral-400 mt-1.5">
              Agrega la primera amenidad para que los vecinos puedan reservarla.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {amenidades.map((a) => {
              const st = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.ACTIVA
              const Icon = st.icon
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-100/40 transition-colors cursor-pointer"
                  onClick={() => openEdit(a)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {a.imageUrl ? (
                      <img
                        src={a.imageUrl}
                        alt={a.name}
                        className="w-11 h-11 rounded-xl object-cover border border-neutral-100 flex-shrink-0"
                      />
                    ) : (
                      <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-neutral-100">
                        <ImageOff size={16} className="text-neutral-400" strokeWidth={1.5} />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 mb-0.5 truncate">
                        {a.name}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {a.startTime}–{a.endTime}
                        {' · '}
                        {a.capacity ? `Hasta ${a.capacity} personas` : 'Sin límite de capacidad'}
                      </p>
                      <p className="text-xs text-neutral-900/70 mt-0.5">
                        {a.requiresApproval ? 'Requiere aprobación' : 'Aprobación automática'}
                        {a.extraCost ? ` · $${Number(a.extraCost).toLocaleString('es-MX')} MXN` : ' · Incluida en cuota'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${st.text} ${st.bg}`}>
                      <Icon size={12} strokeWidth={2} />
                      {st.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(a) }}
                      className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg p-1.5 transition-colors"
                    >
                      <Pencil size={15} strokeWidth={2} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(a) }}
                      className="text-neutral-400 hover:text-danger hover:bg-danger/5 rounded-lg p-1.5 transition-colors"
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal alta/edición */}
      {(creating || editing) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl border border-neutral-100 w-full max-w-lg shadow-black max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-neutral-100">
              <div>
                <h3 className="font-medium text-neutral-900">
                  {editing ? 'Editar amenidad' : 'Nueva amenidad'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {editing ? editing.name : 'Configura los datos que verá el vecino'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg p-1.5 transition-colors"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-danger">{error}</p>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Alberca, Salón de eventos, Cancha de pádel"
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Breve descripción visible para el vecino..."
                  rows={2}
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400 resize-none"
                />
              </div>

              {/* Imagen */}
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                  Imagen
                </label>

                {imagenPreviewUrl && (
                  <img
                    src={imagenPreviewUrl}
                    alt="Vista previa"
                    className="w-full aspect-video object-cover rounded-xl border border-neutral-100 mb-2"
                  />
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setImagenFile(file)
                    if (file) setRemoveImage(false)
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-neutral-100 rounded-xl py-5 flex flex-col items-center gap-2 hover:border-black hover:bg-black/[0.02] transition-all"
                >
                  {imagenFile ? (
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-success" strokeWidth={2.5} />
                      <p className="text-sm font-medium text-success">{imagenFile.name}</p>
                    </div>
                  ) : imagenPreviewUrl ? (
                    <p className="text-sm font-medium text-neutral-900">Cambiar imagen</p>
                  ) : (
                    <>
                      <ImagePlus size={22} className="text-neutral-400" strokeWidth={1.5} />
                      <p className="text-sm text-neutral-900 font-medium">Agregar foto de la amenidad</p>
                      <p className="text-xs text-neutral-400">Toca para seleccionar una imagen</p>
                    </>
                  )}
                </button>

                {imagenPreviewUrl && (
                  <button
                    type="button"
                    onClick={handleQuitarFoto}
                    className="text-xs text-danger hover:underline mt-1.5"
                  >
                    Quitar foto
                  </button>
                )}
              </div>

              {/* Capacidad y duración */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                    Capacidad máxima
                  </label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="Sin límite"
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                    Duración por reserva (min)
                  </label>
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
                  />
                </div>
              </div>

              {/* Horario */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              {/* Días disponibles */}
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                  Días disponibles
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {WEEKDAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        form.weekDays.includes(d.value)
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-neutral-400 border-neutral-100 hover:border-black hover:text-neutral-900'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aprobación y costo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                    Aprobación
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, requiresApproval: !form.requiresApproval })}
                    className={`w-full text-sm px-3 py-2.5 rounded-xl border transition-colors ${
                      form.requiresApproval
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-900 border-neutral-100 hover:border-black'
                    }`}
                  >
                    {form.requiresApproval ? 'Requiere aprobación' : 'Automática'}
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                    Costo adicional (MXN)
                  </label>
                  <input
                    type="number"
                    value={form.extraCost}
                    onChange={(e) => setForm({ ...form, extraCost: e.target.value })}
                    placeholder="Incluida en cuota"
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
                  />
                </div>
              </div>

              {/* Reglas */}
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                  Reglas de uso
                </label>
                <textarea
                  value={form.rules}
                  onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  placeholder="Ej. Máximo 3 horas por reserva, no se permite música después de las 22:00..."
                  rows={2}
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400 resize-none"
                />
              </div>

              {/* Estado — solo al editar */}
              {editing && (
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                    Estado
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, status: key })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                          form.status === key
                            ? `${cfg.bg} ${cfg.text} border-transparent`
                            : 'bg-white text-neutral-400 border-neutral-100 hover:border-black hover:text-neutral-900'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  disabled={loading}
                  className="btn-ghost flex-1 py-3 text-sm justify-center disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" strokeWidth={2} />
                      Guardando...
                    </>
                  ) : editing ? (
                    'Guardar cambios'
                  ) : (
                    'Crear amenidad'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
