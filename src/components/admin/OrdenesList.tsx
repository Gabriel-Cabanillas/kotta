/**
 * Componente de gestion de ordenes de trabajo del panel administrativo de Kotta.
 * Contiene resumen por estado, filtros, detalle de ordenes, costos, notas y
 * actualizacion de cierre o cancelacion.
 * Se relaciona con la pagina admin de ordenes, los tickets asignados a
 * proveedores y la API /api/ordenes/actualizar.
 * Existe para que el ADMIN de seguimiento al trabajo de proveedores y mantenga
 * sincronizado el flujo entre tickets y ordenes.
 */

// Ya se rediseño
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock,
  Wrench,
  CheckCircle2,
  XCircle,
  X,
  ImageOff,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { calcularComisionPayoutEstimada } from '@/lib/stripe/fees'

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; text: string; bg: string }
> = {
  PENDIENTE:  { label: 'Pendiente',  icon: Clock,        text: 'text-neutral-400', bg: 'bg-neutral-100' },
  EN_PROCESO: { label: 'En proceso', icon: Wrench,       text: 'text-warning',     bg: 'bg-warning/10'  },
  COMPLETADA: { label: 'Completada', icon: CheckCircle2, text: 'text-success',     bg: 'bg-success/10'  },
  CANCELADA:  { label: 'Cancelada',  icon: XCircle,      text: 'text-danger',      bg: 'bg-danger/10'   },
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
  provider: {
    name: string
    id: string
    cuentaConectada: { id: string; payoutsEnabled: boolean } | null
  }
  distribucionesPago: { estado: string; origenManual: boolean; notaManual: string | null }[]
}

export default function OrdenesList({
  ordenes,
  coto,
  disponibleParaTransferirAhora,
  saldoEnLiquidacion,
}: {
  ordenes: Orden[]
  coto: string
  disponibleParaTransferirAhora: number | null
  saldoEnLiquidacion: number | null
}) {
  const router = useRouter()
  const [selected, setSelected]     = useState<Orden | null>(null)
  const [filterStatus, setFilter]   = useState('TODOS')
  const [loading, setLoading]       = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentConfirmationOpen, setPaymentConfirmationOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualMonto, setManualMonto] = useState('')
  const [manualFecha, setManualFecha] = useState('')
  const [manualNota, setManualNota] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
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
    setPaymentError(null)
    setPaymentConfirmationOpen(false)
    setManualOpen(false)
    setManualMonto(orden.cost ? String(orden.cost) : '')
    const hoy = new Date()
    setManualFecha(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`)
    setManualNota('')
  }

  const mensajeDeDisponibilidad = (disponible: number, enLiquidacion: number) =>
    `Tienes ${disponible.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} disponibles para retirar ahora. El resto de tu saldo (${enLiquidacion.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}) está en proceso de liquidación con Stripe y normalmente estará disponible en unos días.`

  const abrirConfirmacionPagoProveedor = () => {
    if (!selected) return
    setPaymentError(null)
    if (disponibleParaTransferirAhora === null) {
      setPaymentError('No fue posible verificar la disponibilidad actual con Stripe. Intenta nuevamente.')
      return
    }
    const { totalDescontado } = calcularComisionPayoutEstimada(Number(selected.cost ?? 0))
    if (totalDescontado > disponibleParaTransferirAhora) {
      setPaymentError(mensajeDeDisponibilidad(disponibleParaTransferirAhora, saldoEnLiquidacion ?? 0))
      return
    }
    setPaymentConfirmationOpen(true)
  }

  const handlePayProvider = async () => {
    if (!selected) return
    if (disponibleParaTransferirAhora === null) {
      setPaymentError('No fue posible verificar la disponibilidad actual con Stripe. Intenta nuevamente.')
      return
    }
    const { totalDescontado } = calcularComisionPayoutEstimada(Number(selected.cost ?? 0))
    if (totalDescontado > disponibleParaTransferirAhora) {
      setPaymentError(mensajeDeDisponibilidad(disponibleParaTransferirAhora, saldoEnLiquidacion ?? 0))
      setPaymentConfirmationOpen(false)
      return
    }
    setPaymentLoading(true)
    setPaymentError(null)
    try {
      const response = await fetch('/api/pagos/transferir-proveedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenId: selected.id }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setPaymentError(result.error ?? 'No fue posible pagar al proveedor')
        return
      }
      setSelected(null)
      setPaymentConfirmationOpen(false)
      router.refresh()
    } catch {
      setPaymentError('No fue posible comunicarse con el servidor. Intenta nuevamente.')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleRegisterManualPayment = async () => {
    if (!selected) return
    setManualLoading(true)
    setPaymentError(null)
    try {
      const response = await fetch('/api/pagos/registrar-pago-manual-proveedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId: selected.provider.id,
          ordenId: selected.id,
          monto: Number(manualMonto),
          fechaPago: manualFecha,
          nota: manualNota,
        }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setPaymentError(result.error ?? 'No fue posible registrar el pago externo')
        return
      }
      setSelected(null)
      router.refresh()
    } catch {
      setPaymentError('No fue posible comunicarse con el servidor. Intenta nuevamente.')
    } finally {
      setManualLoading(false)
    }
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon
          return (
            <div key={key} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em]">
                  {cfg.label}
                </p>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                  <Icon size={14} className={cfg.text} strokeWidth={2} />
                </span>
              </div>
              <p className="text-3xl font-medium text-neutral-900">
                {counts[key as keyof typeof counts]}
              </p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['TODOS', ...Object.keys(STATUS_CONFIG)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
              filterStatus === s
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-400 border-neutral-100 hover:border-black hover:text-neutral-900'
            }`}
          >
            {s === 'TODOS' ? 'Todas' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-900 text-sm font-medium">
              No hay órdenes en esta categoría
            </p>
            <p className="text-xs text-neutral-400 mt-1.5">
              Las órdenes se crean al asignar un ticket a un proveedor.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((orden) => {
              const st = STATUS_CONFIG[orden.status] ?? STATUS_CONFIG.PENDIENTE
              const Icon = st.icon
              return (
                <div
                  key={orden.id}
                  className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-neutral-100/40 transition-colors cursor-pointer"
                  onClick={() => openDetail(orden)}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${st.bg}`}
                    >
                      <Icon size={16} className={st.text} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 mb-0.5 truncate">
                        {orden.ticket.title}
                      </p>
                      <p className="text-xs text-neutral-400">
                        Ticket #{orden.ticket.folio} ·{' '}
                        {orden.ticket.reportedBy.name}
                        {orden.ticket.reportedBy.houseNumber &&
                          ` · Casa ${orden.ticket.reportedBy.houseNumber}`}
                      </p>
                      <p className="text-xs text-neutral-900/70 mt-0.5">
                        {orden.provider.name}
                      </p>
                      {orden.cost && (
                        <p className="text-xs text-success mt-0.5 font-medium">
                          ${Number(orden.cost).toLocaleString('es-MX')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <p className="text-xs text-neutral-400 hidden sm:block">
                      {new Date(orden.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.text} ${st.bg}`}>
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl border border-neutral-100 w-full max-w-lg shadow-black max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-neutral-100">
              <div>
                <p className="text-xs font-mono text-neutral-400 mb-1">
                  Ticket #{selected.ticket.folio}
                </p>
                <h3 className="font-medium text-neutral-900">{selected.ticket.title}</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {selected.provider.name}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg p-1.5 transition-colors"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Estado actual */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CONFIG[selected.status]?.text} ${STATUS_CONFIG[selected.status]?.bg}`}
                >
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
                <span className="text-xs text-neutral-400">
                  Creada el{' '}
                  {new Date(selected.createdAt).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long',
                  })}
                </span>
              </div>

              {/* Fotos evidencia */}
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-2">
                  Evidencia fotográfica
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Columna ANTES (Ticket original) */}
                  <div>
                    <p className="text-xs text-neutral-400 mb-1.5">Antes</p>
                    {selected.ticket.photoUrl ? (
                      <img
                        src={selected.ticket.photoUrl}
                        alt="Antes"
                        className="w-full aspect-square object-cover rounded-xl border border-neutral-100"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-neutral-100 rounded-xl border border-neutral-100 flex items-center justify-center">
                        <ImageOff size={18} className="text-neutral-400" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  {/* Columna DESPUÉS (Orden finalizada) */}
                  <div>
                    <p className="text-xs text-success mb-1.5">Después</p>
                    {selected.afterPhotoUrl ? (
                      <img
                        src={selected.afterPhotoUrl}
                        alt="Después"
                        className="w-full aspect-square object-cover rounded-xl border border-success/30"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-success/5 rounded-xl border border-success/20 flex items-center justify-center">
                        <p className="text-xs text-success/60">Pendiente</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Costo y notas */}
              {selected.status !== 'COMPLETADA' && selected.status !== 'CANCELADA' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                      Costo real (MXN)
                    </label>
                    <input
                      type="number"
                      value={costInput}
                      onChange={(e) => setCostInput(e.target.value)}
                      placeholder="Ej. 1200"
                      className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-400 uppercase tracking-[0.04em] mb-1.5 block">
                      Notas
                    </label>
                    <textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Observaciones sobre el trabajo..."
                      rows={2}
                      className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400 resize-none"
                    />
                  </div>
                </>
              )}

              {/* Costo registrado si ya está cerrada */}
              {selected.cost && (
                <div className="bg-success/5 border border-success/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-success font-medium">
                    Costo registrado: ${Number(selected.cost).toLocaleString('es-MX')} MXN
                  </p>
                  {selected.closedAt && (
                    <p className="text-xs text-success/70 mt-0.5">
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
                    className="btn-ghost flex-1 py-3 text-sm justify-center text-danger border-danger/20 hover:bg-danger/5 hover:border-danger/40 disabled:opacity-50"
                  >
                    Cancelar orden
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('COMPLETADA')}
                    disabled={loading}
                    className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" strokeWidth={2} />
                        Guardando...
                      </>
                    ) : (
                      'Marcar completada'
                    )}
                  </button>
                </div>
              )}

              {/* Pago al proveedor: solo existe cuando la orden ya tiene un costo
                  y fue completada. El backend vuelve a validar todas estas reglas. */}
              {selected.status === 'COMPLETADA' && (() => {
                const distribucion = selected.distribucionesPago[0]
                const yaPagada = distribucion?.estado === 'PAGADO'
                const esPagoExterno = distribucion?.origenManual === true
                const cuentaLista = selected.provider.cuentaConectada?.payoutsEnabled === true
                const cuentaRegistrada = selected.provider.cuentaConectada !== null
                const tieneCosto = Number(selected.cost ?? 0) > 0
                const estimadoPayout = calcularComisionPayoutEstimada(Number(selected.cost ?? 0))
                const motivoDeshabilitado = yaPagada
                  ? 'Esta orden ya fue pagada'
                  : !cuentaLista
                    ? 'El proveedor aún no tiene una cuenta lista para recibir pagos'
                    : !tieneCosto
                      ? 'Registra un costo válido antes de pagar'
                      : undefined

                return (
                  <div className="border-t border-neutral-100 pt-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Pago al proveedor</p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {yaPagada
                            ? esPagoExterno
                              ? 'Pago externo registrado fuera de Kotta'
                              : 'Transferencia registrada como pagada'
                            : cuentaLista
                              ? 'La transferencia se enviará a la cuenta conectada del proveedor'
                              : 'El proveedor debe completar la configuración de su cuenta de pago'}
                        </p>
                      </div>
                      {yaPagada && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${esPagoExterno ? 'text-neutral-600 bg-neutral-100' : 'text-success bg-success/10'}`}>
                          {esPagoExterno ? 'Pago externo' : 'Pagado'}
                        </span>
                      )}
                    </div>
                    {paymentError && (
                      <p className="mb-3 rounded-lg bg-danger/5 px-3 py-2 text-xs text-danger">
                        {paymentError}
                      </p>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        onClick={abrirConfirmacionPagoProveedor}
                        disabled={paymentLoading || Boolean(motivoDeshabilitado)}
                        title={motivoDeshabilitado}
                        className="btn-primary py-3 text-sm justify-center disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {paymentLoading ? (
                          <><Loader2 size={15} className="animate-spin" strokeWidth={2} /> Procesando pago...</>
                        ) : yaPagada ? 'Pago realizado' : 'Pagar proveedor'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualOpen((abierto) => !abierto)}
                        disabled={yaPagada || !cuentaRegistrada}
                        title={!cuentaRegistrada ? 'El proveedor no tiene una cuenta de pago registrada' : undefined}
                        className="btn-ghost py-3 text-sm justify-center disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Registrar pago manual (externo)
                      </button>
                    </div>
                    {motivoDeshabilitado && !yaPagada && (
                      <p className="mt-2 text-xs text-neutral-400">{motivoDeshabilitado}</p>
                    )}
                    {paymentConfirmationOpen && !yaPagada && cuentaLista && tieneCosto && (
                      <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.04em] text-neutral-400">Confirmar pago</p>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-4"><span className="text-neutral-600">Monto a pagar al proveedor</span><span className="font-medium text-neutral-900">${estimadoPayout.montoProveedor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                          <div className="flex items-center justify-between gap-4"><span className="text-neutral-600">Comisión estimada de Stripe (payout)</span><span className="font-medium text-neutral-900">${estimadoPayout.comisionEstimada.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                          <div className="flex items-center justify-between gap-4 border-t border-neutral-200 pt-2"><span className="font-medium text-neutral-900">Total a descontar de tu saldo disponible</span><span className="font-medium text-neutral-900">${estimadoPayout.totalDescontado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-neutral-500">Este es un estimado de la comisión de Stripe. Se concilia mensualmente contra el costo real.</p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <button type="button" onClick={() => setPaymentConfirmationOpen(false)} disabled={paymentLoading} className="btn-ghost py-2.5 text-sm justify-center">Cancelar</button>
                          <button type="button" onClick={handlePayProvider} disabled={paymentLoading} className="btn-primary py-2.5 text-sm justify-center disabled:opacity-50">{paymentLoading ? 'Procesando...' : `Confirmar pago por $${estimadoPayout.totalDescontado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</button>
                        </div>
                      </div>
                    )}
                    {!cuentaRegistrada && !yaPagada && (
                      <p className="mt-2 text-xs text-neutral-400">Registra primero la cuenta de pago del proveedor para conservar el historial externo.</p>
                    )}
                    {manualOpen && !yaPagada && (
                      <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                        <p className="text-xs font-medium text-neutral-900">Pago externo</p>
                        <p className="mt-1 text-xs text-neutral-500">Este registro no crea una transferencia ni descuenta saldo de plataforma.</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="text-xs font-medium text-neutral-500">Monto (MXN)<input type="number" min="0.01" step="0.01" value={manualMonto} onChange={(event) => setManualMonto(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none" /></label>
                          <label className="text-xs font-medium text-neutral-500">Fecha de pago<input type="date" value={manualFecha} onChange={(event) => setManualFecha(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none" /></label>
                        </div>
                        <label className="mt-3 block text-xs font-medium text-neutral-500">Nota opcional<textarea value={manualNota} onChange={(event) => setManualNota(event.target.value)} maxLength={500} rows={2} placeholder="Ej. Pagado por transferencia SPEI directa" className="mt-1.5 block w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none" /></label>
                        <button type="button" onClick={handleRegisterManualPayment} disabled={manualLoading} className="mt-3 w-full rounded-xl bg-neutral-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">
                          {manualLoading ? 'Guardando...' : 'Guardar pago externo'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
