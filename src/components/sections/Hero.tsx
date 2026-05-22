'use client'

/**
 * Seccion inicial de impacto para la landing publica.
 * Contiene la promesa principal, el primer CTA comercial y el mock visual del producto.
 * Se relaciona con src/app/page.tsx, Navbar y las secciones posteriores que desarrollan
 * el problema, el proceso y las funcionalidades.
 * Existe dentro de Kotta para comunicar en el primer vistazo que la plataforma
 * centraliza la operacion de condominios y abrir la ruta de conversion.
 */

import { useEffect, useRef } from 'react'

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    // Parallax suave en el mock del dashboard
    const onScroll = () => {
      const y = window.scrollY
      const mockEl = el.querySelector<HTMLElement>('.dashboard-mock')
      if (mockEl) mockEl.style.transform = `translateY(${y * 0.06}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: 'linear-gradient(160deg, #F7F9FC 0%, #EEF4FB 50%, #F7F9FC 100%)' }}
    >
      {/* Fondo decorativo */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'linear-gradient(var(--navy) 1px, transparent 1px), linear-gradient(90deg, var(--navy) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Orbe azul */}
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4FA8E8 0%, transparent 70%)' }}
        />
        {/* Orbe navy */}
        <div
          className="absolute bottom-0 -left-48 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #1E3A5F 0%, transparent 70%)' }}
        />
      </div>

      <div className="container-kotta relative z-10 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Copy */}
          <div className="max-w-xl">
            {/* Badge */}
            <div className="badge badge-navy mb-6 animate-fade-in">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                <circle cx="4" cy="4" r="4" fill="#1DB87E"/>
              </svg>
              Sistema SaaS para condominios
            </div>

            {/* Headline */}
            <h1
              className="font-display text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] text-[#0F1F34] mb-5"
              style={{ animationDelay: '0.1s' }}
            >
              Tu condominio,{' '}
              <span className="italic text-[#1E3A5F]">por fin</span>{' '}
              bajo control.
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[#4A5568] mb-8 leading-relaxed">
              KOTTA reemplaza los grupos de WhatsApp, las hojas de cálculo y los cobros a mano.
              Todo lo que necesitas para administrar tu coto, en un solo lugar.
            </p>

            {/* Puntos de credibilidad rápida */}
            <ul className="flex flex-col gap-2.5 mb-10">
              {[
                'Tickets, órdenes de trabajo y proveedores en un flujo claro',
                'Cada peso gastado, documentado con foto antes y después',
                'Acceso para vecinos, guardias y proveedores incluido',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm md:text-base text-[#4A5568]">
                  <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="#1DB87E" fillOpacity="0.12"/>
                    <path d="M8 12l3 3 5-5" stroke="#1DB87E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#precio" className="btn-primary px-7 py-3.5 text-base">
                Contratar ahora — $1,500/mes
              </a>
              <a href="#como-funciona" className="btn-ghost px-6 py-3.5 text-base">
                Ver cómo funciona
              </a>
            </div>

            {/* Social proof micro */}
            <p className="mt-5 text-xs text-[#6B7A99]">
              Sin permanencia forzada · Activación en menos de 24 hrs
            </p>
          </div>

          {/* Dashboard mock */}
          <div className="relative dashboard-mock">
            {/* Glow detrás del mock */}
            <div
              aria-hidden="true"
              className="absolute inset-8 rounded-3xl opacity-20 blur-3xl"
              style={{ background: 'linear-gradient(135deg, #4FA8E8, #1E3A5F)' }}
            />

            {/* Ventana del dashboard */}
            <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_8px_40px_rgba(30,58,95,0.12)] overflow-hidden">
              {/* Barra de título */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E2E8F0] bg-[#F7F9FC]">
                <div className="w-3 h-3 rounded-full bg-[#E8503A] opacity-80" />
                <div className="w-3 h-3 rounded-full bg-[#F5A623] opacity-80" />
                <div className="w-3 h-3 rounded-full bg-[#1DB87E] opacity-80" />
                <span className="ml-3 text-xs text-[#6B7A99] font-mono">kotta.com.mx/residencial-los-pinos/admin</span>
              </div>

              {/* Contenido del mock */}
              <div className="p-5">
                {/* Header del dashboard */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-[#6B7A99] mb-0.5">Residencial Los Pinos</p>
                    <h3 className="text-base font-medium text-[#0F1F34]">Panel del administrador</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-[#1E3A5F] flex items-center justify-center">
                      <span className="text-[9px] text-white font-medium">JL</span>
                    </div>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Tickets activos', value: '12', color: '#1E3A5F', sub: '3 sin asignar', subColor: '#F5A623' },
                    { label: 'Al corriente',    value: '44', color: '#1DB87E', sub: 'de 48 vecinos',  subColor: '#6B7A99' },
                    { label: 'Activos OK',      value: '23', color: '#4FA8E8', sub: '2 en revisión', subColor: '#6B7A99' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#F7F9FC] rounded-xl p-3 border border-[#E2E8F0]">
                      <p className="text-[10px] text-[#6B7A99] mb-1.5">{stat.label}</p>
                      <p className="text-2xl font-display" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-[10px] mt-1" style={{ color: stat.subColor }}>{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Lista de tickets */}
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-[#6B7A99] uppercase tracking-wider mb-2">Tickets recientes</p>
                  {[
                    { folio: '#0082', desc: 'Fuga en cisterna área B',     status: 'En proceso', color: '#F5A623', bg: '#FEF3E2' },
                    { folio: '#0081', desc: 'Portón principal sin respuesta', status: 'Asignado',  color: '#4FA8E8', bg: '#E8F4FD' },
                    { folio: '#0080', desc: 'Alumbrado calle 3 apagado',   status: 'Nuevo',      color: '#6B7A99', bg: '#F1F5F9' },
                  ].map((ticket) => (
                    <div key={ticket.folio} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F7F9FC] border border-[#E2E8F0]">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono text-[#6B7A99]">{ticket.folio}</span>
                        <span className="text-xs text-[#0F1F34] truncate max-w-[130px]">{ticket.desc}</span>
                      </div>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ color: ticket.color, background: ticket.bg }}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Badge flotante — evidencia */}
            <div className="absolute -bottom-3 -left-4 bg-white rounded-xl border border-[#E2E8F0] shadow-card px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E6F9F1] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 12l2 2 4-4" stroke="#1DB87E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="#1DB87E" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-[#0F1F34]">Trabajo cerrado con evidencia</p>
                <p className="text-[10px] text-[#6B7A99]">Foto antes + después subida</p>
              </div>
            </div>

            {/* Badge flotante — guardia */}
            <div className="absolute -top-3 -right-2 bg-white rounded-xl border border-[#E2E8F0] shadow-card px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E8F4FD] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" stroke="#4FA8E8" strokeWidth="1.5" fill="none"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#4FA8E8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-[#0F1F34]">Proveedor autorizado</p>
                <p className="text-[10px] text-[#1DB87E]">Acceso validado · 10:32 am</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}