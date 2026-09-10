const FRICTIONS = [
  { number: '01', title: 'Un reporte en WhatsApp no es seguimiento.', text: 'Entre mensajes, fotos y llamadas se pierde la respuesta más importante: quién atiende, qué sigue y cuándo quedó resuelto.', echo: '¿Ya atendieron la fuga?' },
  { number: '02', title: 'Una bitácora guarda datos. No construye contexto.', text: 'El historial de portones, bombas y áreas comunes queda aislado de las órdenes, los responsables, los costos y la evidencia.', echo: '¿Cuándo fue el último servicio?' },
  { number: '03', title: 'La información dispersa termina en desconfianza.', text: 'Cuando pagos, accesos y trabajos viven en lugares distintos, incluso una buena administración resulta difícil de explicar.', echo: '¿Dónde puedo revisar qué pasó?' },
] as const

export default function Problem() {
  return (
    <section className="overflow-hidden bg-[#111] py-24 text-white sm:py-28 md:py-36">
      <div className="landing-shell">
        <div className="landing-reveal grid gap-10 border-b border-white/15 pb-14 md:pb-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24"><p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">El problema no es trabajar más</p><h2 className="text-4xl font-medium leading-[1.04] tracking-[-0.045em] sm:text-5xl md:text-7xl">Es operar sin una fuente común de verdad.</h2></div>
        <div>{FRICTIONS.map((item, index) => <article key={item.number} className="landing-reveal group grid gap-6 border-b border-white/15 py-10 md:grid-cols-[0.18fr_0.82fr_0.55fr] md:items-start md:gap-10 md:py-14" style={{ transitionDelay: `${index * 90}ms` }}><span className="font-mono text-xs text-white/30">{item.number}</span><div><h3 className="max-w-2xl text-2xl font-medium leading-tight tracking-tight md:text-4xl">{item.title}</h3><p className="mt-5 max-w-xl text-sm leading-7 text-white/50 md:text-base">{item.text}</p></div><p className="self-end text-left text-lg font-light italic text-white/25 transition-colors duration-500 group-hover:text-white/55 md:text-right md:text-2xl">&ldquo;{item.echo}&rdquo;</p></article>)}</div>
        <p className="landing-reveal ml-auto mt-14 max-w-2xl text-right text-xl leading-8 text-white/70 md:text-3xl md:leading-10" data-reveal="left">Kotta conecta el problema, la persona responsable y la evidencia de lo que ocurrió.</p>
      </div>
    </section>
  )
}
