/**
 * Pagina principal del dashboard administrativo de un coto en Kotta.
 * Contiene el resumen operativo para ADMIN: tickets, vecinos, pagos, activos
 * urgentes y actividad reciente del condominio.
 * Se relaciona con getSession, prisma y el layout de src/app/[coto]/admin;
 * [coto] representa el slug del condominio u organizacion.
 * Existe para documentar y ejecutar la entrada multi-rol y multi-coto del SaaS,
 * validando sesion, rol ADMIN y pertenencia al coto antes de consultar datos.
 */

// Ya se rediseño
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardStatsSkeleton from '@/components/admin/DashboardStatsSkeleton'
import RecentTicketsSkeleton from '@/components/admin/RecentTicketsSkeleton'

export default async function AdminDashboard({
  params,
}: {
  params: { coto: string }
}) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const orgId = user.orgId!

  return (
    <div>
      {/* Header - no depende de Prisma, se pinta al instante */}
      <div className="mb-10">
        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.1em] mb-2">
          {new Date().toLocaleDateString('es-MX', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric',
          })}
        </p>
        <h1 className="font-gotham text-3xl md:text-[2.25rem] text-neutral-900 tracking-[-0.02em]">
          Buenos días, {user.name.split(' ')[0]}
          <span className="text-red">.</span>
        </h1>
      </div>

      <div className="mb-10">
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStats orgId={orgId} />
        </Suspense>
      </div>

      <Suspense fallback={<RecentTicketsSkeleton />}>
        <RecentTickets orgId={orgId} coto={params.coto} />
      </Suspense>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  NUEVO:       'Nuevo',
  EN_REVISION: 'En revisión',
  ASIGNADO:    'Asignado',
  EN_PROCESO:  'En proceso',
  RESUELTO:    'Resuelto',
  CERRADO:     'Cerrado',
}

// Clases de color reutilizadas junto con .badge (globals.css) — tokens del
// sistema actual (neutral / success / warning), sin hex sueltos.
const STATUS_STYLES: Record<string, string> = {
  NUEVO:       'bg-neutral-100 text-neutral-800',
  EN_REVISION: 'bg-black/[0.05] text-neutral-900',
  ASIGNADO:    'bg-black/[0.05] text-neutral-900',
  EN_PROCESO:  'bg-warning/10 text-warning',
  RESUELTO:    'bg-success/10 text-success',
  CERRADO:     'bg-neutral-100 text-neutral-400',
}

async function DashboardStats({ orgId }: { orgId: string }) {
  // pagosVencidos y morosos eran la misma consulta repetida - ahora se pide
  // una sola vez y se reutiliza el valor.
  const [
    ticketsActivos,
    ticketsNuevos,
    totalVecinos,
    pagosVencidos,
    activosUrgentes,
  ] = await Promise.all([
    prisma.ticket.count({
      where: { orgId, status: { notIn: ['RESUELTO', 'CERRADO'] } },
    }),
    prisma.ticket.count({
      where: { orgId, status: 'NUEVO' },
    }),
    prisma.user.count({
      where: { orgId, role: 'VECINO', isActive: true },
    }),
    prisma.payment.count({
      where: { orgId, status: 'VENCIDO' },
    }),
    prisma.asset.count({
      where: { orgId, status: 'URGENTE' },
    }),
  ])

  const morosos = pagosVencidos

  // Estado neutro por defecto; solo se activa un acento funcional
  // (warning/danger/success) cuando el dato requiere atención.
  const stats = [
    {
      label:    'Tickets activos',
      value:    ticketsActivos,
      sub:      `${ticketsNuevos} sin atender`,
      subClass: ticketsNuevos > 0 ? 'text-warning' : 'text-neutral-400',
      dotClass: ticketsNuevos > 0 ? 'bg-warning' : 'bg-neutral-400',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      ),
    },
    {
      label:    'Vecinos activos',
      value:    totalVecinos,
      sub:      `${morosos} moroso${morosos !== 1 ? 's' : ''}`,
      subClass: morosos > 0 ? 'text-danger' : 'text-neutral-400',
      dotClass: morosos > 0 ? 'bg-danger' : 'bg-neutral-400',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" fill="none"/>
        </svg>
      ),
    },
    {
      label:    'Pagos vencidos',
      value:    pagosVencidos,
      sub:      pagosVencidos > 0 ? 'Requieren atención' : 'Todo al corriente',
      subClass: pagosVencidos > 0 ? 'text-danger' : 'text-success',
      dotClass: pagosVencidos > 0 ? 'bg-danger' : 'bg-success',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" fill="none"/>
          <path d="M2 10h20" stroke="currentColor" strokeWidth="1.75"/>
        </svg>
      ),
    },
    {
      label:    'Activos urgentes',
      value:    activosUrgentes,
      sub:      activosUrgentes > 0 ? 'Requieren revisión' : 'Todo en orden',
      subClass: activosUrgentes > 0 ? 'text-warning' : 'text-success',
      dotClass: activosUrgentes > 0 ? 'bg-warning' : 'bg-success',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" fill="none"/>
          <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group bg-white rounded-2xl border border-neutral-100 p-6
                     transition-all duration-300 ease-in-out
                     hover:border-neutral-200 hover:shadow-card hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl bg-neutral-900/[0.04] text-neutral-900
                           flex items-center justify-center mb-6
                           transition-colors duration-300 group-hover:bg-neutral-900/[0.07]">
            {stat.icon}
          </div>

          <p className="font-gotham text-[2rem] leading-none text-neutral-900 tracking-[-0.02em] mb-2">
            {stat.value}
          </p>
          <p className="text-[13px] text-neutral-400 mb-3">{stat.label}</p>

          <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${stat.subClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stat.dotClass}`} />
            {stat.sub}
          </div>
        </div>
      ))}
    </div>
  )
}

async function RecentTickets({ orgId, coto }: { orgId: string; coto: string }) {
  const ticketsRecientes = await prisma.ticket.findMany({
    where:   { orgId },
    orderBy: { createdAt: 'desc' },
    take:    5,
    include: { reportedBy: true },
  })

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
        <h2 className="font-gotham text-[15px] font-medium text-neutral-900">
          Tickets recientes
        </h2>
        <a
          href={`/${coto}/admin/tickets`}
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400
                     hover:text-black transition-colors"
        >
          Ver todos
          <span aria-hidden="true">→</span>
        </a>
      </div>

      {ticketsRecientes.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-neutral-900 mb-1">
            No hay tickets aún
          </p>
          <p className="text-xs text-neutral-400">
            Cuando un vecino reporte un problema, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {ticketsRecientes.map((ticket: any) => {
            const statusClass = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.NUEVO
            return (
              <div
                key={ticket.id}
                className="flex items-center justify-between px-6 py-4
                           hover:bg-neutral-100/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[11px] font-mono text-neutral-400 flex-shrink-0">
                    #{ticket.folio}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {ticket.reportedBy.name} ·{' '}
                      {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <span className={`badge flex-shrink-0 ml-4 ${statusClass}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}