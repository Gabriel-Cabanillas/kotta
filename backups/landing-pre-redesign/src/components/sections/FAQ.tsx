'use client'

/**
 * Seccion de preguntas frecuentes de la landing publica.
 * Contiene respuestas a dudas comerciales sobre precios, contratación, pagos,
 * modalidades, uso web, múltiples condominios y soporte.
 * Se relaciona con src/app/page.tsx, Pricing, CTAFinal y Navbar mediante el ancla FAQ.
 * Existe dentro de Kotta para resolver dudas comerciales antes del cierre de conversion.
 *
 * Paleta: migrado de acentos navy/sky (legacy, ver tailwind.config.ts) a la
 * paleta negro/blanco vigente. Iconografia circular unificada en negro + blanco.
 */

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const FAQS = [
  {
    q: '¿Cómo se calcula el precio de Kotta?',
    a: 'De 1 a 100 viviendas cuesta $3,500 MXN + IVA al mes. De 101 a 300 se suman $15 por cada vivienda adicional a 100. De 301 a 600, el precio parte de $6,500 y se suman $18 por cada vivienda adicional a 300. Para más de 600 viviendas se prepara una cotización Enterprise personalizada. Todas las funcionalidades están incluidas.',
  },
  {
    q: '¿Cuál es la diferencia entre mensual y contrato anual?',
    a: 'La modalidad mensual conserva el precio completo, se paga cada mes, no tiene permanencia y puede cancelarse sin penalización. El contrato anual incluye 10% de descuento y un compromiso de 12 meses. En ambas modalidades el pago es mensual: contratar anualmente no significa pagar 12 meses por adelantado.',
  },
  {
    q: '¿Cómo se contrata Kotta?',
    a: 'La contratación se formaliza directamente con Kotta. El condominio puede registrarse en la plataforma, verificar su cuenta y quedará pendiente de activación mientras se completa la contratación. Después, Kotta configura las condiciones comerciales y habilita el servicio.',
  },
  {
    q: '¿Cómo se paga Kotta?',
    a: 'Los pagos de la suscripción se realizan mediante transferencia bancaria o SPEI a la cuenta indicada por Kotta durante la contratación.',
  },
  {
    q: '¿Cuánto tiempo tengo para pagar?',
    a: 'Tienes 10 días naturales a partir de la fecha de la mensualidad o factura correspondiente.',
  },
  {
    q: '¿Qué pasa si me atraso?',
    a: 'Se aplica una penalización única del 5% sobre el monto vencido del servicio; no se acumula repetidamente sobre la misma mensualidad. Si pasan 15 días naturales después del vencimiento sin regularizar el pago, Kotta puede suspender temporalmente el servicio.',
  },
  {
    q: '¿Puedo cancelar?',
    a: 'Sí. En la modalidad mensual puedes cancelar sin penalización por terminación. En un contrato anual existe un compromiso de 12 meses y una terminación anticipada puede generar una penalización conforme a las condiciones contractuales.',
  },
  {
    q: '¿Las funcionalidades cambian según el precio?',
    a: 'No. Todas las funcionalidades de Kotta están incluidas. El precio cambia por el número de viviendas y la modalidad de contratación, no por módulos bloqueados.',
  },
  {
    q: '¿Mis vecinos necesitan descargar una app?',
    a: 'No. Kotta es una plataforma web y se utiliza desde el navegador de un teléfono o computadora, sin necesidad de descargar una aplicación.',
  },
  {
    q: '¿Puedo administrar más de un condominio?',
    a: 'Sí. Cada condominio se maneja como una organización independiente, con sus propios usuarios y datos separados. El precio de cada uno se calcula individualmente según su número de viviendas y modalidad de contratación.',
  },
  {
    q: '¿Qué soporte ofrece Kotta?',
    a: 'Kotta ofrece soporte para ayudarte con el uso y la configuración de la plataforma.',
  },
]

function FaqItem({ faq }: { faq: typeof FAQS[0] }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        open ? 'border-black bg-white shadow-card' : 'border-neutral-100 bg-white hover:border-black/30'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span
          className={`text-sm md:text-base leading-snug text-black transition-all ${
            open ? 'font-semibold' : 'font-medium'
          }`}
        >
          {faq.q}
        </span>
        <div
          className={`w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-45' : ''
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-80' : 'max-h-0'}`}>
        <p className="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-neutral-100 pt-4">
          {faq.a}
        </p>
      </div>
    </div>
  )
}

export default function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 80)
            })
          }
        })
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="faq" ref={sectionRef} className="py-24 md:py-32 bg-white">
      <div className="container-kotta">

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">

          {/* Header fijo — 2 cols */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-28 reveal">
              <div className="badge badge-dark mb-5">
                <Image
                  src="/mini-kotta.png"
                  alt="Kotta"
                  width={14}
                  height={14}
                  className="rounded-sm object-contain"
                />
                FAQ
              </div>
              <h2 className="font-display text-[2rem] md:text-[2.4rem] text-black mb-4">
                Respuestas
                antes de <span className="italic">que preguntes.</span>
              </h2>
              <p className="text-base text-text-secondary leading-relaxed mb-8">
                Si tienes una duda que no está aquí, escríbenos directamente.
              </p>

              {/* Contacto directo */}
              <div className="space-y-3">
                <a
                  href="https://wa.me/526699999999?text=Hola,%20tengo%20una%20pregunta%20sobre%20KOTTA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-white hover:border-black transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-green/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21z"
                        stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">WhatsApp</p>
                    <p className="text-xs text-text-muted">Consultas sobre Kotta</p>
                  </div>
                  <svg className="ml-auto text-neutral-200 group-hover:text-black transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </a>

                <a
                  href="mailto:hola@kotta.mx"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-white hover:border-black transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-black/[0.06] flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="black" strokeWidth="1.8" fill="none"/>
                      <path d="M2 8l10 6 10-6" stroke="black" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">hola@kotta.mx</p>
                    <p className="text-xs text-text-muted">Para consultas más detalladas</p>
                  </div>
                  <svg className="ml-auto text-neutral-200 group-hover:text-black transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Preguntas — 3 cols */}
          <div className="lg:col-span-3 space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.06}s` }}>
                <FaqItem faq={faq} />
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  )
}
