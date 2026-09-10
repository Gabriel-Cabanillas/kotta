'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Check, Home, ShieldCheck } from 'lucide-react'
import { calculateLandingPrice, type LandingBillingMode } from './pricing-calculator'

const FEATURES = ['Gestión de residentes', 'Gestión de viviendas', 'Comunicados y avisos', 'Reservaciones de áreas comunes', 'Invitaciones y accesos', 'Control administrativo', 'Portal de residentes', 'Soporte y actualizaciones'] as const
const SCALES = [
  { range: 'Hasta 100 viviendas', detail: 'Desde $3,500 + IVA/mes' },
  { range: '101–300 viviendas', detail: '+$15 por vivienda adicional a 100' },
  { range: '301–600 viviendas', detail: '+$18 por vivienda adicional a 300' },
  { range: 'Más de 600', detail: 'Cotización Enterprise' },
] as const
const TERMS = ['Mensual: sin permanencia', 'Contrato anual: 10% de descuento y compromiso de 12 meses', 'Pagos mensuales en ambas modalidades', 'Soporte y actualizaciones incluidos'] as const
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const CONTACT_URL = 'https://wa.me/526699999999?text=Hola,%20tengo%20dudas%20sobre%20KOTTA'

export default function Pricing() {
  const [housingUnits, setHousingUnits] = useState('200')
  const [mode, setMode] = useState<LandingBillingMode>('ANNUAL')
  const units = Math.max(1, Number(housingUnits) || 1)
  const quote = useMemo(() => calculateLandingPrice(units, mode), [units, mode])

  return (
    <section id="precio" className="relative w-full overflow-hidden bg-white py-20 md:py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        <header className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Precios claros</p>
          <h2 className="font-gotham text-4xl font-medium tracking-tight text-neutral-900 md:text-5xl">Un precio que crece con tu comunidad</h2>
          <p className="mx-auto mt-5 max-w-2xl font-gotham text-base font-light leading-relaxed text-neutral-500 md:text-lg">Todas las funcionalidades de Kotta están incluidas. El precio se calcula según el número de viviendas de tu condominio.</p>
        </header>

        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-card lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-neutral-100 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white"><Home className="h-4 w-4" strokeWidth={1.8} /></div><div><p className="font-gotham text-sm font-medium text-neutral-900">Calcula tu mensualidad</p><p className="mt-0.5 text-xs text-neutral-400">Obtén una referencia inmediata antes de IVA.</p></div></div>
            <label htmlFor="pricing-homes" className="mt-8 block text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">Número de viviendas</label>
            <div className="relative mt-2"><input id="pricing-homes" type="number" min="1" step="1" value={housingUnits} onChange={(event) => setHousingUnits(event.target.value)} className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 pr-24 font-gotham text-2xl font-medium text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-4 focus:ring-black/[0.04]" /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">viviendas</span></div>
            <fieldset className="mt-7"><legend className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">Modalidad</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><button type="button" onClick={() => setMode('MONTHLY')} className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${mode === 'MONTHLY' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>Mensual</button><button type="button" onClick={() => setMode('ANNUAL')} className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${mode === 'ANNUAL' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>Contrato anual · 10% de descuento</button></div></fieldset>
            {mode === 'ANNUAL' && <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-500">Compromiso de 12 meses. El pago continúa siendo mensual.</p>}
          </div>

          <div className="flex flex-col justify-between bg-[#0B0F19] p-6 text-white sm:p-8 lg:p-10">
            <div><p className="text-xs font-medium uppercase tracking-[0.12em] text-white/45">{quote.housingUnits.toLocaleString('es-MX')} viviendas · {mode === 'ANNUAL' ? 'Contrato anual' : 'Mensual'}</p>{quote.isEnterprise ? <div className="mt-8"><h3 className="font-gotham text-3xl font-medium tracking-tight sm:text-4xl">Cotización personalizada</h3><p className="mt-4 max-w-lg text-sm leading-6 text-white/60">Para comunidades de más de 600 viviendas, nuestro equipo prepara una propuesta acorde con la escala de la operación.</p></div> : <div className="mt-7"><div className="flex flex-wrap items-end gap-x-3 gap-y-1"><span className="font-gotham text-4xl font-medium tracking-tight sm:text-5xl">{money.format(quote.monthlyPrice ?? 0)}</span><span className="pb-1 text-sm text-white/55">MXN / mes + IVA</span></div>{mode === 'ANNUAL' && quote.regularMonthlyPrice !== null && <p className="mt-4 text-sm text-white/60">Precio normal {money.format(quote.regularMonthlyPrice)} · <span className="font-medium text-white">Ahorras {money.format(quote.monthlySavings)} al mes</span></p>}</div>}</div>
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-100 sm:w-fit">{quote.isEnterprise ? 'Hablar con Kotta' : 'Solicitar información'} <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">{SCALES.map((scale) => <article key={scale.range} className="rounded-2xl border border-neutral-100 bg-white p-5"><p className="text-sm font-medium text-neutral-900">{scale.range}</p><p className="mt-2 text-xs leading-5 text-neutral-500">{scale.detail}</p></article>)}</div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 rounded-[2rem] border border-neutral-100 bg-neutral-50/70 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-neutral-900" /><h3 className="font-gotham text-xl font-medium text-neutral-900">Todas las funcionalidades están incluidas.</h3></div><ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">{FEATURES.map((feature) => <li key={feature} className="flex items-center gap-2.5 text-sm text-neutral-600"><Check className="h-4 w-4 shrink-0 text-neutral-900" strokeWidth={2.2} />{feature}</li>)}</ul></div>
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 sm:p-6"><p className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">Condiciones comerciales</p><ul className="mt-4 space-y-3">{TERMS.map((term) => <li key={term} className="flex items-start gap-2.5 text-sm leading-5 text-neutral-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />{term}</li>)}</ul></div>
        </div>
      </div>
    </section>
  )
}
