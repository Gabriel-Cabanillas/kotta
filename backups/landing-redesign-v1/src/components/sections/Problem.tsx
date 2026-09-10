import { FileWarning, MessageCircleMore, SearchX } from 'lucide-react'

const PROBLEMS = [
  { icon: MessageCircleMore, title: 'Conversaciones dispersas', text: 'Reportes, avisos y acuerdos se pierden entre mensajes, llamadas y grupos distintos.' },
  { icon: SearchX, title: 'Seguimiento incompleto', text: 'Sin un proceso compartido es difícil saber qué está pendiente, quién lo atiende y qué se resolvió.' },
  { icon: FileWarning, title: 'Información fragmentada', text: 'Pagos, accesos, activos y mantenimiento terminan repartidos entre hojas, archivos y bitácoras.' },
] as const

export default function Problem() {
  return (
    <section className="bg-neutral-50 py-20 md:py-28">
      <div className="container-kotta">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">El reto diario</p><h2 className="mt-4 text-3xl font-medium tracking-tight text-black md:text-5xl">Administrar no debería depender de recordar dónde quedó cada cosa.</h2><p className="mt-5 max-w-lg leading-7 text-neutral-500">Kotta reúne la operación del condominio para que el equipo trabaje con contexto, responsabilidades y evidencia.</p></div>
          <div className="grid gap-4 sm:grid-cols-3 lg:items-end">{PROBLEMS.map(({ icon: Icon, title, text }, index) => <article key={title} className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card"><span className="text-xs font-medium text-neutral-300">0{index + 1}</span><div className="mt-8 flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white"><Icon className="h-4 w-4" /></div><h3 className="mt-5 text-base font-medium text-black">{title}</h3><p className="mt-3 text-sm leading-6 text-neutral-500">{text}</p></article>)}</div>
        </div>
      </div>
    </section>
  )
}
