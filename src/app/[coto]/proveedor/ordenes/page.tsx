import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProveedorNavbar from '@/components/proveedor/ProveedorNavbar'

export default async function ProveedorHistorial({
  params,
}: {
  params: { coto: string }
}) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'PROVEEDOR') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const ordenes = await (prisma as any).workOrder.findMany({
    where: {
      providerId: user.id,
      orgId: user.orgId,
      ticket: { orgId: user.orgId, reportedBy: { orgId: user.orgId } },
      status:     { in: ['COMPLETADA', 'CANCELADA'] },
    },
    orderBy: { createdAt: 'desc' },
    include: { ticket: { include: { reportedBy: { select: { name: true, houseNumber: true } } } } },
  })

  const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
    COMPLETADA: { color: '#1C8A38', bg: '#EAFBEE', dot: '#2BC842', label: 'Completada' },
    CANCELADA:  { color: '#C23C34', bg: '#FFF0EF', dot: '#FD5F56', label: 'Cancelada'  },
  }

  return (
    <div className="min-h-screen bg-white">
      <ProveedorNavbar
        user={user as any}
        orgName={user.org?.name ?? ''}
        coto={params.coto}
      />
      <main className="container-kotta py-10">
        <div className="mb-8">
          <h1 className="font-gotham text-2xl text-neutral-900 tracking-tight mb-1">Historial</h1>
          <p className="text-sm text-neutral-400">Órdenes completadas y canceladas</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden">
          {ordenes.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v4l3 3" stroke="#262624" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="#262624" strokeWidth="1.6" fill="none"/>
                </svg>
              </div>
              <p className="text-neutral-900 font-medium mb-1">Sin historial aún</p>
              <p className="text-sm text-neutral-400">No hay órdenes completadas ni canceladas.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {ordenes.map((orden: any) => {
                const st = STATUS_CONFIG[orden.status] ?? STATUS_CONFIG.COMPLETADA
                return (
                  <div
                    key={orden.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-neutral-100/50 transition-colors duration-200"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{orden.ticket.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        <span className="font-mono">#{orden.ticket.folio}</span> ·{' '}
                        {new Date(orden.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                        {orden.cost && (
                          <span className="text-neutral-900 font-medium">
                            {' '}· ${Number(orden.cost).toLocaleString('es-MX')}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Reportado por: {orden.ticket.reportedBy.name}
                        {orden.ticket.reportedBy.houseNumber && ` · Casa ${orden.ticket.reportedBy.houseNumber}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {orden.afterPhotoUrl && (
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="#2BC842" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Con evidencia
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                        style={{ color: st.color, background: st.bg }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
