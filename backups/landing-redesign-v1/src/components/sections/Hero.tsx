import { ArrowRight, Building2, CheckCircle2, CreditCard, ShieldCheck, Wrench } from 'lucide-react'

const CONTACT_URL = 'https://wa.me/526699999999?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Kotta'

export default function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden border-b border-neutral-100 bg-white pb-20 pt-28 md:pb-28 md:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(0,0,0,0.045),transparent_34%)]" />
      <div className="container-kotta relative grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-100 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600"><ShieldCheck className="h-3.5 w-3.5 text-black" /> Operación clara para comunidades mejor administradas</div>
          <h1 className="max-w-3xl text-[2.75rem] font-medium leading-[1.02] tracking-[-0.045em] text-black sm:text-5xl md:text-6xl lg:text-[4.25rem]">Tu condominio, organizado desde un solo lugar.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-neutral-500 md:text-lg md:leading-8">Kotta es la plataforma web para administrar residentes, pagos, accesos, mantenimiento y comunicación con más orden, trazabilidad y control.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center px-7 py-3.5">Solicitar información <ArrowRight className="h-4 w-4" /></a><a href="#precio" className="btn-ghost justify-center px-7 py-3.5">Ver precios</a></div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-500">{['Todas las funcionalidades incluidas', 'Plataforma web', 'Datos separados por condominio'].map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-black" />{item}</span>)}</div>
        </div>
        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-neutral-100/70 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-[#0B0D10] p-3 shadow-[0_32px_80px_rgba(0,0,0,0.18)] sm:p-4">
            <div className="rounded-[1.25rem] bg-white p-5 sm:p-7">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-5"><div><p className="text-xs text-neutral-400">Residencial Los Pinos</p><p className="mt-1 text-base font-medium text-black">Panel de administración</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-medium text-white">AD</div></div>
              <div className="mt-5 grid grid-cols-3 gap-2.5">{[['12', 'Tickets'], ['96%', 'Cuotas'], ['23', 'Activos']].map(([value, label]) => <div key={label} className="rounded-xl bg-neutral-50 p-3.5"><p className="text-xl font-medium text-black">{value}</p><p className="mt-1 text-[11px] text-neutral-400">{label}</p></div>)}</div>
              <div className="mt-5 space-y-2.5">{[
                { icon: Wrench, title: 'Mantenimiento', detail: 'Órdenes y evidencias en seguimiento' },
                { icon: CreditCard, title: 'Control administrativo', detail: 'Movimientos y cuotas organizados' },
                { icon: Building2, title: 'Comunidad', detail: 'Residentes, accesos y amenidades' },
              ].map(({ icon: Icon, title, detail }) => <div key={title} className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white"><Icon className="h-4 w-4" /></div><div><p className="text-sm font-medium text-black">{title}</p><p className="text-xs text-neutral-400">{detail}</p></div><ArrowRight className="ml-auto h-4 w-4 text-neutral-300" /></div>)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
