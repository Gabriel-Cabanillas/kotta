import { ArrowUpRight, Bell, Building2, CalendarDays, CreditCard, KeyRound, Users, Wrench } from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Residentes y viviendas', text: 'Organiza usuarios, viviendas y roles dentro de cada condominio.' },
  { icon: CreditCard, title: 'Control administrativo', text: 'Consulta cuotas, movimientos e información relevante para la administración.' },
  { icon: Wrench, title: 'Tickets y mantenimiento', text: 'Da seguimiento a reportes, órdenes de trabajo, responsables y evidencias.' },
  { icon: KeyRound, title: 'Invitaciones y accesos', text: 'Gestiona visitantes y registros de entrada desde flujos claros para la comunidad.' },
  { icon: CalendarDays, title: 'Amenidades y reservas', text: 'Coordina espacios comunes y solicitudes de reservación desde la plataforma.' },
  { icon: Bell, title: 'Comunicación centralizada', text: 'Mantén avisos y actividad operativa en un entorno compartido y ordenado.' },
] as const

const ROLES = [
  ['Administrador', 'Control y seguimiento de la operación'],
  ['Vecino', 'Pagos, reportes, reservas e invitaciones'],
  ['Proveedor', 'Órdenes asignadas y evidencia de trabajo'],
  ['Guardia', 'Validación y registro de accesos'],
] as const

export default function Characteristics() {
  return (
    <section id="caracteristicas" className="bg-white py-20 md:py-28">
      <div className="container-kotta">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Una operación conectada</p><h2 className="mt-4 text-3xl font-medium tracking-tight text-black md:text-5xl">Todo lo esencial, sin módulos bloqueados.</h2></div><p className="max-w-md text-sm leading-6 text-neutral-500 md:text-right">Todas las funcionalidades de Kotta están incluidas. Cada perfil entra a una experiencia enfocada en su trabajo.</p></div>
        <div className="mt-12 grid overflow-hidden rounded-[1.75rem] border border-neutral-100 sm:grid-cols-2 lg:grid-cols-3">{FEATURES.map(({ icon: Icon, title, text }) => <article key={title} className="border-b border-neutral-100 p-6 last:border-b-0 sm:border-r sm:p-8 lg:min-h-56"><Icon className="h-5 w-5 text-black" strokeWidth={1.8} /><h3 className="mt-8 text-base font-medium text-black">{title}</h3><p className="mt-3 text-sm leading-6 text-neutral-500">{text}</p></article>)}</div>
        <div className="mt-8 rounded-[1.75rem] bg-black p-6 text-white sm:p-8 lg:p-10"><div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-center"><div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black"><Building2 className="h-5 w-5" /></div><h3 className="mt-6 text-2xl font-medium">Un sistema. Cuatro experiencias.</h3><p className="mt-3 text-sm leading-6 text-white/55">La misma información, presentada según las responsabilidades de cada persona.</p></div><div className="grid gap-2 sm:grid-cols-2">{ROLES.map(([role, detail]) => <div key={role} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4"><div><p className="text-sm font-medium">{role}</p><p className="mt-1 text-xs text-white/45">{detail}</p></div><ArrowUpRight className="ml-auto h-4 w-4 text-white/30" /></div>)}</div></div></div>
      </div>
    </section>
  )
}
