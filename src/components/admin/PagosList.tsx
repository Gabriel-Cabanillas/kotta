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
import AsignarPagoForm from './AsignarPagoForm'

type EstadoPago =
  | 'PENDIENTE'
  | 'PROCESANDO'
  | 'PAGADO'
  | 'FALLIDO'
  | 'EN_DISPUTA'
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
    vecinoId: string | null
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
  const [filterStatus, setFilterStatus] = useState<'TODOS' | EstadoPago>('TODOS')

  const estadoDeDestinatario = (cargo: Cargo, viviendaId: string): EstadoPago =>
    cargo.pagos.find((pago) => pago.vecinoId === viviendaId)?.estado ?? 'PENDIENTE'

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
                    const estado = estadoDeDestinatario(cargo, vivienda.id)
                    const config = ESTADOS[estado]

                    return (
                      <div key={vivienda.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-sm text-neutral-900">{vivienda.name}</p>
                          {vivienda.houseNumber && (
                            <p className="text-xs text-neutral-400 mt-0.5">Casa {vivienda.houseNumber}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
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
