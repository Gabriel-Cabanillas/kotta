import { ArrowDown } from 'lucide-react'

export default function Definition() {
  return (
    <section className="border-y border-neutral-100 bg-white py-20 sm:py-24 md:py-32">
      <div className="landing-shell grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
        <div className="landing-reveal flex items-start gap-3 text-xs font-medium uppercase tracking-[0.14em] text-neutral-400" data-reveal="left"><span className="mt-1.5 h-px w-8 bg-black" />Qué es Kotta</div>
        <div className="landing-reveal" style={{ transitionDelay: '80ms' }}>
          <h2 className="max-w-4xl text-3xl font-medium leading-[1.1] tracking-[-0.04em] text-black sm:text-4xl md:text-6xl">El lugar donde la administración deja de estar repartida y empieza a trabajar como un sistema.</h2>
          <div className="mt-10 grid gap-8 border-t border-neutral-200 pt-8 sm:grid-cols-2">
            <p className="text-base leading-7 text-neutral-600">Kotta es software web para administradores de condominios y privadas. Centraliza residentes, pagos, mantenimiento, accesos, amenidades y comunicación.</p>
            <div className="flex items-start justify-between gap-8"><p className="max-w-sm text-base leading-7 text-neutral-600">Existe para convertir tareas aisladas en una operación visible, ordenada y fácil de seguir por cada rol.</p><a href="#producto" className="landing-focus group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:text-white" aria-label="Explorar el producto"><ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" /></a></div>
          </div>
        </div>
      </div>
    </section>
  )
}
