/**
 * Pagina principal del dashboard de vecino dentro de un coto en Kotta.
 * Contiene accesos rapidos y resumen personal del residente: reportes activos,
 * pagos recientes y proxima reserva confirmada.
 * Se relaciona con getSession, prisma, Link y el layout de src/app/[coto]/vecino;
 * [coto] representa el slug del condominio u organizacion.
 * Existe para materializar la experiencia multi-rol y multi-coto del SaaS,
 * validando sesion, rol VECINO y pertenencia al coto antes de mostrar datos.
 */
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function VecinoDashboard({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'VECINO') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const orgId = user.orgId!
  const now   = new Date()

  const [ticketsActivos, ultimosPagos, proximaReserva] = await Promise.all([
    prisma.ticket.findMany({
      where: { orgId, reportedById: user.id, status: { notIn: ['RESUELTO', 'CERRADO'] } },
      orderBy: { createdAt: 'desc' }, take: 3,
    }),
    prisma.payment.findMany({
      where: { orgId, userId: user.id }, orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 2,
    }),
    prisma.amenityReservation.findFirst({
      where: { userId: user.id, date: { gte: now }, status: 'CONFIRMADA' },
      orderBy: { date: 'asc' }, include: { amenity: true },
    }),
  ])

  const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
    NUEVO:       { color: '#6B7A99', bg: '#F1F5F9', label: 'Nuevo'       },
    EN_REVISION: { color: '#4FA8E8', bg: '#E8F4FD', label: 'En revisión' },
    ASIGNADO:    { color: '#4FA8E8', bg: '#E8F4FD', label: 'Asignado'    },
    EN_PROCESO:  { color: '#F5A623', bg: '#FEF3E2', label: 'En proceso'  },
    RESUELTO:    { color: '#1DB87E', bg: '#E6F9F1', label: 'Resuelto'    },
    CERRADO:     { color: '#1DB87E', bg: '#E6F9F1', label: 'Cerrado'     },
  }
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Hola, {user.name.split(' ')[0]}.</h1>
        <p className="text-sm text-[#6B7A99]">{user.org?.name}{user.houseNumber && ` · Casa ${user.houseNumber}`}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Crear reporte', href: `/${params.coto}/vecino/tickets/nuevo`, color: '#1E3A5F', bg: '#E8F0F9',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#1E3A5F" strokeWidth="2.5" strokeLinecap="round"/></svg> },
          { label: 'Mis tickets',   href: `/${params.coto}/vecino/tickets`,       color: '#4FA8E8', bg: '#E8F4FD',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#4FA8E8" strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg> },
          { label: 'Mis pagos',     href: `/${params.coto}/vecino/pagos`,         color: '#1DB87E', bg: '#E6F9F1',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#1DB87E" strokeWidth="1.8" fill="none"/><path d="M2 10h20" stroke="#1DB87E" strokeWidth="1.8"/></svg> },
          { label: 'Reservar',      href: `/${params.coto}/vecino/reservas`,      color: '#F5A623', bg: '#FEF3E2',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#F5A623" strokeWidth="1.8" fill="none"/><path d="M3 9h18M8 2v4M16 2v4" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round"/></svg> },
        ].map((action) => (
          <Link key={action.href} href={action.href}
            className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#C5D5EE] hover:shadow-sm transition-all text-center">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: action.bg }}>{action.icon}</div>
            <span className="text-sm font-medium text-[#0F1F34]">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="font-medium text-[#0F1F34] text-sm">Mis reportes activos</h2>
            <Link href={`/${params.coto}/vecino/tickets`} className="text-xs text-[#4FA8E8] hover:underline">Ver todos →</Link>
          </div>
          {ticketsActivos.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#6B7A99]">No tienes reportes activos.</p>
              <Link href={`/${params.coto}/vecino/tickets/nuevo`} className="text-xs text-[#4FA8E8] hover:underline mt-1 block">Crear un reporte →</Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {ticketsActivos.map((ticket) => {
                const st = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.NUEVO
                return (
                  <div key={ticket.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm text-[#0F1F34]">{ticket.title}</p>
                      <p className="text-xs text-[#6B7A99] mt-0.5">#{ticket.folio} · {new Date(ticket.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="font-medium text-[#0F1F34] text-sm">Estado de cuenta</h2>
            <Link href={`/${params.coto}/vecino/pagos`} className="text-xs text-[#4FA8E8] hover:underline">Ver historial →</Link>
          </div>
          {ultimosPagos.length === 0 ? (
            <div className="py-10 text-center"><p className="text-sm text-[#6B7A99]">No hay pagos registrados.</p></div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {ultimosPagos.map((pago) => {
                const colors = { PAGADO: { color: '#1DB87E', bg: '#E6F9F1', label: 'Pagado' }, PENDIENTE: { color: '#F5A623', bg: '#FEF3E2', label: 'Pendiente' }, VENCIDO: { color: '#E8503A', bg: '#FEECEA', label: 'Vencido' } }
                const st = colors[pago.status as keyof typeof colors] ?? colors.PENDIENTE
                return (
                  <div key={pago.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm text-[#0F1F34]">{MESES[pago.month - 1]} {pago.year}</p>
                      <p className="text-xs text-[#6B7A99] mt-0.5">${Number(pago.amount).toLocaleString('es-MX')} MXN</p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
          {proximaReserva && (
            <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#FEF3E2]">
              <p className="text-xs font-medium text-[#B56B00]">Próxima reserva</p>
              <p className="text-sm text-[#0F1F34] mt-0.5">{proximaReserva.amenity.name} · {new Date(proximaReserva.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
