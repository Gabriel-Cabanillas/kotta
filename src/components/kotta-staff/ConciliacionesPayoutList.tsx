/** Lista interna para capturar y revisar conciliaciones mensuales de Connect. */
'use client'

import { useState } from 'react'
import { CheckCircle2, CircleAlert, Loader2, PencilLine } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Conciliacion = {
  periodo: string
  totalEstimadoCobrado: number
  totalRealFacturado: number | null
  diferencia: number | null
  estado: string
}

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

function etiquetaPeriodo(periodo: string) {
  const [anio, mes] = periodo.split('-').map(Number)
  return new Date(anio, mes - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

export default function ConciliacionesPayoutList({ conciliaciones }: { conciliaciones: Conciliacion[] }) {
  const router = useRouter()
  const [periodoAbierto, setPeriodoAbierto] = useState<string | null>(null)
  const [montoReal, setMontoReal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const abrirFormulario = (conciliacion: Conciliacion) => {
    setPeriodoAbierto(conciliacion.periodo)
    setMontoReal(conciliacion.totalRealFacturado?.toFixed(2) ?? '')
    setError(null)
  }

  const guardar = async () => {
    if (!periodoAbierto) return
    setGuardando(true)
    setError(null)
    try {
      const response = await fetch('/api/kotta-staff/conciliacion-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo: periodoAbierto, totalRealFacturado: Number(montoReal) }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setError(result.error ?? 'No se pudo guardar la conciliación.')
        return
      }
      setPeriodoAbierto(null)
      router.refresh()
    } catch {
      setError('No fue posible comunicarse con el servidor.')
    } finally {
      setGuardando(false)
    }
  }

  if (conciliaciones.length === 0) {
    return <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-16 text-center"><CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-success" /><p className="text-sm font-medium text-neutral-900">Aún no hay pagos con comisión estimada</p><p className="mt-1 text-sm text-neutral-400">Los períodos aparecerán después de pagar proveedores mediante Stripe.</p></div>
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
      <div className="border-b border-neutral-100 px-6 py-4"><h2 className="text-sm font-medium text-neutral-900">Conciliaciones por período</h2><p className="mt-1 text-xs text-neutral-400">Compara el estimado cobrado a los condominios contra el total real facturado por Stripe.</p></div>
      <div className="divide-y divide-neutral-100">
        {conciliaciones.map((conciliacion) => {
          const conciliada = conciliacion.estado === 'CONCILIADO' && conciliacion.totalRealFacturado !== null
          const falta = (conciliacion.diferencia ?? 0) > 0
          const sobra = (conciliacion.diferencia ?? 0) < 0
          const abierto = periodoAbierto === conciliacion.periodo
          return <article key={conciliacion.periodo} className="px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div><p className="text-sm font-medium capitalize text-neutral-900">{etiquetaPeriodo(conciliacion.periodo)}</p><p className="mt-1 text-xs text-neutral-400">Estimado acumulado: {moneda.format(conciliacion.totalEstimadoCobrado)}</p></div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-7">
                <div><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-neutral-400">Facturado por Stripe</p><p className="mt-1 text-sm font-medium text-neutral-900">{conciliacion.totalRealFacturado === null ? 'Pendiente' : moneda.format(conciliacion.totalRealFacturado)}</p></div>
                <div><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-neutral-400">Diferencia</p><p className={`mt-1 text-sm font-medium ${falta ? 'text-red' : sobra ? 'text-success' : 'text-neutral-900'}`}>{conciliacion.diferencia === null ? '—' : `${falta ? 'Faltó ' : sobra ? 'Sobró ' : ''}${moneda.format(Math.abs(conciliacion.diferencia))}`}</p></div>
                <button type="button" onClick={() => abrirFormulario(conciliacion)} className="btn-ghost px-3 py-2 text-xs"><PencilLine className="h-3.5 w-3.5" />{conciliada ? 'Editar' : 'Registrar facturado'}</button>
              </div>
            </div>
            {abierto && <div className="mt-4 max-w-md rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"><label className="block text-xs font-medium text-neutral-600">Total real facturado por Stripe (MXN)<input autoFocus type="number" min="0" step="0.01" value={montoReal} onChange={(event) => setMontoReal(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none" /></label><p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-neutral-500"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />Captura el importe desde la facturación de Stripe del período seleccionado.</p>{error && <p className="mt-2 text-xs text-red">{error}</p>}<div className="mt-3 flex gap-2"><button type="button" onClick={() => setPeriodoAbierto(null)} disabled={guardando} className="btn-ghost px-3 py-2 text-xs">Cancelar</button><button type="button" onClick={guardar} disabled={guardando || montoReal === ''} className="btn-primary px-3 py-2 text-xs">{guardando ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Guardando</> : 'Guardar conciliación'}</button></div></div>}
          </article>
        })}
      </div>
    </section>
  )
}
