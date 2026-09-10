const FRICTIONS = [
  { number: '01', title: 'Un reporte en WhatsApp no es seguimiento.', text: 'Entre mensajes, fotos y llamadas se pierde la respuesta más importante: quién atiende, qué sigue y cuándo quedó resuelto.', echo: '¿Ya atendieron la fuga?' },
  { number: '02', title: 'Una bitácora guarda datos. No construye contexto.', text: 'El historial de portones, bombas y áreas comunes queda aislado de las órdenes, los responsables, los costos y la evidencia.', echo: '¿Cuándo fue el último servicio?' },
  { number: '03', title: 'La información dispersa termina en desconfianza.', text: 'Cuando pagos, accesos y trabajos viven en lugares distintos, incluso una buena administración resulta difícil de explicar.', echo: '¿Dónde puedo revisar qué pasó?' },
] as const

export default function Problem() {
  return (
    <section className="overflow-hidden bg-[#111111] py-24 text-white md:py-36">
      <div className="container-kotta">
        <div className="grid gap-10 border-b border-white/15 pb-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24"><p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">El problema no es trabajar más</p><h2 className="text-4xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-5xl md:text-7xl">Es operar sin una fuente común de verdad.</h2></div>
        <div>{FRICTIONS.map((item, index) => <article key={item.number} className="group grid gap-6 border-b border-white/15 py-10 transition-colors md:grid-cols-[0.18fr_0.82fr_0.55fr] md:items-start md:gap-10 md:py-14"><span className="font-mono text-xs text-white/30">{item.number}</span><div><h3 className="max-w-2xl text-2xl font-medium leading-tight tracking-tight md:text-4xl">{item.title}</h3><p className="mt-5 max-w-xl text-sm leading-7 text-white/50 md:text-base">{item.text}</p></div><p className={`self-end text-right text-lg font-light italic text-white/25 transition group-hover:text-white/50 md:text-2xl ${index === 1 ? 'md:-translate-y-4' : ''}`}>&ldquo;{item.echo}&rdquo;</p></article>)}</div>
        <p className="ml-auto mt-14 max-w-2xl text-right text-xl leading-8 text-white/70 md:text-3xl md:leading-10">Kotta conecta el problema, la persona responsable y la evidencia de lo que ocurrió.</p>
      </div>
    </section>
  )
}
