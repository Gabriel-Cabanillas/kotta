'use client'

import { useEffect, useRef, useState } from 'react'

const ROLES = [
  {
    key: 'admin',
    label: 'Administrador',
    tagline: 'Control total del condominio.',
    description: 'El centro de operaciones. Todo pasa por aquí — desde registrar un vecino hasta cerrar una orden con evidencia fotográfica.',
    color: '#1E3A5F',
    colorLight: '#E8F0F9',
    colorBorder: '#C5D5EE',
    features: [
      { icon: '📋', title: 'Dashboard ejecutivo', desc: 'Tickets activos, morosos, activos en alerta y gastos del mes en una sola vista.' },
      { icon: '🔧', title: 'Órdenes de trabajo', desc: 'Crea, asigna y cierra órdenes con costo real y foto del "Después" como evidencia.' },
      { icon: '👥', title: 'Gestión de usuarios', desc: 'Registra vecinos, proveedores y guardias. El sistema envía la invitación por correo.' },
      { icon: '💰', title: 'Control de pagos', desc: 'Registro de cuotas, historial de pagos y lista de morosos siempre actualizada.' },
      { icon: '🏗️', title: 'Inventario de activos', desc: 'Bombas, portones y áreas comunes con historial de mantenimiento.' },
      { icon: '📁', title: 'Directorio de proveedores', desc: 'Lista con especialidad, calificación y disponibilidad en tiempo real.' },
    ],
    mock: {
      title: 'Panel del administrador',
      url: '/residencial-los-pinos/admin',
      stats: [
        { label: 'Tickets activos', value: '12', sub: '3 sin asignar', subColor: '#F5A623' },
        { label: 'Morosos', value: '4', sub: 'de 48 vecinos', subColor: '#E8503A' },
        { label: 'Activos OK', value: '23', sub: '2 en revisión', subColor: '#6B7A99' },
      ],
    },
  },
  {
    key: 'vecino',
    label: 'Vecino',
    tagline: 'Simple, claro y sin ruido.',
    description: 'El vecino reporta, consulta y reserva. Nada más. Sin menús confusos, sin funciones que no necesita.',
    color: '#4FA8E8',
    colorLight: '#E8F4FD',
    colorBorder: '#9DCFF2',
    features: [
      { icon: '📝', title: 'Crear reporte', desc: 'Llena un formulario sencillo con foto opcional. Folio y fecha se generan solos.' },
      { icon: '🔍', title: 'Seguimiento en tiempo real', desc: 'Ve el estado de su ticket: Nuevo → Asignado → En proceso → Resuelto.' },
      { icon: '💳', title: 'Mis pagos', desc: 'Historial de cuotas pagadas, pendientes y estado de cuenta personal.' },
      { icon: '📸', title: 'Evidencia fotográfica', desc: 'Ve la foto del trabajo terminado. Sabe exactamente qué se hizo y cuándo.' },
      { icon: '🗓️', title: 'Reservar amenidades', desc: 'Salón, alberca, cancha y asadores con calendario de disponibilidad en vivo.' },
      { icon: '🔔', title: 'Notificaciones automáticas', desc: 'Aviso cuando su ticket cambia de estado. Sin tener que preguntar.' },
    ],
    mock: {
      title: 'Panel del vecino',
      url: '/residencial-los-pinos/vecino',
      stats: [
        { label: 'Mis tickets', value: '2', sub: '1 en proceso', subColor: '#F5A623' },
        { label: 'Próximo pago', value: '$850', sub: 'vence 15 feb', subColor: '#E8503A' },
        { label: 'Reservas', value: '1', sub: 'salón confirmado', subColor: '#1DB87E' },
      ],
    },
  },
  {
    key: 'proveedor',
    label: 'Proveedor',
    tagline: 'Diseñado para usarse en campo.',
    description: 'Rápido y directo. El proveedor llega, registra entrada, hace el trabajo y sube la evidencia. Sin complicaciones.',
    color: '#1DB87E',
    colorLight: '#E6F9F1',
    colorBorder: '#9FE1CB',
    features: [
      { icon: '📋', title: 'Mis órdenes asignadas', desc: 'Lista clara con descripción del problema, ubicación y foto del "Antes".' },
      { icon: '📍', title: 'Registro de entrada', desc: 'Marca su llegada al coto. Notifica al guardia y queda visible para el admin.' },
      { icon: '📷', title: 'Subir evidencia', desc: 'Foto del trabajo terminado obligatoria para cerrar la orden. Sin foto, no cierra.' },
      { icon: '⭐', title: 'Historial y calificaciones', desc: 'Registro de trabajos completados y calificaciones recibidas por coto.' },
      { icon: '🏠', title: 'Multi-condominio', desc: 'Si trabaja en varios cotos, ve todas sus órdenes activas en un solo lugar.' },
      { icon: '💬', title: 'Contacto directo', desc: 'Acceso al contacto del admin del coto desde la propia orden de trabajo.' },
    ],
    mock: {
      title: 'Panel del proveedor',
      url: '/residencial-los-pinos/proveedor',
      stats: [
        { label: 'Órdenes hoy', value: '3', sub: '1 completada', subColor: '#1DB87E' },
        { label: 'Calificación', value: '4.8', sub: '24 trabajos', subColor: '#F5A623' },
        { label: 'Cotos activos', value: '2', sub: 'accesos vigentes', subColor: '#6B7A99' },
      ],
    },
  },
  {
    key: 'guardia',
    label: 'Guardia',
    tagline: 'La interfaz más simple del sistema.',
    description: 'El guardia controla accesos desde la caseta. Valida, registra y mantiene la bitácora. Nada más que eso.',
    color: '#6B7A99',
    colorLight: '#F1F5F9',
    colorBorder: '#CBD5E1',
    features: [
      { icon: '✅', title: 'Validar acceso', desc: 'Busca por nombre o folio. El sistema confirma si el proveedor tiene orden activa.' },
      { icon: '📥', title: 'Registrar entrada', desc: 'Nombre del visitante, tipo y hora de entrada automática en la bitácora.' },
      { icon: '📤', title: 'Registrar salida', desc: 'Cierra el registro con hora de salida. Ciclo de acceso completo.' },
      { icon: '👁️', title: 'Accesos activos', desc: 'Ve en tiempo real quién está dentro del condominio en este momento.' },
      { icon: '📒', title: 'Bitácora del día', desc: 'Registro cronológico de todos los movimientos del turno actual.' },
      { icon: '🔑', title: 'Login con PIN', desc: 'Acceso con usuario + PIN de 4 dígitos. Rápido para usar desde la caseta.' },
    ],
    mock: {
      title: 'Panel del guardia',
      url: '/residencial-los-pinos/guardia',
      stats: [
        { label: 'Dentro ahora', value: '2', sub: 'proveedores activos', subColor: '#4FA8E8' },
        { label: 'Entradas hoy', value: '8', sub: 'en este turno', subColor: '#6B7A99' },
        { label: 'Órdenes activas', value: '3', sub: 'para validar', subColor: '#F5A623' },
      ],
    },
  },
]

export default function Features() {
  const [active, setActive] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)
  const role = ROLES[active]

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
      id="caracteristicas"
      ref={sectionRef}
      className="py-24 md:py-32 bg-white"
    >
      <div className="container-kotta">

        {/* Header */}
        <div className="max-w-2xl mb-14 reveal">
          <div className="badge badge-navy mb-5">Características</div>
          <h2 className="font-display text-[2rem] md:text-[2.6rem] text-[#0F1F34] mb-4">
            Cada quien ve
            lo que <span className="italic">necesita.</span>
          </h2>
          <p className="text-lg text-[#4A5568] leading-relaxed">
            Cuatro roles, cuatro paneles. Nadie ve lo que no le corresponde,
            nadie se pierde en funciones que no usa.
          </p>
        </div>

        {/* Tabs de roles */}
        <div className="reveal mb-10">
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r, i) => (
              <button
                key={r.key}
                onClick={() => setActive(i)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border"
                style={
                  active === i
                    ? { background: r.color, color: 'white', borderColor: r.color }
                    : { background: 'transparent', color: '#4A5568', borderColor: '#E2E8F0' }
                }
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: active === i ? 'rgba(255,255,255,0.6)' : r.color }}
                />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido del rol activo */}
        <div className="reveal grid lg:grid-cols-5 gap-8 items-start">

          {/* Features — 3 cols */}
          <div className="lg:col-span-3">
            {/* Rol header */}
            <div
              className="rounded-2xl p-6 mb-6 border"
              style={{ background: role.colorLight, borderColor: role.colorBorder }}
            >
              <p
                className="text-xs font-medium uppercase tracking-wider mb-1"
                style={{ color: role.color }}
              >
                {role.label}
              </p>
              <h3 className="font-display text-xl text-[#0F1F34] mb-2">{role.tagline}</h3>
              <p className="text-sm text-[#4A5568] leading-relaxed">{role.description}</p>
            </div>

            {/* Grid de features */}
            <div className="grid sm:grid-cols-2 gap-3">
              {role.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] hover:border-[#C5D5EE] hover:bg-white transition-all duration-150"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: role.colorLight, border: `1px solid ${role.colorBorder}` }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0F1F34] mb-0.5">{f.title}</p>
                    <p className="text-xs text-[#6B7A99] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock panel — 2 cols */}
          <div className="lg:col-span-2 sticky top-24">
            <div
              className="rounded-2xl border overflow-hidden shadow-sm"
              style={{ borderColor: role.colorBorder }}
            >
              {/* Titlebar */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ background: role.colorLight, borderColor: role.colorBorder }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#E8503A] opacity-70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#F5A623] opacity-70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#1DB87E] opacity-70" />
                <span className="ml-2 text-[10px] font-mono text-[#6B7A99] truncate">
                  kotta.com.mx{role.mock.url}
                </span>
              </div>

              {/* Body */}
              <div className="bg-white p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] text-[#6B7A99] mb-0.5">Residencial Los Pinos</p>
                    <h4 className="text-sm font-medium text-[#0F1F34]">{role.mock.title}</h4>
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: role.color }}
                  >
                    <span className="text-[9px] text-white font-medium">
                      {role.label.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {role.mock.stats.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3 border border-[#E2E8F0]"
                      style={{ background: role.colorLight }}
                    >
                      <p className="text-[9px] text-[#6B7A99] mb-1.5">{s.label}</p>
                      <p
                        className="text-xl font-display"
                        style={{ color: role.color }}
                      >
                        {s.value}
                      </p>
                      <p className="text-[9px] mt-1" style={{ color: s.subColor }}>{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Features preview list */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-[#6B7A99] uppercase tracking-wider mb-2">
                    Módulos disponibles
                  </p>
                  {role.features.slice(0, 4).map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F7F9FC]"
                    >
                      <span className="text-xs">{f.icon}</span>
                      <span className="text-[11px] text-[#0F1F34]">{f.title}</span>
                      <svg className="ml-auto flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="#C5D5EE" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* CTA */}
        <div className="reveal mt-14 flex flex-col sm:flex-row items-center justify-between gap-5 p-7 rounded-2xl bg-[#1E3A5F]">
          <div>
            <p className="text-white font-medium mb-1">Un plan. Todos los roles incluidos.</p>
            <p className="text-[#8BA8C4] text-sm">Sin cargos extra por número de usuarios o roles activos.</p>
          </div>
          <a href="#precio" className="btn-primary btn-sky whitespace-nowrap flex-shrink-0 py-3 px-7">
            Ver qué incluye el plan
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  )
}