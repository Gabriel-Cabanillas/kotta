/**
 * CaracteristicasSection
 * Sección "Control total. Sin complicaciones" + "Un sistema, 4 roles".
 * Combina el grid de features del administrador (con mock de panel)
 * y el bloque de los 4 roles del sistema con texturas decorativas.
 *
 * Assets requeridos en /public:
 *  - /textura13.png  (debajo del heading "UN SISTEMA, 4 ROLES")
 *  - /textura12.png  (esquina inferior derecha, sangrado fuera del contenedor)
 */

import Image from 'next/image'
import {
  LayoutDashboard,
  Wrench,
  Users,
  CreditCard,
  Package,
  ClipboardList,
  ChevronRight,
  Check,
  type LucideIcon,
} from 'lucide-react'

// ────────────────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────────────────

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard ejecutivo',
    description: 'Tickets activos, morosos y gastos del mes en una sola vista.',
  },
  {
    icon: Wrench,
    title: 'Órdenes de trabajo',
    description: 'Crea, asigna y cierra con costo real y foto del trabajo terminado.',
  },
  {
    icon: Users,
    title: 'Gestión de usuarios',
    description: 'Registra vecinos, proveedores y guardias. El sistema invita por correo.',
  },
  {
    icon: CreditCard,
    title: 'Control de pagos',
    description: 'Cuotas, historial y lista de morosos siempre actualizada.',
  },
  {
    icon: Package,
    title: 'Inventario de activos',
    description: 'Portones, bombas y áreas comunes con historial de mantenimiento.',
  },
  {
    icon: ClipboardList,
    title: 'Directorio de proveedores',
    description: 'Especialidad, calificación y disponibilidad en tiempo real.',
  },
]

const STATS = [
  { label: 'Tickets activos', value: '12', sub: '3 sin asignar', className: 'text-green' },
  { label: 'Morosos', value: '4', sub: 'de 48 vecinos', className: 'text-red' },
  { label: 'Activos OK', value: '23', sub: '2 en revisión', className: 'text-white' },
] as const

const MODULES: { icon: LucideIcon; label: string }[] = [
  { icon: LayoutDashboard, label: 'Dashboard ejecutivo' },
  { icon: Wrench, label: 'Órdenes de trabajo' },
  { icon: Users, label: 'Gestión de usuarios' },
  { icon: CreditCard, label: 'Control de pagos' },
  { icon: Package, label: 'Inventario de activos' },
]

interface Role {
  code: string
  name: string
  description: string
  items: string[]
  avatarBg: string
  avatarText: string
}

const ROLES: Role[] = [
  {
    code: 'AD',
    name: 'Administrador',
    description: 'Centro de operaciones. Control total del condominio.',
    items: [
      'Dashboard + tickets + pagos',
      'Órdenes con evidencia fotográfica',
      'Gestión de todos los roles',
      'Reportes ejecutivos mensuales',
    ],
    avatarBg: 'bg-neutral-200',
    avatarText: 'text-navy',
  },
  {
    code: 'VE',
    name: 'Vecino',
    description: 'Simple y sin ruido. Solo lo que el vecino necesita.',
    items: [
      'Crear reportes con foto',
      'Seguimiento en tiempo real',
      'Pagos y reserva de amenidades',
      'Directorio de la comunidad',
    ],
    avatarBg: 'bg-green/15',
    avatarText: 'text-green',
  },
  {
    code: 'PR',
    name: 'Proveedor',
    description: 'Diseñado para usarse en campo. Rápido y directo.',
    items: [
      'Órdenes asignadas con detalle',
      'Subir evidencia para cerrar',
      'Historial y calificaciones',
      'Disponibilidad configurable',
    ],
    avatarBg: 'bg-yellow/15',
    avatarText: 'text-[#C9791F]',
  },
  {
    code: 'GU',
    name: 'Guardia',
    description: 'La interfaz más simple. Control de accesos desde la caseta.',
    items: [
      'Validar y registrar accesos',
      'Bitácora del turno en vivo',
      'Login rápido con PIN',
      'Alertas de visitantes',
    ],
    avatarBg: 'bg-red/15',
    avatarText: 'text-red',
  },
]

// ────────────────────────────────────────────────────────────
// Subcomponentes
// ────────────────────────────────────────────────────────────

function FeatureCell({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon
  const col = index % 2
  const row = Math.floor(index / 2)
  const isLastCol = col === 1
  const isLastRow = row === 2

  return (
    <div
      className={[
        'p-6 md:p-7',
        !isLastCol ? 'md:border-r-2 md:border-black' : '',
        !isLastRow ? 'border-b-2 border-black' : '',
      ].join(' ')}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-black">
        <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
      </div>
      <h3 className="mb-1.5 font-gotham text-[0.9375rem] font-medium text-neutral-900">
        {feature.title}
      </h3>
      <p className="text-sm leading-snug text-neutral-400">{feature.description}</p>
    </div>
  )
}

function DashboardMock() {
  return (
    <div className="w-full max-w-[520px]">
      {/* Browser chrome */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow" />
          <span className="h-2.5 w-2.5 rounded-full bg-green" />
        </div>
        <div className="flex-1 truncate rounded-full border border-neutral-100 px-4 py-1.5 text-xs text-neutral-400">
          kotta.com.mx/residencial-los-pinos/admin
        </div>
      </div>

      {/* Panel card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card ">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <p className="text-xs text-neutral-400">Residencial Los Pinos</p>
            <p className="font-gotham text-lg font-medium text-neutral-900">
              Panel del administrador
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-navy">
            AD
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 px-6 pb-6 pt-5">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-black px-3.5 py-4">
              <p className="text-[0.6875rem] text-neutral-400">{stat.label}</p>
              <p className={`mt-1 font-gotham text-2xl font-medium ${stat.className}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-[0.6875rem] text-neutral-400">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="section-divider" />

        {/* Módulos disponibles */}
        <div className="px-6 pb-2 pt-5">
          <p className="text-xs font-medium tracking-[0.08em] text-neutral-400">
            MÓDULOS DISPONIBLES
          </p>
        </div>

        <div className="relative h-[210px] overflow-hidden">
          <ul className="divide-y divide-neutral-100 px-6">
            {MODULES.map((mod) => {
              const Icon = mod.icon
              return (
                <li key={mod.label} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black">
                      <Icon className="h-4 w-4 text-white" strokeWidth={1.75} />
                    </div>
                    <span className="text-sm text-neutral-900">{mod.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </li>
              )
            })}
          </ul>
          {/* Fade + corte de la última fila, tal como en el diseño de referencia */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </div>
  )
}

function RoleCard({ role, className = '' }: { role: Role; className?: string }) {
  return (
    <div className={`card relative h-[450px] overflow-hidden rounded-3xl ${className}`}>
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium ${role.avatarBg} ${role.avatarText}`}
        >
          {role.code}
        </div>
        <h3 className="font-gotham text-lg font-medium text-neutral-900">{role.name}</h3>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-neutral-400">{role.description}</p>

      <ul className="space-y-4">
        {role.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" strokeWidth={2} />
            <span className="text-sm leading-snug text-neutral-900">{item}</span>
          </li>
        ))}
      </ul>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Sección principal
// ────────────────────────────────────────────────────────────

export default function CaracteristicasSection() {
  return (
    <section id='caracteristicas' className="bg-white py-24 md:py-32">
      {/* ── Bloque 1: Features del administrador ─────────────── */}
      <div className="container-kotta">

        <div className="mb-14 max-w-xl md:-ml-[70px]">

          <h2 className="font-gotham text-4xl text-neutral-900 md:text-5xl">
            <span className="font-medium">Control total.</span>
            <br />
            <span className="font-light text-neutral-400">Sin complicaciones</span>
          </h2>
          <p className="mt-4 text-sm italic leading-relaxed text-neutral-400">
            “Todo lo que necesitas para administrar tu condominio está en un solo panel.
            Tickets, pagos, activos y proveedores en tiempo real.”
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2 md:items-center md:-ml-[70px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 border-black">
            {FEATURES.map((feature, i) => (
              <FeatureCell key={feature.title} feature={feature} index={i} />
            ))}
          </div>

          <div className="flex justify-center md:justify-end md:translate-x-[20px] lg:translate-x-[40px]">
            <DashboardMock />
          </div>
        </div>
      </div>

      {/* ── Bloque 2: Un sistema, 4 roles ─────────────────────── */}
      <div className="container-kotta relative mt-32 md:mt-44">
       

        <div className="relative z-10 grid gap-10 md:grid-cols-2 md:gap-16">
          {/* Heading + CTA */}
          <div className="flex flex-col justify-between md:-translate-x-[70px]">
            <h2 className="font-gotham text-6xl font-medium leading-[0.95] tracking-tight text-neutral-900 md:text-8xl">
              UN
              <br />
              SISTEMA,
              <br />
              4
              <br />
              ROLES
            </h2>

            <div className="mt-24 md:mt-0">
              <p className="font-gotham text-xl font-medium text-neutral-900">
                Un plan. Todos los roles incluidos.
              </p>
              <p className="mt-2 text-sm text-neutral-400">
                Sin cargos extra por número de usuarios o roles activos.
              </p>
              <a href="#precio" className="btn-ghost mt-6">
                Ver qué incluyen el plan →
              </a>
            </div>
          </div>

          {/* Cards en cascada */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-10">
              <RoleCard role={ROLES[0]} />
              <RoleCard role={ROLES[2]} />
            </div>
            <div className="flex flex-col gap-10 sm:mt-28">
              <RoleCard role={ROLES[1]} />
              <RoleCard role={ROLES[3]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}