'use client'

import { useState } from 'react'
import { BarChart3, CalendarDays, CreditCard, DoorOpen, LayoutDashboard, TicketCheck, Users, type LucideIcon } from 'lucide-react'

type ModuleId = 'operacion' | 'pagos' | 'tickets' | 'accesos' | 'amenidades' | 'administracion'
type Module = { id: ModuleId; label: string; icon: LucideIcon; title: string; description: string }

const MODULES: Module[] = [
  { id: 'operacion', label: 'Operación', icon: LayoutDashboard, title: 'La operación completa, a primera vista.', description: 'Pendientes, actividad y puntos de atención reunidos para que el administrador sepa dónde actuar.' },
  { id: 'pagos', label: 'Pagos', icon: CreditCard, title: 'Claridad sobre cuotas y movimientos.', description: 'Consulta el estado de cobro de la comunidad y conserva el detalle de cada movimiento.' },
  { id: 'tickets', label: 'Tickets y órdenes', icon: TicketCheck, title: 'Cada reporte tiene un siguiente paso.', description: 'Del reporte del vecino a la asignación, evidencia y cierre de la orden de trabajo.' },
  { id: 'accesos', label: 'Accesos', icon: DoorOpen, title: 'Entradas y visitantes bajo control.', description: 'Invitaciones, validaciones y registros accesibles para residentes y personal de caseta.' },
  { id: 'amenidades', label: 'Amenidades', icon: CalendarDays, title: 'Espacios comunes sin cruces ni confusión.', description: 'Solicitudes y reservaciones organizadas por fecha, espacio y residente.' },
  { id: 'administracion', label: 'Administración', icon: Users, title: 'La comunidad, organizada por perfiles.', description: 'Gestiona viviendas, residentes, proveedores y guardias dentro del mismo condominio.' },
]

const rows: Record<ModuleId, { title: string; detail: string; meta: string; status: string }[]> = {
  operacion: [
    { title: 'Fuga en cisterna norte', detail: 'Orden asignada · Plomería', meta: 'Hoy, 10:32', status: 'En proceso' },
    { title: 'Reserva de terraza', detail: 'Casa 18 · 18:00–22:00', meta: 'Sábado', status: 'Confirmada' },
    { title: 'Acceso de proveedor', detail: 'Mantenimiento de portón', meta: 'Hoy, 12:15', status: 'Validado' },
  ],
  pagos: [
    { title: 'Cuota de mantenimiento', detail: 'Casa 24 · Agosto', meta: '$2,500', status: 'Pagado' },
    { title: 'Cuota de mantenimiento', detail: 'Casa 08 · Agosto', meta: '$2,500', status: 'Pendiente' },
    { title: 'Reparación extraordinaria', detail: 'Casa 31', meta: '$850', status: 'Pagado' },
  ],
  tickets: [
    { title: 'Luminaria en acceso', detail: 'Asignada a Eléctrica Norte', meta: '#0091', status: 'Asignada' },
    { title: 'Fuga en cisterna norte', detail: 'Evidencia pendiente', meta: '#0089', status: 'En proceso' },
    { title: 'Portón secundario', detail: 'Trabajo documentado', meta: '#0087', status: 'Cerrado' },
  ],
  accesos: [
    { title: 'María López', detail: 'Visita · Casa 14', meta: '10:42', status: 'Dentro' },
    { title: 'Servicios hidráulicos', detail: 'Proveedor · Orden #0089', meta: '09:18', status: 'Validado' },
    { title: 'Carlos Ruiz', detail: 'Visita · Casa 03', meta: '08:56', status: 'Salida' },
  ],
  amenidades: [
    { title: 'Terraza principal', detail: 'Casa 18 · Laura M.', meta: 'Sáb 22', status: 'Confirmada' },
    { title: 'Cancha', detail: 'Casa 07 · Roberto S.', meta: 'Dom 23', status: 'Confirmada' },
    { title: 'Salón común', detail: 'Casa 32 · Elena V.', meta: 'Vie 28', status: 'Pendiente' },
  ],
  administracion: [
    { title: 'Laura Martínez', detail: 'Administradora', meta: 'ADMIN', status: 'Activa' },
    { title: 'Mario López', detail: 'Proveedor · Plomería', meta: 'PROVEEDOR', status: 'Activo' },
    { title: 'Roberto Díaz', detail: 'Caseta principal', meta: 'GUARDIA', status: 'Activo' },
  ],
}

export default function Characteristics() {
  const [activeId, setActiveId] = useState<ModuleId>('operacion')
  const active = MODULES.find((module) => module.id === activeId) ?? MODULES[0]

  return (
    <section id="producto" className="overflow-hidden bg-white py-24 md:py-36">
      <div className="container-kotta">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Dentro de Kotta</p><h2 className="mt-4 max-w-4xl text-4xl font-medium leading-[1.05] tracking-[-0.04em] text-black sm:text-5xl md:text-7xl">Un producto para operar, no solo para consultar.</h2></div><p className="max-w-lg text-base leading-7 text-neutral-500 lg:pb-2">Cada módulo comparte el mismo contexto del condominio. Menos saltos entre herramientas; más continuidad entre lo que se reporta, se decide y se resuelve.</p></div>
      </div>

      <div className="mt-14 border-y border-neutral-200 bg-[#F4F4F2] py-8 md:mt-20 md:py-14">
        <div className="container-kotta">
          <div className="overflow-x-auto pb-2" role="tablist" aria-label="Módulos de Kotta"><div className="flex min-w-max gap-1">{MODULES.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeId === id} onClick={() => setActiveId(id)} className={`group flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${activeId === id ? 'bg-black text-white' : 'text-neutral-500 hover:bg-white hover:text-black'}`}><Icon className="h-4 w-4" />{label}</button>)}</div></div>

          <div className="mt-6 overflow-hidden rounded-[1.35rem] border border-black/10 bg-[#111] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.2)] sm:p-3 md:mt-8">
            <div className="grid min-h-[560px] overflow-hidden rounded-2xl bg-white lg:grid-cols-[210px_1fr]">
              <aside className="hidden border-r border-neutral-100 bg-neutral-50 p-5 lg:block"><img src="/Logo_for_kotta.svg" alt="Kotta" className="h-7 w-auto" /><p className="mt-8 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">Residencial Los Pinos</p><nav className="mt-4 space-y-1">{MODULES.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveId(id)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition ${activeId === id ? 'bg-black text-white' : 'text-neutral-500 hover:bg-white hover:text-black'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</nav></aside>
              <div className="p-5 sm:p-7 md:p-9">
                <div className="flex flex-col justify-between gap-5 border-b border-neutral-100 pb-7 sm:flex-row sm:items-start"><div><p className="text-xs text-neutral-400">{active.label}</p><h3 className="mt-2 max-w-xl text-2xl font-medium tracking-tight text-black sm:text-3xl">{active.title}</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">{active.description}</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">AD</div></div>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">{activeId === 'operacion' ? [['12', 'Tickets activos'], ['4', 'Pendientes'], ['23', 'Activos registrados']].map(([value, label]) => <div key={label} className="border-l-2 border-black px-4 py-2"><p className="text-2xl font-medium text-black">{value}</p><p className="mt-1 text-xs text-neutral-400">{label}</p></div>) : [['Hoy', 'Actividad reciente'], [String(rows[activeId].length), 'Registros visibles'], ['Kotta', 'Contexto del coto']].map(([value, label]) => <div key={label} className="border-l-2 border-black px-4 py-2"><p className="text-xl font-medium text-black">{value}</p><p className="mt-1 text-xs text-neutral-400">{label}</p></div>)}</div>
                <div className="mt-8"><div className="flex items-center justify-between"><p className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">Actividad reciente</p><BarChart3 className="h-4 w-4 text-neutral-300" /></div><div className="mt-3 divide-y divide-neutral-100 border-y border-neutral-100">{rows[activeId].map((row) => <div key={`${row.title}-${row.meta}`} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-sm font-medium text-black">{row.title}</p><p className="mt-1 text-xs text-neutral-400">{row.detail}</p></div><span className="text-xs text-neutral-400">{row.meta}</span><span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">{row.status}</span></div>)}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
