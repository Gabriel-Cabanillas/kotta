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
    NUEVO:       { color: '#A6A6A6', bg: '#EDEDED',            label: 'Nuevo'       },
    EN_REVISION: { color: '#262624', bg: '#EDEDED',            label: 'En revisión' },
    ASIGNADO:    { color: '#262624', bg: '#EDEDED',            label: 'Asignado'    },
    EN_PROCESO:  { color: '#B8860B', bg: 'rgba(255,186,46,0.16)', label: 'En proceso'  },
    RESUELTO:    { color: '#1E8A34', bg: 'rgba(43,200,66,0.14)',  label: 'Resuelto'    },
    CERRADO:     { color: '#1E8A34', bg: 'rgba(43,200,66,0.14)',  label: 'Cerrado'     },
  }
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-gotham text-3xl text-neutral-900 mb-1.5">Hola, {user.name.split(' ')[0]}.</h1>
        <p className="text-sm text-neutral-400">{user.org?.name}{user.houseNumber && ` · Casa ${user.houseNumber}`}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Crear reporte', href: `/${params.coto}/vecino/tickets/nuevo`, color: '#FD5F56', bg: 'rgba(253,95,86,0.1)',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#FD5F56" strokeWidth="2.5" strokeLinecap="round"/></svg> },
          { label: 'Mis tickets',   href: `/${params.coto}/vecino/tickets`,       color: '#262624', bg: '#EDEDED',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#262624" strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg> },
          { label: 'Mis pagos',     href: `/${params.coto}/vecino/pagos`,         color: '#1E8A34', bg: 'rgba(43,200,66,0.12)',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#1E8A34" strokeWidth="1.8" fill="none"/><path d="M2 10h20" stroke="#1E8A34" strokeWidth="1.8"/></svg> },
          { label: 'Reservar',      href: `/${params.coto}/vecino/reservas`,      color: '#B8860B', bg: 'rgba(255,186,46,0.16)',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#B8860B" strokeWidth="1.8" fill="none"/><path d="M3 9h18M8 2v4M16 2v4" stroke="#B8860B" strokeWidth="1.8" strokeLinecap="round"/></svg> },
        ].map((action, i) => (
          <Link key={action.href} href={action.href}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-fade-up opacity-0 flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-neutral-100 hover:border-neutral-900/15 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 text-center">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: action.bg }}>{action.icon}</div>
            <span className="text-sm font-medium text-neutral-900">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="font-medium text-neutral-900 text-sm">Mis reportes activos</h2>
            <Link href={`/${params.coto}/vecino/tickets`} className="text-xs text-neutral-400 hover:text-red transition-colors">Ver todos →</Link>
          </div>
          {ticketsActivos.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-neutral-400">No tienes reportes activos.</p>
              <Link href={`/${params.coto}/vecino/tickets/nuevo`} className="text-xs text-red hover:underline mt-1 block">Crear un reporte →</Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {ticketsActivos.map((ticket) => {
                const st = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.NUEVO
                return (
                  <div key={ticket.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm text-neutral-900">{ticket.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">#{ticket.folio} · {new Date(ticket.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="font-medium text-neutral-900 text-sm">Estado de cuenta</h2>
            <Link href={`/${params.coto}/vecino/pagos`} className="text-xs text-neutral-400 hover:text-red transition-colors">Ver historial →</Link>
          </div>
          {ultimosPagos.length === 0 ? (
            <div className="py-10 text-center"><p className="text-sm text-neutral-400">No hay pagos registrados.</p></div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {ultimosPagos.map((pago) => {
                const colors = {
                  PAGADO:    { color: '#1E8A34', bg: 'rgba(43,200,66,0.12)',    label: 'Pagado'    },
                  PENDIENTE: { color: '#B8860B', bg: 'rgba(255,186,46,0.16)',   label: 'Pendiente' },
                  VENCIDO:   { color: '#D8352C', bg: 'rgba(253,95,86,0.12)',    label: 'Vencido'   },
                }
                const st = colors[pago.status as keyof typeof colors] ?? colors.PENDIENTE
                return (
                  <div key={pago.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm text-neutral-900">{MESES[pago.month - 1]} {pago.year}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">${Number(pago.amount).toLocaleString('es-MX')} MXN</p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
          {proximaReserva && (
            <div className="px-5 py-4 border-t border-neutral-100" style={{ background: 'rgba(255,186,46,0.08)' }}>
              <p className="text-xs font-medium" style={{ color: '#B8860B' }}>Próxima reserva</p>
              <p className="text-sm text-neutral-900 mt-0.5">{proximaReserva.amenity.name} · {new Date(proximaReserva.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}