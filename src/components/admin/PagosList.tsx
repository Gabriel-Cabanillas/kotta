/**
 * Componente de gestion de pagos del panel administrativo de Kotta.
 * Contiene resumen de cobranza, filtros por estado, registro de pagos y marcado
 * rapido de pagos como pagados.
 * Se relaciona con la pagina admin de pagos y con las APIs /api/pagos/crear y
 * /api/pagos/actualizar.
 * Existe para que el ADMIN controle la informacion financiera mensual del coto
 * dentro del flujo de administracion del SaaS.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

type Pago = {
  id: string
  amount: any
  status: string
  month: number
  year: number
  paidAt: Date | null
  notes: string | null
  user: { id: string; name: string; houseNumber: string | null }
}

type Vecino = {
  id: string
  name: string
  houseNumber: string | null
}

export default function PagosList({
  pagos,
  vecinos,
  orgId,
  mesActual,
  anioActual,
}: {
  pagos: Pago[]
  vecinos: Vecino[]
  orgId: string
  mesActual: number
  anioActual: number
}) {
  const router = useRouter()
  const [showModal, setShowModal]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [form, setForm] = useState({
    userId:  '',
    amount:  '1500',
    month:   mesActual,
    year:    anioActual,
    notes:   '',
    status:  'PAGADO',
  })

  const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
    PENDIENTE: { color: '#F5A623', bg: '#FEF3E2', label: 'Pendiente' },
    PAGADO:    { color: '#1DB87E', bg: '#E6F9F1', label: 'Pagado'    },
    VENCIDO:   { color: '#E8503A', bg: '#FEECEA', label: 'Vencido'   },
  }

  const filtered = filterStatus === 'TODOS'
    ? pagos
    : pagos.filter((p) => p.status === filterStatus)

  const totalPagado  = pagos.filter((p) => p.status === 'PAGADO').length
  const totalVencido = pagos.filter((p) => p.status === 'VENCIDO').length
  const totalPendiente = pagos.filter((p) => p.status === 'PENDIENTE').length

  const handleSubmit = async () => {
    if (!form.userId || !form.amount) return
    setLoading(true)
    try {
      await fetch('/api/pagos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, orgId }),
      })
      setShowModal(false)
      setForm({
        userId: '', amount: '1500',
        month: mesActual, year: anioActual,
        notes: '', status: 'PAGADO',
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarPagado = async (pagoId: string) => {
    await fetch('/api/pagos/actualizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagoId, status: 'PAGADO', paidAt: new Date() }),
    })
    router.refresh()
  }

  return (
    <div>
      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pagados',   value: totalPagado,   color: '#1DB87E', bg: '#E6F9F1' },
          { label: 'Pendientes', value: totalPendiente, color: '#F5A623', bg: '#FEF3E2' },
          { label: 'Vencidos',  value: totalVencido,  color: '#E8503A', bg: '#FEECEA' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <p className="text-xs text-[#6B7A99] mb-2">{s.label}</p>
            <p className="font-display text-3xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros + botón */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          {['TODOS', 'PAGADO', 'PENDIENTE', 'VENCIDO'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                filterStatus === s
                  ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                  : 'bg-white text-[#4A5568] border-[#E2E8F0] hover:border-[#C5D5EE]'
              }`}
            >
              {s === 'TODOS' ? 'Todos' : STATUS_COLORS[s].label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-sm py-2.5 px-5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Registrar pago
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#6B7A99] text-sm">No hay pagos registrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filtered.map((pago) => {
              const st = STATUS_COLORS[pago.status] ?? STATUS_COLORS.PENDIENTE
              return (
                <div
                  key={pago.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F9FC] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#E8F0F9] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-[#1E3A5F]">
                        {pago.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0F1F34]">
                        {pago.user.name}
                        {pago.user.houseNumber && (
                          <span className="text-[#6B7A99] font-normal ml-1.5">
                            Casa {pago.user.houseNumber}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#6B7A99]">
                        {MESES[pago.month - 1]} {pago.year} ·{' '}
                        ${Number(pago.amount).toLocaleString('es-MX')}
                        {pago.paidAt && (
                          <span>
                            {' · Pagado el '}
                            {new Date(pago.paidAt).toLocaleDateString('es-MX', {
                              day: 'numeric', month: 'short',
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {st.label}
                    </span>
                    {pago.status !== 'PAGADO' && (
                      <button
                        onClick={() => handleMarcarPagado(pago.id)}
                        className="text-xs text-[#1DB87E] border border-[#9FE1CB] hover:bg-[#E6F9F1] px-3 py-1.5 rounded-lg transition-all"
                      >
                        Marcar pagado
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal registrar pago */}
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
              <h3 className="font-medium text-[#0F1F34]">Registrar pago</h3>
              <button onClick={() => setShowModal(false)} className="text-[#6B7A99] hover:text-[#0F1F34] p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Vecino *</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                >
                  <option value="">Seleccionar vecino...</option>
                  {vecinos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}{v.houseNumber ? ` — Casa ${v.houseNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B7A99] mb-1.5 block">Mes</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                    className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                  >
                    {MESES.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6B7A99] mb-1.5 block">Año</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Monto (MXN) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                />
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                >
                  <option value="PAGADO">Pagado</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="VENCIDO">Vencido</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Notas (opcional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Pago parcial, transferencia..."
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
                disabled={!form.userId || !form.amount || loading}
                className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
