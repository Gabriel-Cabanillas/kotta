/** Resumen financiero de lectura para el panel administrativo. */
'use client'

import { ArrowDownLeft, ArrowUpRight, Clock3, Scale, WalletCards } from 'lucide-react'

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

export default function PanelFinanciero({ resumen }: { resumen: { ingresos: number; egresos: number; balanceNeto: number; saldoDisponible: number; disponibleAhora: number | null; enLiquidacion: number | null } }) {
  const tarjetas = [
    { etiqueta: 'Ingresos del mes', valor: resumen.ingresos, descripcion: 'Cobros confirmados a vecinos', Icono: ArrowDownLeft, icono: 'bg-success/10 text-success', clase: 'text-neutral-900' },
    { etiqueta: 'Egresos del mes', valor: resumen.egresos, descripcion: 'Pagos confirmados a proveedores', Icono: ArrowUpRight, icono: 'bg-red/10 text-red', clase: 'text-neutral-900' },
    { etiqueta: 'Balance neto del mes', valor: resumen.balanceNeto, descripcion: 'Ingresos menos egresos', Icono: Scale, icono: 'bg-neutral-100 text-neutral-700', clase: resumen.balanceNeto < 0 ? 'text-red' : 'text-neutral-900' },
    { etiqueta: 'Saldo contable total', valor: resumen.saldoDisponible, descripcion: 'Acumulado histórico; no garantiza disponibilidad inmediata', Icono: WalletCards, icono: 'bg-black text-white', clase: 'text-neutral-900' },
    { etiqueta: 'Disponible para retirar ahora', valor: resumen.disponibleAhora, descripcion: 'Límite actual para transferencias y retiros', Icono: WalletCards, icono: 'bg-success/10 text-success', clase: 'text-neutral-900' },
    { etiqueta: 'En proceso de liquidación', valor: resumen.enLiquidacion, descripcion: 'Normalmente disponible en unos días', Icono: Clock3, icono: 'bg-warning/10 text-warning', clase: 'text-neutral-900' },
  ]

  return (
    <section aria-labelledby="resumen-financiero">
      <div className="mb-4">
        <h2 id="resumen-financiero" className="font-display text-xl text-[#0F1F34]">Resumen financiero</h2>
        <p className="text-sm text-[#6B7A99] mt-1">Actividad confirmada y saldo contable del condominio.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tarjetas.map(({ etiqueta, valor, descripcion, Icono, icono, clase }) => (
          <article key={etiqueta} className="bg-white rounded-2xl border border-neutral-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-5">
              <p className="text-xs font-medium text-neutral-400">{etiqueta}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${icono}`}><Icono className="w-4 h-4" strokeWidth={2} /></div>
            </div>
            <p className={`font-display text-2xl tracking-tight ${clase}`}>{valor === null ? 'Sin verificar' : moneda.format(valor)}</p>
            <p className="text-xs text-neutral-400 mt-2">{descripcion}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
