import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function VecinoTickets({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'VECINO') redirect('/dashboard')

  const tickets = await prisma.ticket.findMany({
    where: { reportedById: user.id }, orderBy: { createdAt: 'desc' },
    include: { workOrder: { include: { provider: true } } },
  })

  const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    NUEVO:       { color: '#A6A6A6', bg: '#EDEDED',                label: 'Nuevo'       },
    EN_REVISION: { color: '#262624', bg: '#EDEDED',                label: 'En revisión' },
    ASIGNADO:    { color: '#262624', bg: '#EDEDED',                label: 'Asignado'    },
    EN_PROCESO:  { color: '#B8860B', bg: 'rgba(255,186,46,0.16)',  label: 'En proceso'  },
    RESUELTO:    { color: '#1E8A34', bg: 'rgba(43,200,66,0.14)',   label: 'Resuelto'    },
    CERRADO:     { color: '#1E8A34', bg: 'rgba(43,200,66,0.14)',   label: 'Cerrado'     },
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-gotham text-2xl text-neutral-900 mb-1">Mis reportes</h1>
          <p className="text-sm text-neutral-400">Historial de problemas reportados</p>
        </div>
        <Link href={`/${params.coto}/vecino/tickets/nuevo`} className="btn-primary text-sm py-2.5 px-5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Nuevo reporte
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-400 text-sm">No has creado ningún reporte aún.</p>
            <Link href={`/${params.coto}/vecino/tickets/nuevo`} className="mt-3 text-sm text-red hover:underline block">Crear tu primer reporte →</Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {tickets.map((ticket) => {
              const st = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.NUEVO
              return (
                <div key={ticket.id} className="px-6 py-4 hover:bg-neutral-100/60 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-neutral-400">#{ticket.folio}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                      </div>
                      <p className="text-sm font-medium text-neutral-900">{ticket.title}</p>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{ticket.description}</p>
                      {ticket.workOrder?.provider && <p className="text-xs text-neutral-800 mt-1">Atendiendo: {ticket.workOrder.provider.name}</p>}
                      {ticket.workOrder?.afterPhotoUrl && <p className="text-xs mt-1" style={{ color: '#1E8A34' }}>✓ Trabajo completado con evidencia fotográfica</p>}
                    </div>
                    <p className="text-xs text-neutral-400 flex-shrink-0">{new Date(ticket.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}