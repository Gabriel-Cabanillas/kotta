'use client'

/**
 * Seccion de precio de la landing publica.
 * Contiene el plan unico, lo incluido en la suscripcion y enlaces hacia preguntas frecuentes.
 * Se relaciona con src/app/page.tsx, Navbar, FAQ y CTAFinal mediante el ancla de precio
 * y la ruta comercial de contratacion.
 * Existe dentro de Kotta para convertir la propuesta de valor en una oferta clara,
 * sin niveles ni modulos adicionales.
 */

import { useEffect, useRef } from 'react'

const INCLUDES = [
  { icon: '👥', text: 'Usuarios ilimitados — vecinos, guardias y proveedores' },
  { icon: '🎫', text: 'Tickets y órdenes de trabajo sin límite' },
  { icon: '📸', text: 'Almacenamiento de fotos Antes/Después en la nube' },
  { icon: '🏗️', text: 'Inventario de activos del condominio' },
  { icon: '💰', text: 'Control de pagos y registro de morosos' },
  { icon: '🔐', text: 'Control de acceso y bitácora del guardia' },
  { icon: '🗓️', text: 'Reserva de amenidades para vecinos' },
  { icon: '📁', text: 'Directorio de proveedores con calificaciones' },
  { icon: '🔔', text: 'Notificaciones automáticas para todos los roles' },
  { icon: '📊', text: 'Panel Super Admin para el equipo KOTTA' },
  { icon: '🌐', text: 'URL personalizada kotta.com.mx/tu-coto' },
  { icon: '⚡', text: 'Activación en menos de 24 horas' },
]

const FAQS_PREVIEW = [
  '¿Cuántos vecinos puedo registrar?',
  '¿Hay contrato de permanencia?',
  '¿Cómo se activa el condominio?',
]

const PLANS = [
  {
    name: 'Esencial',
    price: '$3,500',
    capacity: 'Hasta 150 viviendas',
    supportText: 'Aprox. $23 pesos por casa',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$6,500',
    capacity: 'Hasta 300 viviendas',
    supportText: 'Aprox. $21 pesos por casa',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$12,000',
    capacity: '+300 viviendas',
    supportText: 'Sin límite',
    highlighted: false,
  },
]

export default function Pricing() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 100)
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
      id="precio"
      ref={sectionRef}
      className="py-24 md:py-32 bg-white"
    >
      <div className="container-kotta">

        {/* Header */}
        <div className="max-w-2xl mb-16 reveal">
          <div className="badge badge-navy mb-5">Precio</div>
          <h2 className="font-display text-[2rem] md:text-[2.6rem] text-[#0F1F34] mb-4">
            Tres planes.
            <span className="italic"> Todo incluido.</span>
          </h2>
          <p className="text-lg text-[#4A5568] leading-relaxed">
            Elige la capacidad que necesita tu condominio, sin módulos adicionales
            ni sorpresas al final del mes.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* Pricing cards */}
          <div className="lg:col-span-5 grid lg:grid-cols-3 gap-6 reveal">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 overflow-hidden ${
                  plan.highlighted
                    ? 'border-[#1E3A5F] shadow-[0_8px_40px_rgba(30,58,95,0.12)]'
                    : 'border-[#E2E8F0] shadow-[0_8px_30px_rgba(15,31,52,0.06)]'
                }`}
              >

              {/* Card header */}
              <div className={`${plan.highlighted ? 'bg-[#1E3A5F]' : 'bg-[#F7F9FC]'} px-8 py-8`}>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className={`text-sm mb-1 ${plan.highlighted ? 'text-[#8BA8C4]' : 'text-[#6B7A99]'}`}>Plan</p>
                    <h3 className={`font-display text-2xl ${plan.highlighted ? 'text-white' : 'text-[#0F1F34]'}`}>{plan.name}</h3>
                  </div>
                  {plan.highlighted && (
                    <span className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#4FA8E8] text-white flex-shrink-0">
                      Recomendado
                    </span>
                  )}
                </div>

                {/* Precio */}
                <div className="flex items-end gap-2 mb-2">
                  <span className={`font-display text-5xl leading-none ${plan.highlighted ? 'text-white' : 'text-[#0F1F34]'}`}>{plan.price}</span>
                  <div className="mb-2">
                    <span className={`text-base ${plan.highlighted ? 'text-[#8BA8C4]' : 'text-[#6B7A99]'}`}>MXN</span>
                    <p className={`text-sm ${plan.highlighted ? 'text-[#8BA8C4]' : 'text-[#6B7A99]'}`}>/mes por condominio</p>
                  </div>
                </div>
                <p className={`text-sm font-medium ${plan.highlighted ? 'text-white' : 'text-[#1E3A5F]'}`}>
                  {plan.capacity}
                </p>
                <p className={`text-sm ${plan.highlighted ? 'text-[#8BA8C4]' : 'text-[#6B7A99]'}`}>
                  {plan.supportText}
                </p>
              </div>

              {/* Includes list */}
              <div className="bg-white px-8 py-7">
                <p className="text-xs font-medium text-[#6B7A99] uppercase tracking-wider mb-5">
                  Qué incluye
                </p>
                <div className="space-y-3 mb-8">
                  {INCLUDES.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#1DB87E" fillOpacity=".12"/>
                        <path d="M8 12l3 3 5-5" stroke="#1DB87E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm text-[#4A5568] leading-snug">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA principal */}
                <a
                  href="https://wa.me/526699999999?text=Hola,%20quiero%20contratar%20KOTTA%20para%20mi%20condominio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center py-4 text-base mb-3"
                >
                  Contratar ahora
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>

                {/* CTA secundario — WhatsApp */}
                <a
                  href="https://wa.me/526699999999?text=Hola,%20tengo%20dudas%20sobre%20KOTTA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost w-full justify-center py-3.5 text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21z" stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M9 10c0 5 6 5 6 0" stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                  </svg>
                  Hablar con un asesor por WhatsApp
                </a>

                <p className="text-center text-xs text-[#6B7A99] mt-4">
                  Activación en menos de 24 hrs · Sin contrato forzado
                </p>
              </div>
              </div>
            ))}
          </div>

          {/* Bloques de apoyo */}
          <div className="lg:col-span-5 grid lg:grid-cols-3 gap-5">

            {/* Comparación rápida */}
            <div className="reveal rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC] p-6">
              <p className="text-xs font-medium text-[#6B7A99] uppercase tracking-wider mb-4">
                ¿Por qué contratar KOTTA?
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Grupo de WhatsApp', cost: 'Gratis', pain: 'Caos total, nada documentado', bad: true },
                  { label: 'Hoja de Excel', cost: '$0', pain: 'Solo tú la entiendes', bad: true },
                  { label: 'Solución a medida', cost: '$80,000+', pain: 'Meses de desarrollo', bad: true },
                  { label: 'KOTTA', cost: 'Desde $3,500/mes', pain: 'Operando en 24 hrs', bad: false },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      !row.bad
                        ? 'border-[#1E3A5F] bg-[#E8F0F9]'
                        : 'border-[#E2E8F0] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {row.bad ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="#E8503A" fillOpacity=".1"/>
                          <path d="M15 9l-6 6M9 9l6 6" stroke="#E8503A" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="#1DB87E" fillOpacity=".15"/>
                          <path d="M8 12l3 3 5-5" stroke="#1DB87E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <div>
                        <p className={`text-xs font-medium ${!row.bad ? 'text-[#1E3A5F]' : 'text-[#0F1F34]'}`}>
                          {row.label}
                        </p>
                        <p className="text-[10px] text-[#6B7A99]">{row.pain}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${!row.bad ? 'text-[#1E3A5F]' : 'text-[#6B7A99]'}`}>
                      {row.cost}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Garantía / confianza */}
            <div className="reveal rounded-2xl border border-[#E2E8F0] bg-white p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#E6F9F1] flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                      stroke="#1DB87E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M9 12l2 2 4-4" stroke="#1DB87E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F1F34] mb-1">Sin riesgo.</p>
                  <p className="text-sm text-[#4A5568] leading-relaxed">
                    Si en los primeros 30 días KOTTA no funciona para tu condominio,
                    te devolvemos el pago sin preguntas.
                  </p>
                </div>
              </div>
              <div className="space-y-2 pt-3 border-t border-[#E2E8F0]">
                {[
                  'Sin contrato de permanencia',
                  'Cancela en cualquier momento',
                  'Soporte incluido desde el día 1',
                  'Activación en menos de 24 horas',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1DB87E] flex-shrink-0" />
                    <p className="text-xs text-[#4A5568]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ preview */}
            <div className="reveal rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC] p-6">
              <p className="text-xs font-medium text-[#6B7A99] uppercase tracking-wider mb-4">
                Preguntas frecuentes
              </p>
              <div className="space-y-2">
                {FAQS_PREVIEW.map((q) => (
                  <a
                    key={q}
                    href="#faq"
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#C5D5EE] transition-colors group"
                  >
                    <span className="text-sm text-[#4A5568] group-hover:text-[#1E3A5F] transition-colors">
                      {q}
                    </span>
                    <svg className="flex-shrink-0 ml-2" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="#C5D5EE" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </a>
                ))}
              </div>
              <a href="#faq" className="block text-center text-xs text-[#4FA8E8] mt-3 hover:underline">
                Ver todas las preguntas →
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
