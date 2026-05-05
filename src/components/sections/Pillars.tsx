'use client'

import { useEffect, useRef } from 'react'

const PILLARS = [
  {
    number: '01',
    title: 'Transparencia financiera.',
    subtitle: 'Cada peso, documentado.',
    body: 'Cada gasto tiene una foto antes y una foto después. Los vecinos pueden ver exactamente en qué se usó su cuota. Sin dudas, sin conversaciones incómodas, sin "yo no aprobé eso".',
    proof: 'Foto del "Antes" + foto del "Después" obligatorias para cerrar cualquier orden de trabajo.',
    color: '#1E3A5F',
    colorLight: '#E8F0F9',
    colorBorder: '#C5D5EE',
    visual: (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F7F9FC] flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#6B7A99] mb-0.5">Orden #0082 — Cerrada</p>
            <p className="text-xs font-medium text-[#0F1F34]">Reparación cisterna área B</p>
          </div>
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#E6F9F1] text-[#0D7A4E]">
            Completada
          </span>
        </div>
        {/* Fotos */}
        <div className="grid grid-cols-2 gap-3 p-4">
          <div>
            <p className="text-[9px] font-medium text-[#6B7A99] uppercase tracking-wider mb-2">Antes</p>
            <div className="aspect-square rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center justify-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#CBD5E1" strokeWidth="1.5" fill="none"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="#CBD5E1"/>
                <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[9px] text-[#CBD5E1]">Foto del vecino</p>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-medium text-[#1DB87E] uppercase tracking-wider mb-2">Después</p>
            <div className="aspect-square rounded-xl bg-[#E6F9F1] border border-[#9FE1CB] flex flex-col items-center justify-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#1DB87E" strokeWidth="1.5" fill="none"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="#1DB87E"/>
                <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#1DB87E" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[9px] text-[#1DB87E]">Foto del proveedor</p>
            </div>
          </div>
        </div>
        {/* Costo */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between bg-[#F7F9FC] rounded-xl px-4 py-3 border border-[#E2E8F0]">
            <div>
              <p className="text-[9px] text-[#6B7A99]">Costo registrado</p>
              <p className="text-base font-display text-[#1E3A5F]">$1,200</p>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#1DB87E" fillOpacity=".15"/>
                <path d="M8 12l3 3 5-5" stroke="#1DB87E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-[10px] text-[#1DB87E] font-medium">Evidencia verificada</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    title: 'Gestión formal de activos.',
    subtitle: 'Nada se pierde, nada se olvida.',
    body: 'Bombas, portones, áreas comunes — cada activo tiene su historial de mantenimiento. Sabes cuándo fue el último servicio, quién lo hizo y cuánto costó. Sin depender de la memoria de nadie.',
    proof: 'Inventario completo con historial, alertas de mantenimiento preventivo y asignación de responsables.',
    color: '#4FA8E8',
    colorLight: '#E8F4FD',
    colorBorder: '#9DCFF2',
    visual: (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F7F9FC]">
          <p className="text-[10px] text-[#6B7A99] mb-0.5">Inventario de activos</p>
          <p className="text-xs font-medium text-[#0F1F34]">Residencial Los Pinos</p>
        </div>
        <div className="p-4 space-y-2.5">
          {[
            { name: 'Bomba principal', area: 'Cisterna norte', last: 'Hace 12 días', status: 'OK', color: '#1DB87E', bg: '#E6F9F1' },
            { name: 'Portón entrada', area: 'Acceso principal', last: 'Hace 45 días', status: 'Revisar', color: '#F5A623', bg: '#FEF3E2' },
            { name: 'Bomba secundaria', area: 'Cisterna sur', last: 'Hace 8 días', status: 'OK', color: '#1DB87E', bg: '#E6F9F1' },
            { name: 'Iluminación ext.', area: 'Calles 1–4', last: 'Hace 90 días', status: 'Urgente', color: '#E8503A', bg: '#FEECEA' },
          ].map((a) => (
            <div key={a.name} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8F4FD] border border-[#C5D5EE] flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="3" width="20" height="14" rx="2" stroke="#4FA8E8" strokeWidth="1.5" fill="none"/>
                    <path d="M8 21h8M12 17v4" stroke="#4FA8E8" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#0F1F34]">{a.name}</p>
                  <p className="text-[9px] text-[#6B7A99]">{a.area} · {a.last}</p>
                </div>
              </div>
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ color: a.color, background: a.bg }}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: '03',
    title: 'Flujo de trabajo ordenado.',
    subtitle: 'Del reporte al cierre, sin perder nada.',
    body: 'Cada problema sigue un camino claro: el vecino reporta, el admin asigna, el proveedor llega y sube evidencia, el guardia valida el acceso. Todo trazado, todo visible.',
    proof: 'Notificaciones automáticas en cada cambio de estado. Nadie tiene que preguntar "¿ya lo resolvieron?".',
    color: '#1DB87E',
    colorLight: '#E6F9F1',
    colorBorder: '#9FE1CB',
    visual: (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F7F9FC]">
          <p className="text-[10px] text-[#6B7A99] mb-0.5">Flujo completo — Ticket #0082</p>
          <p className="text-xs font-medium text-[#0F1F34]">Fuga en cisterna área B</p>
        </div>
        <div className="p-5">
          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-[#E2E8F0]" />
            <div className="space-y-4">
              {[
                { role: 'Vecino', action: 'Reporte creado', time: '08:14 am', done: true },
                { role: 'Admin', action: 'Orden asignada a Mario L.', time: '08:32 am', done: true },
                { role: 'Guardia', action: 'Acceso validado', time: '10:12 am', done: true },
                { role: 'Proveedor', action: 'Trabajo iniciado', time: '10:15 am', done: true },
                { role: 'Proveedor', action: 'Evidencia subida', time: '11:40 am', done: true },
                { role: 'Admin', action: 'Ticket cerrado · $1,200', time: '11:42 am', done: true },
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3 pl-1 relative z-10">
                  <div className="w-7 h-7 rounded-full bg-[#1DB87E] flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-medium text-[#0F1F34]">{t.action}</p>
                      <p className="text-[9px] text-[#6B7A99]">{t.role}</p>
                    </div>
                    <span className="text-[9px] text-[#6B7A99] font-mono flex-shrink-0">{t.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export default function Pillars() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 130)
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
      id="pilares"
      ref={sectionRef}
      className="py-24 md:py-32"
      style={{ background: '#F7F9FC' }}
    >
      <div className="container-kotta">

        {/* Header */}
        <div className="max-w-2xl mb-16 reveal">
          <div className="badge badge-navy mb-5">Los 3 pilares</div>
          <h2 className="font-display text-[2rem] md:text-[2.6rem] text-[#0F1F34] mb-4">
            Diseñado desde
            adentro, <span className="italic">no desde afuera.</span>
          </h2>
          <p className="text-lg text-[#4A5568] leading-relaxed">
            KOTTA no es una app de avisos adaptada para condominios.
            Fue construido específicamente para los tres problemas
            que todo administrador enfrenta.
          </p>
        </div>

        {/* Pilares */}
        <div className="space-y-6">
          {PILLARS.map((pillar, i) => (
            <div
              key={i}
              className="reveal grid md:grid-cols-2 gap-8 md:gap-12 items-center p-8 md:p-10 rounded-2xl bg-white border border-[#E2E8F0]"
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              {/* Copy */}
              <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                {/* Number */}
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg"
                    style={{ color: pillar.color, background: pillar.colorLight }}
                  >
                    {pillar.number}
                  </span>
                  <div className="h-px flex-1 bg-[#E2E8F0]" />
                </div>

                {/* Text */}
                <h3 className="font-display text-[1.6rem] md:text-[1.9rem] text-[#0F1F34] mb-1 leading-tight">
                  {pillar.title}
                </h3>
                <p
                  className="font-display text-lg italic mb-4"
                  style={{ color: pillar.color }}
                >
                  {pillar.subtitle}
                </p>
                <p className="text-base text-[#4A5568] leading-relaxed mb-6">
                  {pillar.body}
                </p>

                {/* Proof pill */}
                <div
                  className="flex items-start gap-3 p-4 rounded-xl border"
                  style={{ background: pillar.colorLight, borderColor: pillar.colorBorder }}
                >
                  <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill={pillar.color} fillOpacity=".15"/>
                    <path d="M8 12l3 3 5-5" stroke={pillar.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-sm text-[#4A5568] leading-relaxed">{pillar.proof}</p>
                </div>
              </div>

              {/* Visual */}
              <div className={`${i % 2 === 1 ? 'md:order-1' : ''} bg-[#F7F9FC] rounded-xl p-4 border border-[#E2E8F0]`}>
                {pillar.visual}
              </div>
            </div>
          ))}
        </div>

        {/* CTA puente hacia precio */}
        <div className="reveal mt-14 text-center">
          <p className="text-[#6B7A99] text-sm mb-2">
            Todo esto incluido en un solo plan.
          </p>
          <p className="text-[#0F1F34] font-medium text-lg mb-6">
            Sin módulos extra. Sin sorpresas.
          </p>
          <a href="#precio" className="btn-primary py-3.5 px-8 text-base inline-flex">
            Ver el precio
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  )
}