import { ArrowRight, CheckCircle2 } from 'lucide-react'

const CONTACT_URL = 'https://wa.me/526699999999?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Kotta'

export default function CTAFinal() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container-kotta">
        <div className="relative overflow-hidden rounded-[2rem] bg-black px-6 py-14 text-center text-white sm:px-10 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_42%)]" />
          <div className="relative mx-auto max-w-3xl"><p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">Hablemos de tu comunidad</p><h2 className="mt-5 text-3xl font-medium tracking-tight md:text-5xl">Más orden para administrar. Más claridad para todos.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 md:text-base">Cuéntanos cuántas viviendas administras y conoce cómo Kotta puede acompañar la operación de tu condominio.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-100">Solicitar información <ArrowRight className="h-4 w-4" /></a><a href="#precio" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-white/5">Calcular precio</a></div><div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/45">{['Contratación directa', 'Pagos mensuales', 'Soporte y actualizaciones incluidos'].map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-white/70" />{item}</span>)}</div></div>
        </div>
      </div>
    </section>
  )
}
