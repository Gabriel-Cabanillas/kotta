'use client'

import { useState } from 'react'
import { CalendarDays, ChevronRight, CreditCard, DoorOpen, LayoutDashboard, Search, TicketCheck, Users, Wrench, type LucideIcon } from 'lucide-react'

type ModuleId = 'operacion' | 'pagos' | 'tickets' | 'accesos' | 'amenidades' | 'usuarios'
type Module = { id: ModuleId; label: string; icon: LucideIcon; title: string; description: string; action: string }
type ProductRow = { title: string; detail: string; meta: string; status: string; tone: 'neutral' | 'warning' | 'success' | 'danger' }

const MODULES: Module[] = [
  { id: 'operacion', label: 'Dashboard', icon: LayoutDashboard, title: 'La operación completa, a primera vista.', description: 'Pendientes, actividad y puntos de atención para decidir dónde actuar.', action: 'Ver actividad' },
  { id: 'tickets', label: 'Tickets y órdenes', icon: TicketCheck, title: 'Cada reporte conserva su contexto.', description: 'Reporte, asignación, responsable, evidencia y cierre en un mismo flujo.', action: 'Nuevo ticket' },
  { id: 'pagos', label: 'Pagos', icon: CreditCard, title: 'Cuotas y movimientos, sin perder el detalle.', description: 'El estado administrativo del condominio reunido en una vista clara.', action: 'Ver movimientos' },
  { id: 'accesos', label: 'Accesos', icon: DoorOpen, title: 'La caseta sabe quién llega y por qué.', description: 'Invitaciones, visitantes y proveedores vinculados con su autorización.', action: 'Nuevo acceso' },
  { id: 'amenidades', label: 'Amenidades', icon: CalendarDays, title: 'Reservas ordenadas por espacio y horario.', description: 'Disponibilidad, solicitudes y reglas visibles para toda la comunidad.', action: 'Nueva reserva' },
  { id: 'usuarios', label: 'Usuarios', icon: Users, title: 'Cada persona en el rol correcto.', description: 'Residentes, proveedores y guardias organizados dentro del condominio.', action: 'Agregar usuario' },
]

const ROWS: Record<ModuleId, ProductRow[]> = {
  operacion: [
    { title: 'Fuga en cisterna norte', detail: 'Orden #0089 · Servicios hidráulicos', meta: 'Hoy, 10:32', status: 'En proceso', tone: 'warning' },
    { title: 'Reserva de terraza', detail: 'Casa 18 · 18:00–22:00', meta: 'Sábado', status: 'Confirmada', tone: 'success' },
    { title: 'Acceso de proveedor', detail: 'Mantenimiento de portón', meta: 'Hoy, 09:18', status: 'Validado', tone: 'success' },
    { title: 'Luminaria en acceso', detail: 'Ticket #0091 · Sin asignar', meta: 'Ayer', status: 'Nuevo', tone: 'neutral' },
  ],
  tickets: [
    { title: 'Luminaria en acceso', detail: 'Reportó Casa 06', meta: '#0091', status: 'Nuevo', tone: 'neutral' },
    { title: 'Fuga en cisterna norte', detail: 'Asignada a Servicios hidráulicos', meta: '#0089', status: 'En proceso', tone: 'warning' },
    { title: 'Portón secundario', detail: 'Evidencia y costo registrados', meta: '#0087', status: 'Cerrado', tone: 'success' },
    { title: 'Poda de área común', detail: 'Proveedor por asignar', meta: '#0086', status: 'En revisión', tone: 'neutral' },
  ],
  pagos: [
    { title: 'Cuota de mantenimiento', detail: 'Casa 24 · Agosto', meta: '$2,500', status: 'Pagado', tone: 'success' },
    { title: 'Cuota de mantenimiento', detail: 'Casa 08 · Agosto', meta: '$2,500', status: 'Vencido', tone: 'danger' },
    { title: 'Reparación extraordinaria', detail: 'Casa 31', meta: '$850', status: 'Pagado', tone: 'success' },
    { title: 'Cuota de mantenimiento', detail: 'Casa 16 · Agosto', meta: '$2,500', status: 'Pendiente', tone: 'warning' },
  ],
  accesos: [
    { title: 'María López', detail: 'Visita · Casa 14', meta: '10:42', status: 'Dentro', tone: 'warning' },
    { title: 'Servicios hidráulicos', detail: 'Proveedor · Orden #0089', meta: '09:18', status: 'Validado', tone: 'success' },
    { title: 'Carlos Ruiz', detail: 'Visita · Casa 03', meta: '08:56', status: 'Salida', tone: 'neutral' },
    { title: 'Paquetería', detail: 'Entrega · Casa 27', meta: '08:40', status: 'Salida', tone: 'neutral' },
  ],
  amenidades: [
    { title: 'Terraza principal', detail: 'Casa 18 · Laura M.', meta: 'Sáb 22', status: 'Confirmada', tone: 'success' },
    { title: 'Cancha', detail: 'Casa 07 · Roberto S.', meta: 'Dom 23', status: 'Confirmada', tone: 'success' },
    { title: 'Salón común', detail: 'Casa 32 · Elena V.', meta: 'Vie 28', status: 'Pendiente', tone: 'warning' },
    { title: 'Terraza principal', detail: 'Casa 11 · Daniel A.', meta: 'Sáb 29', status: 'Pendiente', tone: 'warning' },
  ],
  usuarios: [
    { title: 'Laura Martínez', detail: 'laura@lospinos.mx', meta: 'ADMIN', status: 'Activa', tone: 'success' },
    { title: 'Mario López', detail: 'Proveedor · Plomería', meta: 'PROVEEDOR', status: 'Activo', tone: 'success' },
    { title: 'Roberto Díaz', detail: 'Caseta principal', meta: 'GUARDIA', status: 'Activo', tone: 'success' },
    { title: 'Ana Martínez', detail: 'Casa 22', meta: 'VECINO', status: 'Pendiente', tone: 'warning' },
  ],
}

const STATUS_STYLE = {
  neutral: 'bg-neutral-100 text-neutral-500',
  warning: 'bg-yellow/10 text-[#9A6A00]',
  success: 'bg-green/10 text-[#16852B]',
  danger: 'bg-red/10 text-[#C43F37]',
} as const

export default function Characteristics() {
  const [activeId, setActiveId] = useState<ModuleId>('operacion')
  const active = MODULES.find((module) => module.id === activeId) ?? MODULES[0]
  const activeRows = ROWS[activeId]

  return (
    <section id="producto" className="overflow-hidden bg-white py-24 sm:py-28 md:py-36">
      <div className="landing-shell">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.68fr] lg:items-end">
          <div className="landing-reveal"><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Dentro de Kotta</p><h2 className="mt-4 max-w-4xl text-4xl font-medium leading-[1.04] tracking-[-0.045em] text-black sm:text-5xl md:text-7xl">Un producto para operar, no solo para consultar.</h2></div>
          <p className="landing-reveal max-w-lg text-base leading-7 text-neutral-500 lg:pb-2" style={{ transitionDelay: '100ms' }}>Cada módulo comparte el contexto del condominio. Lo que se reporta, se decide y se resuelve forma parte de la misma operación.</p>
        </div>
      </div>

      <div className="mt-14 border-y border-neutral-200 bg-[#F3F3F1] py-8 sm:mt-16 md:mt-20 md:py-14">
        <div className="landing-shell">
          <div className="landing-reveal overflow-x-auto pb-2" role="tablist" aria-label="Módulos de Kotta">
            <div className="flex min-w-max gap-1">{MODULES.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeId === id} onClick={() => setActiveId(id)} className={`landing-focus flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300 ${activeId === id ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:bg-white hover:text-black'}`}><Icon className={`h-4 w-4 transition-transform duration-300 ${activeId === id ? 'scale-100' : 'scale-90'}`} />{label}</button>)}</div>
          </div>

          <div className="landing-reveal mt-6 overflow-hidden rounded-[22px] border border-black/15 bg-[#171717] p-1.5 shadow-[0_34px_90px_rgba(0,0,0,0.18)] sm:p-2 md:mt-8" data-reveal="scale" style={{ transitionDelay: '100ms' }}>
            <div className="mb-1.5 flex h-8 items-center gap-1.5 px-3"><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="ml-3 hidden text-[9px] text-white/30 sm:block">kotta.com.mx/residencial-los-pinos/admin</span></div>
            <div className="grid min-h-[590px] overflow-hidden rounded-2xl bg-[#FAFAF9] lg:grid-cols-[218px_1fr]">
              <aside className="hidden bg-black p-5 text-white lg:flex lg:flex-col">
                <img src="/Logocompletowhite.svg" alt="Kotta" className="h-7 w-auto self-start" />
                <p className="mt-8 px-3 text-[9px] font-medium uppercase tracking-[0.12em] text-white/30">Residencial Los Pinos</p>
                <nav className="mt-3 space-y-1">{MODULES.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveId(id)} className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[11px] font-medium transition-all duration-200 ${activeId === id ? 'bg-white/[0.09] text-white' : 'text-white/40 hover:translate-x-0.5 hover:bg-white/[0.05] hover:text-white/80'}`}>{activeId === id && <span className="absolute -left-5 h-5 w-[3px] rounded-r-full bg-red" />}<Icon className="h-3.5 w-3.5" />{label}</button>)}</nav>
                <div className="mt-auto border-t border-white/10 pt-4 text-[10px] text-white/30">Panel del administrador</div>
              </aside>

              <div key={activeId} className="product-panel-enter min-w-0 p-5 sm:p-7 md:p-9">
                <header className="flex items-start justify-between gap-5"><div><p className="text-[9px] font-medium uppercase tracking-[0.1em] text-neutral-400">Lunes, 24 de agosto</p><h3 className="mt-2 text-2xl font-medium tracking-[-0.025em] text-black sm:text-[2rem]">{activeId === 'operacion' ? <>Buenos días, Laura<span className="text-red">.</span></> : active.label}</h3></div><div className="flex items-center gap-2"><button type="button" aria-label="Buscar" className="landing-focus hidden h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-400 sm:flex"><Search className="h-3.5 w-3.5" /></button><div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">LM</div></div></header>

                <div className="mt-7 flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end"><div><p className="text-lg font-medium text-black">{active.title}</p><p className="mt-2 max-w-xl text-xs leading-5 text-neutral-500">{active.description}</p></div><span className="w-fit rounded-xl bg-black px-3.5 py-2 text-[11px] font-medium text-white">{active.action}</span></div>

                <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{activeId === 'operacion' ? [['12', 'Tickets activos', '3 sin atender', 'bg-yellow'], ['48', 'Vecinos activos', '4 con pendiente', 'bg-red'], ['4', 'Pagos vencidos', 'Revisar', 'bg-red'], ['2', 'Activos urgentes', 'Requieren atención', 'bg-yellow']].map(([value, label, detail, dot]) => <div key={label} className="rounded-xl border border-neutral-200 bg-white p-3.5"><p className="text-xl font-medium text-black">{value}</p><p className="mt-1 text-[10px] text-neutral-400">{label}</p><p className="mt-3 flex items-center gap-1.5 text-[9px] text-neutral-500"><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{detail}</p></div>) : [['4', 'Registros recientes'], ['1', 'Requiere atención'], ['Hoy', 'Última actividad'], ['Activo', 'Estado del módulo']].map(([value, label]) => <div key={label} className="rounded-xl border border-neutral-200 bg-white p-3.5"><p className="text-lg font-medium text-black">{value}</p><p className="mt-1 text-[10px] text-neutral-400">{label}</p></div>)}</div>

                <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3.5 sm:px-5"><p className="text-[11px] font-medium text-black">{activeId === 'operacion' ? 'Actividad reciente' : active.label}</p><span className="text-[9px] text-neutral-400">Ver todos →</span></div>
                  <div className="divide-y divide-neutral-100">{activeRows.map((row) => <div key={`${row.title}-${row.meta}`} className="grid gap-2 px-4 py-3.5 transition-colors hover:bg-neutral-50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-5"><div className="min-w-0"><p className="truncate text-[11px] font-medium text-black">{row.title}</p><p className="mt-1 truncate text-[9px] text-neutral-400">{row.detail}</p></div><span className="font-mono text-[9px] text-neutral-400">{row.meta}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-medium ${STATUS_STYLE[row.tone]}`}>{row.status}</span></div>)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
