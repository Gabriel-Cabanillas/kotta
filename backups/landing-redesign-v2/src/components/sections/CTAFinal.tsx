import { ArrowUpRight } from 'lucide-react'

const CONTACT_URL = 'https://wa.me/526699999999?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Kotta'

export default function CTAFinal() {
  return (
    <section className="relative overflow-hidden bg-black py-28 text-white md:py-44">
      <div className="pointer-events-none absolute -right-[8vw] top-1/2 -translate-y-1/2 select-none text-[32vw] font-medium leading-none tracking-[-0.08em] text-white/[0.035]" aria-hidden="true">K</div>
      <div className="container-kotta relative">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">El siguiente paso</p>
        <div className="mt-7 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"><h2 className="max-w-4xl text-5xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-6xl md:text-8xl">Hablemos de cómo opera tu condominio.</h2><div><p className="max-w-md text-base leading-7 text-white/50">Cuéntanos cuántas viviendas administras. Te ayudaremos a revisar la modalidad y el proceso de contratación adecuados.</p><a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="group mt-8 inline-flex items-center gap-4 border-b border-white pb-2 text-lg font-medium text-white"><span>Hablar con Kotta</span><ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a></div></div>
      </div>
    </section>
  )
}
