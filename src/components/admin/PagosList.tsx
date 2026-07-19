/**
 * Componente de gestion de pagos del panel administrativo de Kotta.
 * Contiene resumen de cobranza, filtros por estado, registro de pagos y marcado
 * rapido de pagos como pagados.
 * Se relaciona con la pagina admin de pagos y con las APIs /api/pagos/crear y
 * /api/pagos/actualizar.
 * Existe para que el ADMIN controle la informacion financiera mensual del coto
 * dentro del flujo de administracion del SaaS.
 */

// Ya se rediseño


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

  // Estilos por estado — clases estáticas (Tailwind necesita las clases completas
  // presentes en el archivo para poder generarlas, no admite interpolación dinámica)
  const STATUS_COLORS: Record<string, { label: string; dot: string; badge: string }> = {
    PENDIENTE: { label: 'Pendiente', dot: 'bg-warning', badge: 'bg-warning/10 text-warning' },
    PAGADO:    { label: 'Pagado',    dot: 'bg-success', badge: 'bg-success/10 text-success' },
    VENCIDO:   { label: 'Vencido',   dot: 'bg-danger',  badge: 'bg-danger/10 text-danger'   },
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
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { key: 'PAGADO',    label: 'Pagados',    value: totalPagado },
          { key: 'PENDIENTE', label: 'Pendientes', value: totalPendiente },
          { key: 'VENCIDO',   label: 'Vencidos',   value: totalVencido },
        ].map((s) => (
          <div
            key={s.key}
            className="bg-white rounded-2xl border border-neutral-100 p-5 transition-all duration-300 hover:border-neutral-200 hover:shadow-card"
          >
            <div className="flex items-center gap-1.5 mb-3">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[s.key].dot}`} />
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-[0.06em]">
                {s.label}
              </p>
            </div>
            <p className="text-3xl font-medium text-neutral-900 tabular-nums">{s.value}</p>
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
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                filterStatus === s
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-200 hover:text-neutral-900'
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
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 10h18M7 15h2m4 0h4M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="#A6A6A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-neutral-400 text-sm">No hay pagos registrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((pago) => {
              const st = STATUS_COLORS[pago.status] ?? STATUS_COLORS.PENDIENTE
              return (
                <div
                  key={pago.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors duration-150 hover:bg-black/[0.015]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-white">
                        {pago.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {pago.user.name}
                        {pago.user.houseNumber && (
                          <span className="text-neutral-400 font-normal ml-1.5">
                            Casa {pago.user.houseNumber}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-400">
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
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${st.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    {pago.status !== 'PAGADO' && (
                      <button
                        onClick={() => handleMarcarPagado(pago.id)}
                        className="text-xs font-medium text-neutral-900 border border-neutral-100 hover:border-black px-3 py-1.5 rounded-lg transition-all duration-150"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-neutral-100 w-full max-w-md shadow-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h3 className="font-medium text-neutral-900">Registrar pago</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 p-1 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">Vecino *</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
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
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">Mes</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                  >
                    {MESES.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">Año</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">Monto (MXN) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                >
                  <option value="PAGADO">Pagado</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="VENCIDO">Vencido</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">Notas (opcional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Pago parcial, transferencia..."
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
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