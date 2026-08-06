/** Tabla cronológica y filtros de los movimientos financieros normalizados. */
'use client'

import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Building2 } from 'lucide-react'

export type EstadoPago = 'PENDIENTE' | 'PROCESANDO' | 'PAGADO' | 'FALLIDO' | 'EN_DISPUTA' | 'DISPUTA_PERDIDA' | 'REEMBOLSADO'
export type TipoMovimiento = 'COBRO_VECINO' | 'PAGO_PROVEEDOR' | 'RETIRO_CONDOMINIO'
export type MovimientoFinanciero = {
  id: string
  tipo: TipoMovimiento
  monto: number
  montoRecibido?: number
  comisionEstimada?: number
  montoDescontado?: number
  estado: EstadoPago
  origenManual: boolean
  fecha: string
  contraparte: string
  detalle: string
}

const ESTADOS: Record<EstadoPago, { etiqueta: string; clases: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', clases: 'bg-warning/10 text-warning' },
  PROCESANDO: { etiqueta: 'Procesando', clases: 'bg-blue-50 text-blue-700' },
  PAGADO: { etiqueta: 'Pagado', clases: 'bg-success/10 text-success' },
  FALLIDO: { etiqueta: 'Fallido', clases: 'bg-red/10 text-red' },
  EN_DISPUTA: { etiqueta: 'En disputa', clases: 'bg-orange-50 text-orange-700' },
  DISPUTA_PERDIDA: { etiqueta: 'Disputa perdida', clases: 'bg-red/10 text-red' },
  REEMBOLSADO: { etiqueta: 'Reembolsado', clases: 'bg-neutral-100 text-neutral-600' },
}

const TIPOS: Record<TipoMovimiento, { etiqueta: string; clases: string; Icono: typeof ArrowDownLeft }> = {
  COBRO_VECINO: { etiqueta: 'Cobro a vecino', clases: 'bg-success/10 text-success', Icono: ArrowDownLeft },
  PAGO_PROVEEDOR: { etiqueta: 'Pago a proveedor', clases: 'bg-red/10 text-red', Icono: ArrowUpRight },
  RETIRO_CONDOMINIO: { etiqueta: 'Retiro a condominio', clases: 'bg-neutral-100 text-neutral-700', Icono: Building2 },
}

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

export default function MovimientosFinancieros({ movimientos, totalMovimientos }: { movimientos: MovimientoFinanciero[]; totalMovimientos: number }) {
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoMovimiento>('TODOS')
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | EstadoPago>('TODOS')
  const filtrados = useMemo(
    () => movimientos.filter((movimiento) => (filtroTipo === 'TODOS' || movimiento.tipo === filtroTipo) && (filtroEstado === 'TODOS' || movimiento.estado === filtroEstado)),
    [filtroEstado, filtroTipo, movimientos]
  )

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl text-[#0F1F34]">Movimientos</h2>
        <p className="mt-1 text-sm text-[#6B7A99]">Cobros, pagos a proveedores y retiros de saldo.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
        <div className="space-y-3 border-b border-neutral-100 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {(['TODOS', ...Object.keys(TIPOS)] as Array<'TODOS' | TipoMovimiento>).map((tipo) => (
              <button key={tipo} onClick={() => setFiltroTipo(tipo)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filtroTipo === tipo ? 'border-black bg-black text-white' : 'border-neutral-100 bg-white text-neutral-400 hover:border-neutral-200 hover:text-neutral-900'}`}>
                {tipo === 'TODOS' ? 'Todos los tipos' : TIPOS[tipo].etiqueta}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['TODOS', ...Object.keys(ESTADOS)] as Array<'TODOS' | EstadoPago>).map((estado) => (
              <button key={estado} onClick={() => setFiltroEstado(estado)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filtroEstado === estado ? 'border-black bg-black text-white' : 'border-neutral-100 bg-white text-neutral-400 hover:border-neutral-200 hover:text-neutral-900'}`}>
                {estado === 'TODOS' ? 'Todos los estados' : ESTADOS[estado].etiqueta}
              </button>
            ))}
          </div>
          {totalMovimientos > 100 && <p className="text-xs text-neutral-400">Mostrando los últimos 100 movimientos.</p>}
        </div>

        {filtrados.length === 0 ? (
          <div className="px-6 py-16 text-center"><p className="mb-1 text-sm font-medium text-neutral-900">Sin movimientos para estos filtros</p><p className="text-sm text-neutral-400">Prueba con otro tipo o estado de movimiento.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-neutral-100/60"><tr className="text-xs font-medium text-neutral-400"><th className="px-6 py-3">Movimiento</th><th className="px-4 py-3">Corresponde a</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th><th className="px-6 py-3 text-right">Monto</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {filtrados.map((movimiento) => {
                  const tipo = TIPOS[movimiento.tipo]
                  const estado = ESTADOS[movimiento.estado]
                  const Icono = tipo.Icono
                  const esPagoProveedor = movimiento.tipo === 'PAGO_PROVEEDOR'
                  const tieneEstimado = esPagoProveedor && Boolean(movimiento.comisionEstimada)
                  return <tr key={movimiento.id} className="transition-colors hover:bg-neutral-100/60">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tipo.clases}`}><Icono className="h-4 w-4" strokeWidth={2} /></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-neutral-900">{tipo.etiqueta}</p>{movimiento.origenManual && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">Pago externo</span>}</div><p className="mt-0.5 text-xs text-neutral-400">{movimiento.detalle}</p></div></div></td>
                    <td className="px-4 py-4 text-sm text-neutral-700">{movimiento.contraparte}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-neutral-500">{new Date(movimiento.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${estado.clases}`}>{estado.etiqueta}</span></td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-neutral-900">
                      {tieneEstimado ? <><p>Recibe {moneda.format(movimiento.montoRecibido ?? movimiento.monto)}</p><p className="mt-1 text-xs font-normal text-neutral-500">Descontado {moneda.format(movimiento.montoDescontado ?? movimiento.monto)}</p></> : <>{movimiento.tipo === 'COBRO_VECINO' ? '+' : '−'}{moneda.format(movimiento.monto)}</>}
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
