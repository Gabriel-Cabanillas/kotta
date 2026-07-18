'use client'

/**
 * Seccion de preguntas frecuentes de la landing publica.
 * Contiene respuestas a objeciones comunes sobre usuarios, permanencia, activacion,
 * uso web, datos, guardias, multiples condominios y soporte.
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
    q: '¿Cuántos vecinos, guardias o proveedores puedo registrar?',
    a: 'Todos los que necesites. Los planes no tienen límite de usuarios. Registra a todos tus vecinos, todos tus proveedores y todos tus guardias sin costo adicional.',
  },
  {
    q: '¿Hay contrato de permanencia?',
    a: 'No. La suscripción es mensual y puedes cancelar cuando quieras, sin penalizaciones ni trámites. Si decides salirte, tus datos quedan disponibles por 30 días adicionales para que los exportes.',
  },
  {
    q: '¿Cómo se activa el condominio? ¿Es complicado?',
    a: 'Nada complicado. Nos contactas, registramos tu condominio en el sistema y en menos de 24 horas recibes tu URL personalizada activa. Tú solo necesitas empezar a registrar a tus vecinos — el sistema hace el resto.',
  },
  {
    q: '¿Mis vecinos necesitan descargar una app?',
    a: 'No. KOTTA es 100% web. Tus vecinos entran desde cualquier navegador en su teléfono o computadora — sin descargar nada, sin crear cuentas complicadas. Solo reciben un correo con su acceso y listo.',
  },
  {
    q: '¿Qué pasa con las fotos y los datos si cancelo?',
    a: 'Tus datos son tuyos. Si cancelas, tienes 30 días para exportar todo: historial de tickets, órdenes de trabajo, fotos y registros de pago. Después de ese período, los datos se eliminan de forma segura.',
  },
  {
    q: '¿El guardia necesita saber usar computadoras?',
    a: 'No. El panel del guardia fue diseñado para usarse desde la caseta con acceso mínimo: usuario + PIN de 4 dígitos. La interfaz es la más simple del sistema — busca, valida y registra. Nada más.',
  },
  {
    q: '¿Puedo tener más de un condominio?',
    a: 'Sí. Cada condominio es independiente y el precio depende de su tamaño: Esencial por $3,500 MXN/mes hasta 150 viviendas, Pro por $6,500 MXN/mes hasta 300 viviendas y Enterprise por $12,000 MXN/mes para más de 300 viviendas. Si administras varios cotos, cada uno tiene su URL, sus usuarios y sus datos completamente separados.',
  },
  {
    q: '¿Qué incluye el soporte?',
    a: 'Soporte por WhatsApp y correo desde el día 1, sin costo adicional. En los primeros 7 días te acompañamos en la configuración inicial para que arranques sin fricciones.',
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

      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48' : 'max-h-0'}`}>
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
                Respondemos en menos de 2 horas.
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
                    <p className="text-xs text-text-muted">Respuesta en menos de 2 hrs</p>
                  </div>
                  <svg className="ml-auto text-neutral-200 group-hover:text-black transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </a>

                <a
                  href="mailto:hola@kotta.com.mx"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-white hover:border-black transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-black/[0.06] flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="black" strokeWidth="1.8" fill="none"/>
                      <path d="M2 8l10 6 10-6" stroke="black" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">hola@kotta.com.mx</p>
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