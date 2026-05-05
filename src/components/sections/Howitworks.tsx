'use client'

import { useEffect, useRef } from 'react'

const STEPS = [
  {
    number: '01',
    headline: 'Contratas y tu coto queda activo al instante.',
    body: 'Elige el plan, registra tu condominio y en menos de 24 horas tienes tu URL personalizada lista para operar.',
    detail: 'kotta.com.mx/tu-coto',
    color: '#1E3A5F',
    colorLight: '#E8F0F9',
    mock: (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
        <p className="text-[10px] text-[#6B7A99] mb-3 font-medium uppercase tracking-wider">Registro de condominio</p>
        <div className="space-y-2.5">
          {[
            { label: 'Nombre del coto', value: 'Residencial Los Pinos' },
            { label: 'Correo del admin', value: 'admin@lospinos.mx' },
            { label: 'Plan', value: 'Plan único — $1,500/mes' },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[9px] text-[#6B7A99] mb-1">{f.label}</p>
              <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-lg px-3 py-2">
                <p className="text-[11px] text-[#0F1F34]">{f.value}</p>
              </div>
            </div>
          ))}
          <div className="pt-1">
            <div className="w-full bg-[#1E3A5F] rounded-lg py-2.5 flex items-center justify-center gap-1.5">
              <p className="text-[11px] text-white font-medium">Activar condominio</p>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    headline: 'Registras a tus vecinos, guardias y proveedores.',
    body: 'El sistema envía una invitación por correo a cada usuario. Ellos crean su contraseña y ya tienen acceso a su panel correspondiente.',
    detail: 'Sin configuración técnica. Sin capacitaciones largas.',
    color: '#4FA8E8',
    colorLight: '#E8F4FD',
    mock: (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
        <p className="text-[10px] text-[#6B7A99] mb-3 font-medium uppercase tracking-wider">Usuarios registrados</p>
        <div className="space-y-2">
          {[
            { name: 'María González', role: 'Vecina', house: 'Casa 14', status: 'Activa', color: '#1DB87E', bg: '#E6F9F1' },
            { name: 'Carlos Herrera', role: 'Proveedor', house: 'Plomería', status: 'Activo', color: '#4FA8E8', bg: '#E8F4FD' },
            { name: 'Roberto Díaz',   role: 'Guardia',  house: 'Turno AM', status: 'Activo', color: '#1DB87E', bg: '#E6F9F1' },
            { name: 'Ana Martínez',   role: 'Vecina',   house: 'Casa 22', status: 'Pendiente', color: '#F5A623', bg: '#FEF3E2' },
          ].map((u) => (
            <div key={u.name} className="flex items-center justify-between bg-[#F7F9FC] rounded-lg px-3 py-2 border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#1E3A5F] flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] text-white font-medium">{u.name.split(' ').map(n => n[0]).join('').slice(0,2)}</span>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#0F1F34]">{u.name}</p>
                  <p className="text-[9px] text-[#6B7A99]">{u.role} · {u.house}</p>
                </div>
              </div>
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ color: u.color, background: u.bg }}>
                {u.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: '03',
    headline: 'Operas todo desde un solo panel.',
    body: 'Tickets, órdenes de trabajo, control de acceso, pagos y activos. Cada rol ve exactamente lo que necesita, nada más.',
    detail: 'El flujo completo: reporte → asignación → evidencia → cierre.',
    color: '#1DB87E',
    colorLight: '#E6F9F1',
    mock: (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
        <p className="text-[10px] text-[#6B7A99] mb-3 font-medium uppercase tracking-wider">Flujo de ticket #0082</p>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-3 bottom-3 w-px bg-[#E2E8F0]" />
          <div className="space-y-3">
            {[
              { label: 'Vecino reporta', sub: 'Fuga en cisterna área B', done: true, color: '#1DB87E' },
              { label: 'Admin asigna',   sub: 'Proveedor: Mario López',  done: true, color: '#1DB87E' },
              { label: 'Proveedor llega', sub: 'Acceso validado · 10:32am', done: true, color: '#1DB87E' },
              { label: 'Evidencia subida', sub: 'Foto antes + después',  done: true, color: '#1DB87E' },
              { label: 'Ticket cerrado',  sub: 'Costo: $850 registrado', done: true, color: '#4FA8E8' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-3 pl-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{ background: t.done ? t.color : '#E2E8F0' }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#0F1F34]">{t.label}</p>
                  <p className="text-[9px] text-[#6B7A99]">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 150)
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
      id="como-funciona"
      ref={sectionRef}
      className="py-24 md:py-32"
      style={{ background: '#F7F9FC' }}
    >
      <div className="container-kotta">

        {/* Header */}
        <div className="max-w-2xl mb-16 reveal">
          <div className="badge badge-navy mb-5">
            Cómo funciona
          </div>
          <h2 className="font-display text-[2rem] md:text-[2.6rem] text-[#0F1F34] mb-4">
            Tres pasos y tu coto
            ya <span className="italic">está operando.</span>
          </h2>
          <p className="text-lg text-[#4A5568] leading-relaxed">
            Sin instalaciones, sin configuraciones técnicas, sin capacitar a nadie.
            Si sabes usar WhatsApp, sabes usar KOTTA.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 md:space-y-6">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="reveal grid md:grid-cols-2 gap-8 md:gap-12 items-center p-8 md:p-10 rounded-2xl border border-[#E2E8F0] bg-white"
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              {/* Copy — alterna lado en desktop */}
              <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                {/* Step number */}
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg"
                    style={{ color: step.color, background: step.colorLight }}
                  >
                    {step.number}
                  </span>
                  <div className="h-px flex-1 bg-[#E2E8F0]" />
                </div>

                <h3 className="font-display text-[1.5rem] md:text-[1.75rem] text-[#0F1F34] mb-3 leading-snug">
                  {step.headline}
                </h3>
                <p className="text-base text-[#4A5568] leading-relaxed mb-4">
                  {step.body}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: step.color }}
                >
                  {step.detail}
                </p>
              </div>

              {/* Mock — alterna lado en desktop */}
              <div className={`${i % 2 === 1 ? 'md:order-1' : ''} bg-[#F7F9FC] rounded-xl p-4 border border-[#E2E8F0]`}>
                {step.mock}
              </div>
            </div>
          ))}
        </div>

        {/* CTA de cierre */}
        <div className="reveal mt-14 text-center">
          <p className="text-[#6B7A99] text-sm mb-5">
            ¿Listo para dejar de administrar en WhatsApp?
          </p>
          <a href="#precio" className="btn-primary py-3.5 px-8 text-base inline-flex">
            Contratar ahora — $1,500/mes
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  )
}