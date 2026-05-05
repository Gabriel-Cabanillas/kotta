'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Amenidad = {
  id: string
  name: string
  description: string | null
  capacity: number | null
}

type Reserva = {
  id: string
  date: Date
  startTime: string
  endTime: string
  status: string
  amenity: { name: string }
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDIENTE:  { color: '#F5A623', bg: '#FEF3E2', label: 'Pendiente'  },
  CONFIRMADA: { color: '#1DB87E', bg: '#E6F9F1', label: 'Confirmada' },
  CANCELADA:  { color: '#E8503A', bg: '#FEECEA', label: 'Cancelada'  },
}

export default function ReservasForm({
  amenidades,
  misReservas,
  userId,
}: {
  amenidades: Amenidad[]
  misReservas: Reserva[]
  userId: string
}) {
  const router  = useRouter()
  const [loading, setLoading]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    amenityId: '',
    date:      '',
    startTime: '09:00',
    endTime:   '11:00',
    notes:     '',
  })

  const handleSubmit = async () => {
    if (!form.amenityId || !form.date) return
    setLoading(true)
    try {
      await fetch('/api/reservas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId }),
      })
      setShowModal(false)
      setForm({ amenityId: '', date: '', startTime: '09:00', endTime: '11:00', notes: '' })
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
          {amenidades.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-sm py-2 px-4"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Nueva reserva
            </button>
          )}
        </div>

        {misReservas.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[#6B7A99] text-sm">No tienes reservas próximas.</p>
            {amenidades.length > 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 text-sm text-[#4FA8E8] hover:underline"
              >
                Hacer una reserva →
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {misReservas.map((reserva) => {
              const st = STATUS_CONFIG[reserva.status] ?? STATUS_CONFIG.PENDIENTE
              return (
                <div
                  key={reserva.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0F1F34]">
                      {reserva.amenity.name}
                    </p>
                    <p className="text-xs text-[#6B7A99] mt-0.5">
                      {new Date(reserva.date).toLocaleDateString('es-MX', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                      {' · '}{reserva.startTime} – {reserva.endTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {st.label}
                    </span>
                    {reserva.status !== 'CANCELADA' && (
                      <button
                        onClick={() => handleCancelar(reserva.id)}
                        className="text-xs text-[#E8503A] hover:underline"
                      >
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
          <p className="text-[#6B7A99] text-sm">
            El administrador no ha configurado amenidades aún.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="font-medium text-[#0F1F34] text-sm mb-3">
            Áreas disponibles
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {amenidades.map((amenidad) => (
              <div
                key={amenidad.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:border-[#C5D5EE] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF3E2] flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2"
                        stroke="#F5A623" strokeWidth="1.8" fill="none"/>
                      <path d="M3 9h18M8 2v4M16 2v4"
                        stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {amenidad.capacity && (
                    <span className="text-xs text-[#6B7A99] bg-[#F7F9FC] px-2 py-1 rounded-lg border border-[#E2E8F0]">
                      Hasta {amenidad.capacity} personas
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-[#0F1F34] mb-1">{amenidad.name}</h3>
                {amenidad.description && (
                  <p className="text-xs text-[#6B7A99] mb-3">{amenidad.description}</p>
                )}
                <button
                  onClick={() => {
                    setForm((f) => ({ ...f, amenityId: amenidad.id }))
                    setShowModal(true)
                  }}
                  className="text-sm text-[#4FA8E8] font-medium hover:underline"
                >
                  Reservar →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal nueva reserva */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <h3 className="font-medium text-[#0F1F34]">Nueva reserva</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#6B7A99] hover:text-[#0F1F34] p-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Área *</label>
                <select
                  value={form.amenityId}
                  onChange={(e) => setForm((f) => ({ ...f, amenityId: e.target.value }))}
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                >
                  <option value="">Seleccionar área...</option>
                  {amenidades.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Fecha *</label>
                <input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B7A99] mb-1.5 block">Hora inicio</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B7A99] mb-1.5 block">Hora fin</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Fiesta de cumpleaños, 20 personas"
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
                />
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
                disabled={!form.amenityId || !form.date || loading}
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