'use client'

/**
 * Seccion final de conversion de la landing publica.
 * Contiene el cierre comercial, los botones de contacto y el recordatorio de activacion rapida.
 * Se relaciona con src/app/page.tsx, Pricing, FAQ y los enlaces externos de WhatsApp o demo.
 * Existe dentro de Kotta para concentrar la decision de compra despues de presentar
 * problema, solucion, funcionalidades y precio.
 */

import { useEffect, useRef } from 'react'

export default function CTAFinal() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 120)
            })
          }
        })
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 overflow-hidden relative"
      style={{ background: '#0F1F34' }}
    >
      {/* Fondo decorativo */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10"
          style={{ background: 'radial-gradient(ellipse, #4FA8E8 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(79,168,232,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(79,168,232,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="container-kotta relative z-10 text-center">

        {/* Badge */}
        <div className="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#4FA8E8]/30 bg-[#4FA8E8]/10 text-[#4FA8E8] text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1DB87E]" />
          Activación en menos de 24 horas
        </div>

        {/* Headline */}
        <h2 className="reveal font-display text-[2.2rem] md:text-[3.2rem] text-white mb-5 max-w-3xl mx-auto leading-tight">
          Tu condominio merece
          más que un grupo de{' '}
          <span className="italic text-[#4FA8E8]">WhatsApp.</span>
        </h2>

        {/* Sub */}
        <p className="reveal text-lg text-[#8BA8C4] mb-10 max-w-xl mx-auto leading-relaxed">
          Cada día sin KOTTA es un ticket perdido, un gasto sin documentar
          y una conversación incómoda que pudiste evitar.
        </p>

        {/* CTAs */}
        <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <a
            href="https://wa.me/526699999999?text=Hola,%20quiero%20contratar%20KOTTA%20para%20mi%20condominio"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-sky px-8 py-4 text-base w-full sm:w-auto justify-center"
          >
            Contratar ahora — $1,500/mes
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a
            href="https://wa.me/526699999999?text=Hola,%20tengo%20dudas%20sobre%20KOTTA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-7 py-4 rounded-xl border border-white/20 text-white text-base font-medium hover:bg-white/5 transition-colors w-full sm:w-auto justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21z"
                stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            Hablar con un asesor
          </a>
        </div>

        {/* Trust signals */}
        <div className="reveal flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            'Sin contrato de permanencia',
            'Garantía 30 días',
            'Soporte incluido',
            'Cancela cuando quieras',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#1DB87E" fillOpacity=".2"/>
                <path d="M8 12l3 3 5-5" stroke="#1DB87E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm text-[#8BA8C4]">{item}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}