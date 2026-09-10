'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, Check } from 'lucide-react'
import { calculateLandingPrice, type LandingBillingMode } from './pricing-calculator'

const FEATURES = ['Gestión de residentes y viviendas', 'Comunicados y avisos', 'Reservaciones de áreas comunes', 'Invitaciones y accesos', 'Control administrativo', 'Portal de residentes', 'Tickets y órdenes de trabajo', 'Soporte y actualizaciones'] as const
const SCALES = [
  ['1–100', 'Precio base mensual', '$3,500 + IVA'],
  ['101–300', 'Por vivienda adicional a 100', '+ $15'],
  ['301–600', 'Por vivienda adicional a 300', '+ $18'],
  ['601+', 'Operación Enterprise', 'Cotización personalizada'],
] as const
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const CONTACT_URL = 'https://wa.me/526699999999?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Kotta'

export default function Pricing() {
  const [housingUnits, setHousingUnits] = useState('200')
  const [mode, setMode] = useState<LandingBillingMode>('ANNUAL')
  const units = Math.max(1, Number(housingUnits) || 1)
  const quote = useMemo(() => calculateLandingPrice(units, mode), [units, mode])

  return (
    <section id="precio" className="bg-white py-24 md:py-36">
      <div className="container-kotta">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Precio transparente</p><h2 className="mt-4 max-w-4xl text-4xl font-medium leading-[1.05] tracking-[-0.04em] text-black sm:text-5xl md:text-7xl">El tamaño cambia el precio. No lo que puedes hacer.</h2></div><p className="max-w-md text-base leading-7 text-neutral-500 lg:pb-2">Todas las funcionalidades están incluidas. Calcula una referencia mensual según las viviendas y modalidad de tu condominio.</p></div>

        <div className="mt-14 grid overflow-hidden border-y border-black bg-black lg:grid-cols-[0.78fr_1.22fr] md:mt-20">
          <div className="bg-white px-0 py-8 lg:pr-10 lg:py-12">
            <label htmlFor="pricing-homes" className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">Número de viviendas</label>
            <div className="mt-4 flex items-end border-b border-black pb-3"><input id="pricing-homes" type="number" min="1" step="1" inputMode="numeric" value={housingUnits} onChange={(event) => setHousingUnits(event.target.value)} className="min-w-0 flex-1 bg-transparent text-5xl font-medium tracking-tight text-black outline-none sm:text-6xl" /><span className="pb-1 text-sm text-neutral-400">viviendas</span></div>
            <fieldset className="mt-8"><legend className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">Modalidad</legend><div className="mt-4 flex flex-col gap-2 sm:flex-row">{(['MONTHLY', 'ANNUAL'] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${mode === value ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-500 hover:border-black hover:text-black'}`}>{value === 'MONTHLY' ? 'Mensual' : 'Contrato anual · −10%'}</button>)}</div></fieldset>
            <p className="mt-5 min-h-10 text-xs leading-5 text-neutral-400">{mode === 'ANNUAL' ? 'Compromiso de 12 meses. El pago continúa siendo mensual.' : 'Sin permanencia y sin penalización por terminación.'}</p>
          </div>

          <div className="flex min-h-[390px] flex-col justify-between px-6 py-9 text-white sm:px-10 lg:px-14 lg:py-12">
            <div><p className="font-mono text-xs uppercase tracking-[0.12em] text-white/35">{quote.housingUnits.toLocaleString('es-MX')} viviendas / {mode === 'ANNUAL' ? 'Contrato anual' : 'Mensual'}</p>{quote.isEnterprise ? <div className="mt-10"><p className="text-4xl font-medium tracking-tight sm:text-6xl">Cotización personalizada</p><p className="mt-5 max-w-lg text-sm leading-6 text-white/50">Para más de 600 viviendas, Kotta prepara una propuesta acorde con la escala de la operación.</p></div> : <div className="mt-10"><p className="text-5xl font-medium tracking-[-0.04em] sm:text-7xl">{money.format(quote.monthlyPrice ?? 0)}</p><p className="mt-3 text-sm text-white/45">MXN / mes + IVA</p>{mode === 'ANNUAL' && quote.regularMonthlyPrice !== null && <p className="mt-8 border-t border-white/15 pt-5 text-sm text-white/50">Precio mensual regular {money.format(quote.regularMonthlyPrice)} <span className="mx-2 text-white/20">/</span> Ahorro mensual <span className="text-white">{money.format(quote.monthlySavings)}</span></p>}</div>}</div>
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="group mt-12 inline-flex w-fit items-center gap-3 border-b border-white pb-2 text-sm font-medium text-white">{quote.isEnterprise ? 'Hablar sobre Enterprise' : 'Solicitar información'}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
          </div>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-24">
          <div><p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">Escala de precio</p><div className="mt-5 border-t border-neutral-200">{SCALES.map(([range, detail, price]) => <div key={range} className="grid grid-cols-[80px_1fr] gap-4 border-b border-neutral-200 py-5 sm:grid-cols-[90px_1fr_auto]"><p className="text-sm font-medium text-black">{range}</p><p className="text-sm text-neutral-400">{detail}</p><p className="col-start-2 text-sm font-medium text-black sm:col-start-auto">{price}</p></div>)}</div></div>
          <div><p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">Incluido con Kotta</p><ul className="mt-5 grid gap-x-8 sm:grid-cols-2">{FEATURES.map((feature) => <li key={feature} className="flex items-center gap-3 border-t border-neutral-200 py-4 text-sm text-neutral-600"><Check className="h-4 w-4 shrink-0 text-black" />{feature}</li>)}</ul><p className="mt-7 text-sm leading-6 text-neutral-500">Mensual y anual se pagan mes a mes. El contrato anual aplica 10% de descuento y mantiene un compromiso de 12 meses.</p></div>
        </div>
      </div>
    </section>
  )
}
