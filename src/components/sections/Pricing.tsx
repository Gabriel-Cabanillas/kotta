'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, Check, Home, ShieldCheck } from 'lucide-react'
import { calculateLandingPrice, type LandingBillingMode } from './pricing-calculator'

const FEATURES = ['Gestión de residentes', 'Gestión de viviendas', 'Comunicados y avisos', 'Reservaciones de áreas comunes', 'Invitaciones y accesos', 'Control administrativo', 'Portal de residentes', 'Soporte y actualizaciones'] as const
const SCALES = [
  { range: 'Hasta 100', detail: 'Desde $3,500 + IVA/mes' },
  { range: '101–300', detail: '+$15 por vivienda adicional a 100' },
  { range: '301–600', detail: '+$18 por vivienda adicional a 300' },
  { range: '601+', detail: 'Cotización Enterprise' },
] as const
const TERMS = ['Mensual: sin permanencia', 'Contrato anual: 10% de descuento y compromiso de 12 meses', 'Pagos mensuales en ambas modalidades', 'Soporte y actualizaciones incluidos'] as const
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const CONTACT_URL = 'https://wa.me/526699999999?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Kotta'

export default function Pricing() {
  const [housingUnits, setHousingUnits] = useState('200')
  const [mode, setMode] = useState<LandingBillingMode>('ANNUAL')
  const units = Math.max(1, Number(housingUnits) || 1)
  const quote = useMemo(() => calculateLandingPrice(units, mode), [units, mode])

  return (
    <section id="precio" className="bg-white py-24 sm:py-28 md:py-36">
      <div className="landing-shell">
        <header className="landing-reveal mx-auto max-w-3xl text-center"><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Precio transparente</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.04em] text-black sm:text-5xl md:text-6xl">Un precio que crece con tu comunidad.</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-500">Todas las funcionalidades están incluidas. El precio se calcula según las viviendas y la modalidad de contratación.</p></header>

        <div className="landing-reveal mx-auto mt-14 grid max-w-6xl overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)] lg:grid-cols-[0.88fr_1.12fr] md:mt-16" data-reveal="scale" style={{ transitionDelay: '80ms' }}>
          <div className="border-b border-neutral-200 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white"><Home className="h-4 w-4" strokeWidth={1.8} /></div><div><p className="text-sm font-medium text-black">Calcula tu mensualidad</p><p className="mt-0.5 text-xs text-neutral-400">Referencia mensual antes de IVA.</p></div></div>

            <label htmlFor="pricing-homes" className="mt-9 block text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">Número de viviendas</label>
            <div className="relative mt-2"><input id="pricing-homes" type="number" min="1" step="1" inputMode="numeric" value={housingUnits} onChange={(event) => setHousingUnits(event.target.value)} className="landing-focus w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 pr-24 text-2xl font-medium text-black transition-[border-color,box-shadow] duration-300 hover:border-neutral-300 focus:border-black focus:ring-4 focus:ring-black/[0.04] focus:ring-offset-0" /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">viviendas</span></div>

            <fieldset className="mt-7"><legend className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">Modalidad</legend><div className="relative mt-2 grid grid-cols-2 rounded-xl bg-neutral-100 p-1">{(['MONTHLY', 'ANNUAL'] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`landing-focus relative z-10 rounded-lg px-3 py-3 text-left text-xs font-medium transition-all duration-300 sm:text-sm ${mode === value ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:text-black'}`}>{value === 'MONTHLY' ? 'Mensual' : 'Anual · 10% menos'}</button>)}</div></fieldset>
            <div className="mt-4 min-h-[60px]">{mode === 'ANNUAL' ? <p className="product-panel-enter rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-500">Compromiso de 12 meses. El pago continúa siendo mensual.</p> : <p className="product-panel-enter rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-500">Pago mensual, sin permanencia y sin penalización por terminación.</p>}</div>
          </div>

          <div className="flex min-h-[410px] flex-col justify-between bg-[#0D0D0D] p-6 text-white sm:p-8 lg:p-10">
            <div><p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">{quote.housingUnits.toLocaleString('es-MX')} viviendas · {mode === 'ANNUAL' ? 'Contrato anual' : 'Mensual'}</p><div key={`${quote.monthlyPrice}-${mode}`} className="price-result-enter">{quote.isEnterprise ? <div className="mt-10"><h3 className="max-w-lg text-4xl font-medium tracking-[-0.035em] sm:text-5xl">Cotización personalizada</h3><p className="mt-5 max-w-lg text-sm leading-6 text-white/50">Para comunidades de más de 600 viviendas, Kotta prepara una propuesta acorde con la escala de la operación.</p></div> : <div className="mt-9"><div className="flex flex-wrap items-end gap-x-3 gap-y-2"><span className="text-5xl font-medium tracking-[-0.045em] sm:text-6xl">{money.format(quote.monthlyPrice ?? 0)}</span><span className="pb-1 text-sm text-white/45">MXN / mes + IVA</span></div>{mode === 'ANNUAL' && quote.regularMonthlyPrice !== null && <div className="mt-7 border-t border-white/15 pt-5"><p className="text-xs text-white/40">Precio mensual regular <span className="text-white/70 line-through decoration-white/25">{money.format(quote.regularMonthlyPrice)}</span></p><p className="mt-2 text-sm font-medium text-white">Ahorras {money.format(quote.monthlySavings)} cada mes</p></div>}</div>}</div></div>
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="landing-focus group mt-10 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-neutral-100 sm:w-fit">{quote.isEnterprise ? 'Hablar sobre Enterprise' : 'Solicitar información'} <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
          </div>
        </div>

        <div className="landing-reveal mx-auto mt-7 grid max-w-6xl border-y border-neutral-200 sm:grid-cols-2 lg:grid-cols-4" style={{ transitionDelay: '120ms' }}>{SCALES.map((scale, index) => <div key={scale.range} className={`py-5 sm:px-5 ${index > 0 ? 'border-t border-neutral-200 sm:border-t-0 sm:border-l' : ''}`}><p className="text-sm font-medium text-black">{scale.range} viviendas</p><p className="mt-2 text-xs leading-5 text-neutral-500">{scale.detail}</p></div>)}</div>

        <div className="landing-reveal mx-auto mt-14 grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20" style={{ transitionDelay: '80ms' }}><div><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-black" /><h3 className="text-xl font-medium text-black">Todas las funcionalidades están incluidas.</h3></div><ul className="mt-6 grid gap-x-8 sm:grid-cols-2">{FEATURES.map((feature) => <li key={feature} className="flex items-center gap-2.5 border-t border-neutral-200 py-3.5 text-sm text-neutral-600"><Check className="h-4 w-4 shrink-0 text-black" strokeWidth={2.2} />{feature}</li>)}</ul></div><div className="border-l border-neutral-200 pl-6 lg:pl-8"><p className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">Condiciones comerciales</p><ul className="mt-5 space-y-4">{TERMS.map((term) => <li key={term} className="flex items-start gap-3 text-sm leading-6 text-neutral-600"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />{term}</li>)}</ul></div></div>
      </div>
    </section>
  )
}
