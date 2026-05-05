'use client'

import { useEffect, useRef, useState } from 'react'

const FAQS = [
  {
    q: '¿Cuántos vecinos, guardias o proveedores puedo registrar?',
    a: 'Todos los que necesites. El plan no tiene límite de usuarios. Registra a todos tus vecinos, todos tus proveedores y todos tus guardias sin costo adicional.',
  },
  {
    q: '¿Hay contrato de permanencia?',
    a: 'No. El plan es mensual y puedes cancelar cuando quieras, sin penalizaciones ni trámites. Si decides salirte, tus datos quedan disponibles por 30 días adicionales para que los exportes.',
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
    a: 'Sí. Cada condominio es independiente y tiene su propio plan de $1,500/mes. Si administras varios cotos, cada uno tiene su URL, sus usuarios y sus datos completamente separados.',
  },
  {
    q: '¿Qué incluye el soporte?',
    a: 'Soporte por WhatsApp y correo desde el día 1, sin costo adicional. En los primeros 7 días te acompañamos en la configuración inicial para que arranques sin fricciones.',
  },
]

function FaqItem({ faq, index }: { faq: typeof FAQS[0]; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        open ? 'border-[#C5D5EE] bg-[#EEF4FB]' : 'border-[#E2E8F0] bg-white hover:border-[#C5D5EE]'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className={`text-sm md:text-base font-medium leading-snug transition-colors ${open ? 'text-[#1E3A5F]' : 'text-[#0F1F34]'}`}>
          {faq.q}
        </span>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            open ? 'bg-[#1E3A5F] rotate-45' : 'bg-[#F1F5F9]'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke={open ? 'white' : '#6B7A99'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48' : 'max-h-0'}`}
      >
        <p className="px-6 pb-5 text-sm text-[#4A5568] leading-relaxed border-t border-[#C5D5EE] pt-4">
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
    <section
      id="faq"
      ref={sectionRef}
      className="py-24 md:py-32"
      style={{ background: '#F7F9FC' }}
    >
      <div className="container-kotta">

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">

          {/* Header fijo — 2 cols */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-28 reveal">
              <div className="badge badge-navy mb-5">FAQ</div>
              <h2 className="font-display text-[2rem] md:text-[2.4rem] text-[#0F1F34] mb-4">
                Respuestas
                antes de <span className="italic">que preguntes.</span>
              </h2>
              <p className="text-base text-[#4A5568] leading-relaxed mb-8">
                Si tienes una duda que no está aquí, escríbenos directamente.
                Respondemos en menos de 2 horas.
              </p>

              {/* Contacto directo */}
              <div className="space-y-3">
                <a
                  href="https://wa.me/526699999999?text=Hola,%20tengo%20una%20pregunta%20sobre%20KOTTA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#C5D5EE] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#E6F9F1] flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21z"
                        stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0F1F34]">WhatsApp</p>
                    <p className="text-xs text-[#6B7A99]">Respuesta en menos de 2 hrs</p>
                  </div>
                  <svg className="ml-auto text-[#C5D5EE] group-hover:text-[#1E3A5F] transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </a>

                <a
                  href="mailto:hola@kotta.com.mx"
                  className="flex items-center gap-3 p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#C5D5EE] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#E8F4FD] flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="#4FA8E8" strokeWidth="1.8" fill="none"/>
                      <path d="M2 8l10 6 10-6" stroke="#4FA8E8" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0F1F34]">hola@kotta.com.mx</p>
                    <p className="text-xs text-[#6B7A99]">Para consultas más detalladas</p>
                  </div>
                  <svg className="ml-auto text-[#C5D5EE] group-hover:text-[#1E3A5F] transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none">
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
                <FaqItem faq={faq} index={i} />
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  )
}