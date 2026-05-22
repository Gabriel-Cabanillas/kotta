'use client'

/**
 * Seccion de problema de la landing publica.
 * Contiene los dolores operativos y financieros que viven los administradores de condominios.
 * Se relaciona con src/app/page.tsx, Hero y Howitworks como puente entre la promesa
 * inicial y la explicacion de la solucion.
 * Existe dentro de Kotta para hacer visible la necesidad comercial antes de presentar
 * las funcionalidades del producto.
 */

import { useEffect, useRef } from 'react'

const PAINS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
          stroke="#E8503A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M8 10h8M8 14h5" stroke="#E8503A" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    bg: '#FEF0EE',
    border: '#FACAC3',
    headline: 'Todo por WhatsApp, nada resuelto.',
    body: 'Los reportes se pierden en el grupo, nadie sabe si alguien ya lo atendió, y la semana siguiente aparece el mismo problema.',
    quote: '"¿Ya arreglaron la fuga? Nadie me avisó nada."',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#F5A623" strokeWidth="1.8" fill="none"/>
        <path d="M12 8v4l3 3" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M8 6l-2-2M16 6l2-2" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    bg: '#FEF8EC',
    border: '#FADEAA',
    headline: 'Los vecinos preguntan en qué se gastó su cuota.',
    body: 'Tienes los recibos en el correo, los gastos en una hoja de Excel y las fotos en tu celular. Pero no hay forma de mostrar todo junto.',
    quote: '"¿Por qué subió la cuota si no veo ninguna mejora?"',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#6B7A99" strokeWidth="1.8" fill="none"/>
        <path d="M3 9h18" stroke="#6B7A99" strokeWidth="1.8"/>
        <path d="M8 2v4M16 2v4" stroke="#6B7A99" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M7 14h4M7 17h2" stroke="#E8503A" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="16" cy="15.5" r="3" fill="#FEECEA" stroke="#E8503A" strokeWidth="1.5"/>
        <path d="M16 14.5v1.5" stroke="#E8503A" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="16" cy="17" r="0.5" fill="#E8503A"/>
      </svg>
    ),
    bg: '#F7F9FC',
    border: '#E2E8F0',
    headline: 'La morosidad crece y no tienes cómo darle seguimiento.',
    body: 'Sabes más o menos quién debe, pero no tienes un registro formal, no hay historial claro y cobrar se convierte en una conversación incómoda.',
    quote: '"Ya pagué, eso fue el mes pasado." — sin comprobante.',
  },
]

export default function Problem() {
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
      { threshold: 0.15 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="problema"
      ref={sectionRef}
      className="py-24 md:py-32"
      style={{ background: '#FFFFFF' }}
    >
      <div className="container-kotta">

        {/* Header */}
        <div className="max-w-2xl mb-16 reveal">
          <div className="badge badge-navy mb-5">
            El problema
          </div>
          <h2 className="font-display text-[2rem] md:text-[2.6rem] text-[#0F1F34] mb-4">
            Administrar un coto no debería
            ser <span className="italic">tan difícil.</span>
          </h2>
          <p className="text-lg text-[#4A5568] leading-relaxed">
            Pero con las herramientas equivocadas, hasta las tareas simples
            se vuelven un caos diario que nadie quiere heredar.
          </p>
        </div>

        {/* Pain cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {PAINS.map((pain, i) => (
            <div
              key={i}
              className="reveal"
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <div
                className="h-full rounded-2xl p-6 border flex flex-col gap-4"
                style={{ background: pain.bg, borderColor: pain.border }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'white', border: `1px solid ${pain.border}` }}
                >
                  {pain.icon}
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="font-sans font-medium text-[#0F1F34] text-base leading-snug">
                    {pain.headline}
                  </h3>
                  <p className="text-sm text-[#4A5568] leading-relaxed">
                    {pain.body}
                  </p>
                </div>

                {/* Quote */}
                <blockquote
                  className="text-xs text-[#6B7A99] italic border-l-2 pl-3 mt-auto"
                  style={{ borderColor: pain.border }}
                >
                  {pain.quote}
                </blockquote>
              </div>
            </div>
          ))}
        </div>

        {/* Transición hacia la solución */}
        <div className="reveal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-7 rounded-2xl border border-[#C5D5EE] bg-[#EEF4FB]">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="#4FA8E8" stroke="#4FA8E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-[#0F1F34] mb-1">
                No es que los administradores sean desorganizados.
              </p>
              <p className="text-sm text-[#4A5568] leading-relaxed">
                Es que nunca tuvieron una herramienta diseñada para este trabajo.
                Un grupo de WhatsApp no es un sistema de gestión.
              </p>
            </div>
          </div>
          <a
            href="#como-funciona"
            className="btn-primary whitespace-nowrap flex-shrink-0 py-3 px-6"
          >
            Ver la solución
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  )
}