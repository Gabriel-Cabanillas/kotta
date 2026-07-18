/**
 * Sección "Cómo Funciona" — landing page de Kotta.
 * Tres pasos del flujo de onboarding, cada uno con su mockup de UI real.
 * Ruta destino en el proyecto: kotta/src/components/sections/Howitworks.tsx
 */

import { ArrowRight } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────

interface RegistrationField {
  label: string
  value: string
}

interface RegisteredUser {
  initials: string
  name: string
  detail: string
  status: string
  statusColor: 'green' | 'yellow'
  avatarClass: string
}

interface TimelineEvent {
  dotColor: 'green' | 'blue' | 'orange'
  title: string
  detail: string
  time: string
  highlighted?: boolean
}

// ─── Datos ────────────────────────────────────────────────────────────────

const registrationFields: RegistrationField[] = [
  { label: 'NOMBRE DEL COTO', value: 'Residencial Los Pinos' },
  { label: 'COREO DEL ADMIN', value: 'admin@lospinos.mx' },
  { label: 'PLAN', value: 'Plan Pro - $6,500/mes' },
]

const registeredUsers: RegisteredUser[] = [
  {
    initials: 'MG',
    name: 'María González',
    detail: 'Vecina · Casa 14',
    status: 'Activa',
    statusColor: 'green',
    avatarClass: 'bg-[#DCEEDC] text-[#2F6B3A]',
  },
  {
    initials: 'CH',
    name: 'Carlos Herrera',
    detail: 'Proveedor · Plomería',
    status: 'Activo',
    statusColor: 'green',
    avatarClass: 'bg-[#F1E2D2] text-[#8A5A2B]',
  },
  {
    initials: 'RD',
    name: 'Roberto Díaz',
    detail: 'Guardia · Turno AM',
    status: 'Activo',
    statusColor: 'green',
    avatarClass: 'bg-[#F3DCE4] text-[#9C3D5E]',
  },
  {
    initials: 'AM',
    name: 'Ana Martínez',
    detail: 'Vecina · Casa 22',
    status: 'Pendiente',
    statusColor: 'yellow',
    avatarClass: 'bg-[#E6F2E6] text-[#4A7C52]',
  },
]

const ticketTimeline: TimelineEvent[] = [
  {
    dotColor: 'green',
    title: 'Vecino reporta',
    detail: 'Foto adjunta · Fuga en cisterna',
    time: '8:10',
  },
  {
    dotColor: 'blue',
    title: 'Admin asigna',
    detail: 'Proveedor: Mario López',
    time: '9:45',
  },
  {
    dotColor: 'orange',
    title: 'Proveedor llega',
    detail: 'Acceso validado por guardia',
    time: '10:32',
  },
  {
    dotColor: 'blue',
    title: 'Evidencia subida',
    detail: 'Fotos antes + después',
    time: '12:15',
  },
  {
    dotColor: 'green',
    title: 'Ticket cerrado',
    detail: 'Costo: $850 registrado',
    time: '12:18',
    highlighted: true,
  },
]

const dotColorClass: Record<TimelineEvent['dotColor'], string> = {
  green: 'bg-green',
  blue: 'bg-sky',
  orange: 'bg-yellow',
}

const statusBadgeClass: Record<RegisteredUser['statusColor'], string> = {
  green: 'bg-green/15 text-green',
  yellow: 'bg-yellow/15 text-yellow',
}

// ─── Subcomponentes ─────────────────────────────────────────────────────

function StepMarker({ number, isLast }: { number: string; isLast: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-lg font-bold text-white md:h-14 md:w-14">
        {number}
      </div>
      {!isLast && <div className="mt-3 w-px flex-1 bg-neutral-100" />}
    </div>
  )
}

function DarkCard({
  header,
  children,
}: {
  header: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-black">
      <div className="border-b border-white/10 px-7 py-5">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">
          {header}
        </span>
      </div>
      {children}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function Howitworks() {
  return (
    <section id= 'como-funciona' className="bg-white py-24 md:py-32 md:-ml-[120px]">
      <div className="container-kotta">
        {/* Encabezado */}
        <div className="max-w-3xl">
          <h2 className="text-5xl leading-[1.05] md:text-6xl">
            <span className="font-gotham font-medium text-black">Tres pasos. Tu coto</span>{' '}
            <span className="font-gotham font-light text-black">ya</span>
            <br />
            <span className="font-gotham font-light text-black">está operando</span>
          </h2>
          <p className="mt-6 max-w-xl italic text-neutral-400">
            “Sin instalaciones. Sin configuraciones técnicas. Sin capacitar a
            nadie.{' '}
            <span className="font-medium text-neutral-900">
              Si sabes usar WhatsApp, sabes usar Kotta
            </span>
            ”
          </p>
        </div>

        {/* Pasos */}
        <div className="mt-16 flex flex-col md:mt-20">
          {/* Paso 01 */}
          <div className="flex gap-6 md:gap-10">
            <StepMarker number="01" isLast={false} />
            <div className="grid flex-1 items-start gap-10 pb-16 md:grid-cols-2 md:gap-16 md:pb-20">
              <div>
                <h3 className="text-2xl font-medium leading-tight text-black md:text-[1.75rem]">
                  Contratas. Tu URL queda activa en menos de 24 horas.
                </h3>
                <p className="mt-4 leading-relaxed text-neutral-800">
                  Elige el plan, registra tu condominio y en cuestión de horas
                  tienes tu espacio propio listo para operar.
                </p>
                <a
                  href="https://kotta.com.mx/tu-coto"
                  className="mt-4 inline-block text-sky hover:underline underline-offset-2"
                >
                  kotta.com.mx/tu-coto
                </a>
              </div>

              <DarkCard header="REGISTRO DE CONDOMINIO">
                {registrationFields.map((field) => (
                  <div
                    key={field.label}
                    className="border-b border-white/10 px-7 py-5"
                  >
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">
                      {field.label}
                    </p>
                    <p className="text-[0.9375rem] text-white">
                      {field.value}
                    </p>
                  </div>
                ))}
                <div className="p-7">
                  <div className="btn-primary btn-sky w-full select-none justify-center">
                    Activas condominio <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </DarkCard>
            </div>
          </div>

          {/* Paso 02 */}
          <div className="flex gap-6 md:gap-10">
            <StepMarker number="02" isLast={false} />
            <div className="grid flex-1 items-start gap-10 pb-16 md:grid-cols-2 md:gap-16 md:pb-20">
              <div>
                <h3 className="text-2xl font-medium leading-tight text-black md:text-[1.75rem]">
                  Registras a tus vecinos, guardias y proveedores.
                </h3>
                <p className="mt-4 leading-relaxed text-neutral-800">
                  El sistema envía una invitación por correo a cada usuario.
                  Ellos crean su contraseña y ya tienen acceso a su panel.
                </p>
                <p className="mt-4 text-sm text-neutral-400">
                  Sin configuración técnica. Sin capacitaciones largas.
                </p>
              </div>

              <DarkCard header="USUARIOS REGISTRADOS">
                {registeredUsers.map((user) => (
                  <div
                    key={user.initials}
                    className="flex items-center gap-4 border-b border-white/10 px-7 py-5 last:border-b-0"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${user.avatarClass}`}
                    >
                      {user.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] font-semibold text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {user.detail}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass[user.statusColor]}`}
                    >
                      {user.status}
                    </span>
                  </div>
                ))}
              </DarkCard>
            </div>
          </div>

          {/* Paso 03 */}
          <div className="flex gap-6 md:gap-10">
            <StepMarker number="03" isLast={true} />
            <div className="grid flex-1 items-start gap-10 md:grid-cols-2 md:gap-16">
              <div>
                <h3 className="text-2xl font-medium leading-tight text-black md:text-[1.75rem]">
                  Cada quien opera desde su panel. El flujo corre solo.
                </h3>
                <p className="mt-4 leading-relaxed text-neutral-800">
                  Tickets, órdenes, accesos y pagos. Reporte → asignación →
                  evidencia → cierre. Sin llamadas, sin grupos de WhatsApp.
                </p>
                <p className="mt-4 text-sm text-neutral-400">
                  Cada rol ve exactamente lo que necesita.
                </p>
              </div>

              <DarkCard header="TICKET #0082 · FUGA EN CISTERN ÁREA B">
                {ticketTimeline.map((event, i) => (
                  <div
                    key={event.title}
                    className={`flex items-start gap-3 px-7 py-5 ${
                      event.highlighted ? 'bg-green/20' : ''
                    } ${
                      i < ticketTimeline.length - 1
                        ? 'border-b border-white/10'
                        : ''
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColorClass[event.dotColor]}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] font-semibold text-white">
                        {event.title}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {event.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-neutral-400">
                      {event.time}
                    </span>
                  </div>
                ))}
              </DarkCard>
            </div>
          </div>
        </div>

        {/* CTA final */}
        <div className="mt-20 flex flex-col items-start gap-6 rounded-3xl border border-neutral-100 p-8 md:mt-28 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h3 className="text-2xl font-medium text-black">
              ¿Listo para dejar de administrar en WhatsApp?
            </h3>
            <p className="mt-2 italic text-neutral-400">
              Desde $3,500/mes · Todos los roles incluidos · Sin contrato
              anual
            </p>
          </div>
          <a
            href="#precio"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-neutral-200 px-6 py-3 text-[0.9375rem] font-medium text-black no-underline transition-colors duration-200 hover:bg-neutral-200/70"
          >
            Ver planes y precios <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}