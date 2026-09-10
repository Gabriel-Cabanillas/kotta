import { ArrowDown } from 'lucide-react'

export default function Definition() {
  return (
    <section className="border-y border-neutral-100 bg-white py-20 md:py-28">
      <div className="container-kotta grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
        <div className="flex items-start gap-3 text-xs font-medium uppercase tracking-[0.14em] text-neutral-400"><span className="mt-1.5 h-px w-8 bg-black" />Qué es Kotta</div>
        <div>
          <h2 className="max-w-4xl text-3xl font-medium leading-[1.12] tracking-[-0.035em] text-black sm:text-4xl md:text-6xl">
            El lugar donde la administración deja de estar repartida y empieza a trabajar como un sistema.
          </h2>
          <div className="mt-10 grid gap-8 border-t border-neutral-200 pt-8 sm:grid-cols-2">
            <p className="text-base leading-7 text-neutral-600">Kotta es software web para administradores de condominios y privadas. Centraliza residentes, pagos, mantenimiento, accesos, amenidades y comunicación.</p>
            <div className="flex items-start justify-between gap-8"><p className="max-w-sm text-base leading-7 text-neutral-600">Existe para convertir tareas aisladas en una operación visible, ordenada y fácil de seguir por cada rol.</p><a href="#producto" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-black transition hover:bg-black hover:text-white" aria-label="Explorar el producto"><ArrowDown className="h-4 w-4" /></a></div>
          </div>
        </div>
      </div>
    </section>
  )
}
