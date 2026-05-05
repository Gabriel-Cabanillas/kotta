import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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


  // Datos en paralelo para máxima velocidad
  const [
    ticketsActivos,
    ticketsNuevos,
    totalVecinos,
    morosos,
    activosUrgentes,
    ticketsRecientes,
    pagosVencidos,
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
    prisma.ticket.findMany({
      where:   { orgId },
      orderBy: { createdAt: 'desc' },
      take:    5,
      include: { reportedBy: true },
    }),
    prisma.payment.count({
      where: { orgId, status: 'VENCIDO' },
    }),
  ])

  const STATUS_LABELS: Record<string, string> = {
    NUEVO:       'Nuevo',
    EN_REVISION: 'En revisión',
    ASIGNADO:    'Asignado',
    EN_PROCESO:  'En proceso',
    RESUELTO:    'Resuelto',
    CERRADO:     'Cerrado',
  }

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    NUEVO:       { color: '#6B7A99', bg: '#F1F5F9' },
    EN_REVISION: { color: '#4FA8E8', bg: '#E8F4FD' },
    ASIGNADO:    { color: '#4FA8E8', bg: '#E8F4FD' },
    EN_PROCESO:  { color: '#F5A623', bg: '#FEF3E2' },
    RESUELTO:    { color: '#1DB87E', bg: '#E6F9F1' },
    CERRADO:     { color: '#1DB87E', bg: '#E6F9F1' },
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">
          Buenos días, {user.name.split(' ')[0]}.
        </h1>
        <p className="text-sm text-[#6B7A99]">
          {new Date().toLocaleDateString('es-MX', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label:    'Tickets activos',
            value:    ticketsActivos,
            sub:      `${ticketsNuevos} sin atender`,
            color:    '#1E3A5F',
            subColor: ticketsNuevos > 0 ? '#F5A623' : '#6B7A99',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                  stroke="#1E3A5F" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              </svg>
            ),
            iconBg: '#E8F0F9',
          },
          {
            label:    'Vecinos activos',
            value:    totalVecinos,
            sub:      `${morosos} moroso${morosos !== 1 ? 's' : ''}`,
            color:    '#4FA8E8',
            subColor: morosos > 0 ? '#E8503A' : '#6B7A99',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#4FA8E8" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <circle cx="9" cy="7" r="4" stroke="#4FA8E8" strokeWidth="1.8" fill="none"/>
              </svg>
            ),
            iconBg: '#E8F4FD',
          },
          {
            label:    'Pagos vencidos',
            value:    pagosVencidos,
            sub:      pagosVencidos > 0 ? 'Requieren atención' : 'Todo al corriente',
            color:    pagosVencidos > 0 ? '#E8503A' : '#1DB87E',
            subColor: pagosVencidos > 0 ? '#E8503A' : '#1DB87E',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke={pagosVencidos > 0 ? '#E8503A' : '#1DB87E'} strokeWidth="1.8" fill="none"/>
                <path d="M2 10h20" stroke={pagosVencidos > 0 ? '#E8503A' : '#1DB87E'} strokeWidth="1.8"/>
              </svg>
            ),
            iconBg: pagosVencidos > 0 ? '#FEECEA' : '#E6F9F1',
          },
          {
            label:    'Activos urgentes',
            value:    activosUrgentes,
            sub:      activosUrgentes > 0 ? 'Requieren revisión' : 'Todo en orden',
            color:    activosUrgentes > 0 ? '#F5A623' : '#1DB87E',
            subColor: activosUrgentes > 0 ? '#F5A623' : '#1DB87E',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke={activosUrgentes > 0 ? '#F5A623' : '#1DB87E'} strokeWidth="1.8" fill="none"/>
                <path d="M8 21h8M12 17v4" stroke={activosUrgentes > 0 ? '#F5A623' : '#1DB87E'} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            ),
            iconBg: activosUrgentes > 0 ? '#FEF3E2' : '#E6F9F1',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: stat.iconBg }}
              >
                {stat.icon}
              </div>
            </div>
            <p className="font-display text-3xl mb-1" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-xs text-[#6B7A99] mb-1">{stat.label}</p>
            <p className="text-xs font-medium" style={{ color: stat.subColor }}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Tickets recientes */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="font-medium text-[#0F1F34]">Tickets recientes</h2>
          <a
            href={`/${params.coto}/admin/tickets`}
            className="text-xs text-[#4FA8E8] hover:underline"
          >
            Ver todos →
          </a>
        </div>
        
        {ticketsRecientes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[#6B7A99] text-sm">No hay tickets aún.</p>
            <p className="text-[#6B7A99] text-xs mt-1">
              Cuando un vecino reporte un problema aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {ticketsRecientes.map((ticket: any) => {
              const st = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.NUEVO
              return (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F9FC] transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-mono text-[#6B7A99] flex-shrink-0">
                      #{ticket.folio}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F1F34] truncate">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-[#6B7A99] mt-0.5">
                        {ticket.reportedBy.name} ·{' '}
                        {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-4"
                    style={{ color: st.color, background: st.bg }}
                  >
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}