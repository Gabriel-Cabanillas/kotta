/**
 * Lista los cargos asignados por el administrador y el estado de pago real
 * de cada vivienda destinataria.
 *
 * Se relaciona con Cargo, CargoDestinatario y Pago, recibidos desde la pÃ¡gina
 * administrativa de pagos. Existe para que el panel muestre el flujo Stripe
 * activo y no las mensualidades heredadas del modelo Payment.
 */
'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AsignarPagoForm from './AsignarPagoForm'

type EstadoPago =
  | 'PENDIENTE'
  | 'PROCESANDO'
  | 'PAGADO'
  | 'FALLIDO'
  | 'EN_DISPUTA'
  | 'DISPUTA_PERDIDA'
  | 'REEMBOLSADO'

type Vecino = {
  id: string
  name: string
  houseNumber: string | null
}

type Cargo = {
  id: string
  concepto: string
  monto: unknown
  fechaLimite: Date | string
  tipo: 'MASIVO' | 'GRUPO' | 'INDIVIDUAL'
  destinatarios: Array<{ vivienda: Vecino }>
  pagos: Array<{
    id: string
    vecinoId: string | null
    monto: unknown
    montoConRecargo: unknown | null
    estado: EstadoPago
    createdAt: Date | string
    updatedAt: Date | string
  }>
}

const ESTADOS: Record<EstadoPago, { label: string; dot: string; badge: string }> = {
  PENDIENTE: { label: 'Pendiente', dot: 'bg-warning', badge: 'bg-warning/10 text-warning' },
  PROCESANDO: { label: 'Procesando', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
  PAGADO: { label: 'Pagado', dot: 'bg-success', badge: 'bg-success/10 text-success' },
  FALLIDO: { label: 'Fallido', dot: 'bg-danger', badge: 'bg-danger/10 text-danger' },
  EN_DISPUTA: { label: 'En disputa', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700' },
  DISPUTA_PERDIDA: { label: 'Disputa perdida', dot: 'bg-danger', badge: 'bg-danger/10 text-danger' },
  REEMBOLSADO: { label: 'Reembolsado', dot: 'bg-neutral-400', badge: 'bg-neutral-100 text-neutral-600' },
}

const TIPOS_CARGO: Record<Cargo['tipo'], string> = {
  MASIVO: 'Masivo',
  GRUPO: 'Grupo',
  INDIVIDUAL: 'Individual',
}

export default function PagosList({
  cargos,
  vecinos,
}: {
  cargos: Cargo[]
  vecinos: Vecino[]
}) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<'TODOS' | EstadoPago>('TODOS')
  const [confirmandoPagoId, setConfirmandoPagoId] = useState<string | null>(null)
  const [reembolsandoPagoId, setReembolsandoPagoId] = useState<string | null>(null)
  const [errorReembolso, setErrorReembolso] = useState<string | null>(null)

  const estadoDeDestinatario = (cargo: Cargo, viviendaId: string): EstadoPago =>
    cargo.pagos.find((pago) => pago.vecinoId === viviendaId)?.estado ?? 'PENDIENTE'

  const pagoDeDestinatario = (cargo: Cargo, viviendaId: string) =>
    cargo.pagos.find((pago) => pago.vecinoId === viviendaId)

  const reembolsar = async (pagoId: string) => {
    setErrorReembolso(null)
    setReembolsandoPagoId(pagoId)
    try {
      const respuesta = await fetch('/api/pagos/admin/reembolsar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagoId }),
      })
      const datos = await respuesta.json() as { error?: string }
      if (!respuesta.ok) {
        setErrorReembolso(datos.error ?? 'No fue posible iniciar el reembolso.')
        setReembolsandoPagoId(null)
        return
      }
      setConfirmandoPagoId(null)
      // El webhook confirma REEMBOLSADO; conservamos este estado visual hasta
      // que el administrador recargue y reciba la actualización confirmada.
      router.refresh()
    } catch {
      setErrorReembolso('No fue posible conectar con el servidor. Intenta nuevamente.')
      setReembolsandoPagoId(null)
    }
  }

  const cargosFiltrados = cargos.filter((cargo) =>
    filterStatus === 'TODOS' || cargo.destinatarios.some(
      ({ vivienda }) => estadoDeDestinatario(cargo, vivienda.id) === filterStatus
    )
  )

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {(['TODOS', ...Object.keys(ESTADOS)] as Array<'TODOS' | EstadoPago>).map((estado) => (
            <button
              key={estado}
              onClick={() => setFilterStatus(estado)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                filterStatus === estado
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-200 hover:text-neutral-900'
              }`}
            >
              {estado === 'TODOS' ? 'Todos' : ESTADOS[estado].label}
            </button>
          ))}
        </div>

        <AsignarPagoForm vecinos={vecinos} />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {cargosFiltrados.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-400 text-sm">No hay cargos registrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {cargosFiltrados.map((cargo) => (
              <section key={cargo.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{cargo.concepto}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      ${Number(cargo.monto).toLocaleString('es-MX')} MXN
                      {' Â· Vence el '}
                      {new Date(cargo.fechaLimite).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
                    {TIPOS_CARGO[cargo.tipo]}
                  </span>
                </div>

                <div className="rounded-xl border border-neutral-100 divide-y divide-neutral-100">
                  {cargo.destinatarios.map(({ vivienda }) => {
                    const pago = pagoDeDestinatario(cargo, vivienda.id)
                    const estado = pago?.estado ?? 'PENDIENTE'
                    const config = ESTADOS[estado]
                    const reembolsando = pago?.id === reembolsandoPagoId
                    const montoReembolso = pago ? Number(pago.montoConRecargo ?? pago.monto) : 0

                    return (
                      <div key={vivienda.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-neutral-900">{vivienda.name}</p>
                            {vivienda.houseNumber && (
                              <p className="text-xs text-neutral-400 mt-0.5">Casa {vivienda.houseNumber}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {estado === 'PAGADO' && pago && !reembolsando && (
                              <button
                                type="button"
                                onClick={() => { setErrorReembolso(null); setConfirmandoPagoId(pago.id) }}
                                className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:border-black hover:text-black"
                              >
                                Reembolsar
                              </button>
                            )}
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${reembolsando ? ESTADOS.PROCESANDO.badge : config.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${reembolsando ? ESTADOS.PROCESANDO.dot : config.dot}`} />
                              {reembolsando ? 'Procesando reembolso' : config.label}
                            </span>
                          </div>
                        </div>
                        {confirmandoPagoId === pago?.id && (
                          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                            <p className="text-xs text-neutral-600">Se reembolsarán {montoReembolso.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} al vecino, incluido cualquier recargo de tarjeta.</p>
                            <div className="mt-3 flex justify-end gap-2">
                              <button type="button" onClick={() => setConfirmandoPagoId(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-black">Cancelar</button>
                              <button type="button" onClick={() => reembolsar(pago.id)} className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800">Confirmar reembolso</button>
                            </div>
                          </div>
                        )}
                        {reembolsando && <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-700"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Esperando confirmación de Stripe.</p>}
                        {errorReembolso && (confirmandoPagoId === pago?.id || reembolsando) && <p className="mt-2 text-xs text-danger">{errorReembolso}</p>}
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
