'use client'

/**
 * Interfaz de reservas para que el vecino consulte, cree y cancele reservas de amenidades.
 * Contiene el listado de reservas proximas, el catalogo de amenidades con su horario,
 * dias disponibles, aprobacion y costo, y el modal de nueva reserva con horarios
 * validos calculados a partir de la duracion configurada por el admin.
 * Se relaciona con src/app/[coto]/vecino/reservas/page.tsx,
 * /api/reservas/crear y /api/reservas/cancelar.
 * Existe dentro de Kotta para administrar el uso de amenidades compartidas
 * desde el panel residencial del vecino.
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

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
}

type Reserva = {
  id: string
  date: Date
  startTime: string
  endTime: string
  status: string
  amenity: { name: string }
}

type Ocupacion = {
  amenityId: string
  date: Date
  startTime: string
  endTime: string
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDIENTE:  { color: '#F5A623', bg: '#FEF3E2', label: 'Pendiente'  },
  CONFIRMADA: { color: '#1DB87E', bg: '#E6F9F1', label: 'Confirmada' },
  CANCELADA:  { color: '#E8503A', bg: '#FEECEA', label: 'Cancelada'  },
}

const DIAS_LABEL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function minutosDesde(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
function formatoHora(totalMin: number) {
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0')
  const m = (totalMin % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
function mismaFecha(a: Date, dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const fa = new Date(a)
  return fa.getFullYear() === y && fa.getMonth() === m - 1 && fa.getDate() === d
}
function aYYYYMMDD(d: Date) {
  const fd = new Date(d)
  const y = fd.getFullYear()
  const m = String(fd.getMonth() + 1).padStart(2, '0')
  const dd = String(fd.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export default function ReservasForm({
  amenidades,
  misReservas,
  ocupadas = [],
  userId,
}: {
  amenidades: Amenidad[]
  misReservas: Reserva[]
  ocupadas?: Ocupacion[]
  userId: string
}) {
  const router  = useRouter()
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    amenityId: '',
    date:      '',
    startTime: '',
    notes:     '',
  })

  const amenidadSeleccionada = useMemo(
    () => amenidades.find((a) => a.id === form.amenityId) ?? null,
    [amenidades, form.amenityId],
  )

  const ocupadasAmenidad = useMemo(
    () => ocupadas.filter((o) => o.amenityId === form.amenityId),
    [ocupadas, form.amenityId],
  )

  const ocupadasDelDia = useMemo(
    () => (form.date ? ocupadasAmenidad.filter((o) => mismaFecha(o.date, form.date)) : []),
    [ocupadasAmenidad, form.date],
  )

  // Genera los slots posibles de la amenidad y descarta los que se traslapan
  // con una reserva ya activa (PENDIENTE o CONFIRMADA) ese mismo día.
  const generarSlots = (amenidad: Amenidad, ocupadasDia: Ocupacion[]) => {
    const inicio   = minutosDesde(amenidad.startTime)
    const fin       = minutosDesde(amenidad.endTime)
    const duracion = amenidad.durationMinutes
    const opciones: string[] = []
    for (let t = inicio; t + duracion <= fin; t += duracion) {
      const tFin = t + duracion
      const ocupado = ocupadasDia.some((o) => {
        const oInicio = minutosDesde(o.startTime)
        const oFin     = minutosDesde(o.endTime)
        return t < oFin && tFin > oInicio
      })
      if (!ocupado) opciones.push(formatoHora(t))
    }
    return opciones
  }

  // Horas de inicio válidas: dentro del horario de la amenidad y sin traslape
  // con otra reserva ya activa ese día.
  const horasDisponibles = useMemo(() => {
    if (!amenidadSeleccionada) return []
    return generarSlots(amenidadSeleccionada, ocupadasDelDia)
  }, [amenidadSeleccionada, ocupadasDelDia])

  const diaSinCupo = Boolean(form.date && amenidadSeleccionada && horasDisponibles.length === 0)

  // Próximas fechas (60 días) en las que la amenidad ya no tiene ningún
  // horario libre, para avisarle al vecino antes de que intente elegirlas.
  const fechasSinCupo = useMemo(() => {
    if (!amenidadSeleccionada) return []
    const resultado: string[] = []
    const hoy = new Date()
    for (let i = 0; i < 60 && resultado.length < 6; i++) {
      const dia = new Date(hoy)
      dia.setDate(hoy.getDate() + i)
      if (!amenidadSeleccionada.weekDays.includes(dia.getDay())) continue
      const dateStr = aYYYYMMDD(dia)
      const ocupadasEseDia = ocupadasAmenidad.filter((o) => mismaFecha(o.date, dateStr))
      const libres = generarSlots(amenidadSeleccionada, ocupadasEseDia)
      if (libres.length === 0) resultado.push(dateStr)
    }
    return resultado
  }, [amenidadSeleccionada, ocupadasAmenidad])

  const horaFinCalculada = useMemo(() => {
    if (!amenidadSeleccionada || !form.startTime) return ''
    return formatoHora(minutosDesde(form.startTime) + amenidadSeleccionada.durationMinutes)
  }, [amenidadSeleccionada, form.startTime])

  // Valida que la fecha elegida caiga en un día habilitado por la amenidad
  const diaInvalido = useMemo(() => {
    if (!amenidadSeleccionada || !form.date) return false
    const [y, m, d] = form.date.split('-').map(Number)
    const diaSemana = new Date(y, m - 1, d).getDay()
    return !amenidadSeleccionada.weekDays.includes(diaSemana)
  }, [amenidadSeleccionada, form.date])

  const abrirModalPara = (amenityId: string) => {
    setForm({ amenityId, date: '', startTime: '', notes: '' })
    setError(null)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.amenityId || !form.date || !form.startTime || !horaFinCalculada) return
    if (diaInvalido) {
      setError('La amenidad no está disponible ese día')
      return
    }
    if (diaSinCupo) {
      setError('Ese día ya no tiene horarios disponibles')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reservas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenityId: form.amenityId,
          date: form.date,
          startTime: form.startTime,
          endTime: horaFinCalculada,
          notes: form.notes,
          userId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo crear la reserva')
        return
      }
      setShowModal(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = async (reservaId: string) => {
    await fetch('/api/reservas/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservaId }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-6">

      {/* Mis reservas próximas */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="font-medium text-[#0F1F34] text-sm">Mis reservas próximas</h2>
        </div>

        {misReservas.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[#6B7A99] text-sm">No tienes reservas próximas.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {misReservas.map((reserva) => {
              const st = STATUS_CONFIG[reserva.status] ?? STATUS_CONFIG.PENDIENTE
              return (
                <div key={reserva.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#0F1F34]">{reserva.amenity.name}</p>
                    <p className="text-xs text-[#6B7A99] mt-0.5">
                      {new Date(reserva.date).toLocaleDateString('es-MX', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                      {' · '}{reserva.startTime} – {reserva.endTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                    {reserva.status !== 'CANCELADA' && (
                      <button onClick={() => handleCancelar(reserva.id)} className="text-xs text-[#E8503A] hover:underline">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Amenidades disponibles */}
      {amenidades.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] py-12 text-center">
          <p className="text-[#6B7A99] text-sm">El administrador no ha configurado amenidades aún.</p>
        </div>
      ) : (
        <div>
          <h2 className="font-medium text-[#0F1F34] text-sm mb-3">Áreas disponibles</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {amenidades.map((amenidad) => (
              <div key={amenidad.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#C5D5EE] hover:shadow-sm transition-all">
                {amenidad.imageUrl ? (
                  <img src={amenidad.imageUrl} alt={amenidad.name} className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-[#FEF3E2] flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#F5A623" strokeWidth="1.8" fill="none"/>
                      <path d="M3 9h18M8 2v4M16 2v4" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[#0F1F34]">{amenidad.name}</h3>
                    {amenidad.capacity && (
                      <span className="text-xs text-[#6B7A99] bg-[#F7F9FC] px-2 py-1 rounded-lg border border-[#E2E8F0] flex-shrink-0 ml-2">
                        Hasta {amenidad.capacity}
                      </span>
                    )}
                  </div>

                  {amenidad.description && (
                    <p className="text-xs text-[#6B7A99] mb-3">{amenidad.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {DIAS_LABEL.map((label, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          amenidad.weekDays.includes(i) ? 'bg-[#E8F4FD] text-[#185FA5]' : 'text-[#C5D5EE]'
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-[#6B7A99] mb-1">
                    {amenidad.startTime} – {amenidad.endTime} · sesiones de {amenidad.durationMinutes} min
                  </p>
                  <p className="text-xs text-[#6B7A99] mb-3">
                    {amenidad.requiresApproval ? 'Requiere aprobación del administrador' : 'Confirmación automática'}
                    {' · '}
                    {amenidad.extraCost ? `$${amenidad.extraCost.toLocaleString('es-MX')} MXN` : 'Incluida en tu cuota'}
                  </p>

                  <button
                    onClick={() => abrirModalPara(amenidad.id)}
                    className="text-sm text-[#4FA8E8] font-medium hover:underline"
                  >
                    Reservar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal nueva reserva */}
      {showModal && amenidadSeleccionada && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-medium text-[#0F1F34]">Reservar {amenidadSeleccionada.name}</h3>
                <p className="text-xs text-[#6B7A99] mt-0.5">
                  {amenidadSeleccionada.startTime}–{amenidadSeleccionada.endTime} · sesiones de {amenidadSeleccionada.durationMinutes} min
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#6B7A99] hover:text-[#0F1F34] p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-[#FEECEA] border border-[#F3B8B0] rounded-xl px-4 py-3">
                  <p className="text-xs text-[#E8503A]">{error}</p>
                </div>
              )}

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Fecha *</label>
                <input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, startTime: '' }))}
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                />
                {diaInvalido && (
                  <p className="text-xs text-[#E8503A] mt-1.5">
                    Esta amenidad no está disponible ese día. Días habilitados:{' '}
                    {amenidadSeleccionada.weekDays.map((d) => DIAS_LABEL[d]).join(', ')}
                  </p>
                )}
                {!diaInvalido && diaSinCupo && (
                  <p className="text-xs text-[#E8503A] mt-1.5">
                    Ese día ya no tiene horarios disponibles, elige otra fecha.
                  </p>
                )}
                {!diaInvalido && !diaSinCupo && ocupadasDelDia.length > 0 && (
                  <p className="text-xs text-[#6B7A99] mt-1.5">
                    Horarios ya ocupados ese día:{' '}
                    {ocupadasDelDia.map((o) => `${o.startTime}–${o.endTime}`).join(', ')}
                  </p>
                )}
                {fechasSinCupo.length > 0 && (
                  <p className="text-xs text-[#6B7A99] mt-1.5">
                    Próximas fechas sin cupo:{' '}
                    {fechasSinCupo.map((f, i) => {
                      const [y, m, d] = f.split('-').map(Number)
                      const label = new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                      return i === fechasSinCupo.length - 1 ? label : `${label}, `
                    })}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Hora *</label>
                <select
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  disabled={!form.date || diaInvalido || diaSinCupo}
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] disabled:bg-[#F7F9FC] disabled:text-[#C5D5EE]"
                >
                  <option value="">
                    {!form.date ? 'Elige una fecha primero...' : 'Seleccionar horario...'}
                  </option>
                  {horasDisponibles.map((h) => (
                    <option key={h} value={h}>
                      {h} – {formatoHora(minutosDesde(h) + amenidadSeleccionada.durationMinutes)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Notas (opcional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Fiesta de cumpleaños, 20 personas"
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
                />
              </div>

              <div className="bg-[#F7F9FC] rounded-xl px-4 py-3 border border-[#E2E8F0] space-y-1">
                {amenidadSeleccionada.requiresApproval ? (
                  <p className="text-xs text-[#6B7A99]">
                    Tu reserva quedará <span className="font-medium text-[#0F1F34]">pendiente de aprobación</span> del administrador.
                  </p>
                ) : (
                  <p className="text-xs text-[#6B7A99]">Tu reserva se confirma automáticamente.</p>
                )}
                {amenidadSeleccionada.extraCost ? (
                  <p className="text-xs text-[#6B7A99]">
                    Costo adicional: <span className="font-medium text-[#0F1F34]">${amenidadSeleccionada.extraCost.toLocaleString('es-MX')} MXN</span>
                  </p>
                ) : (
                  <p className="text-xs text-[#6B7A99]">Incluida en tu cuota, sin costo adicional.</p>
                )}
                {amenidadSeleccionada.rules && (
                  <p className="text-xs text-[#6B7A99] pt-1 border-t border-[#E2E8F0] mt-2">{amenidadSeleccionada.rules}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 py-3 text-sm justify-center">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.date || !form.startTime || diaInvalido || diaSinCupo || loading}
                className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Confirmar reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}