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
      status:     { in: ['COMPLETADA', 'CANCELADA'] },
    },
    orderBy: { createdAt: 'desc' },
    include: { ticket: { include: { reportedBy: true } } },
  })

  const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    COMPLETADA: { color: '#1DB87E', bg: '#E6F9F1', label: 'Completada' },
    CANCELADA:  { color: '#E8503A', bg: '#FEECEA', label: 'Cancelada'  },
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <ProveedorNavbar
        user={user as any}
        orgName={user.org?.name ?? ''}
        coto={params.coto}
      />
      <main className="container-kotta py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Historial</h1>
          <p className="text-sm text-[#6B7A99]">Órdenes completadas y canceladas</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          {ordenes.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[#6B7A99] text-sm">No hay órdenes en el historial aún.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {ordenes.map((orden: any) => {
                const st = STATUS_CONFIG[orden.status] ?? STATUS_CONFIG.COMPLETADA
                return (
                  <div key={orden.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F9FC] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[#0F1F34]">{orden.ticket.title}</p>
                      <p className="text-xs text-[#6B7A99] mt-0.5">
                        #{orden.ticket.folio} ·{' '}
                        {new Date(orden.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                        {orden.cost && ` · $${Number(orden.cost).toLocaleString('es-MX')}`}
                      </p>
                      <p className="text-xs text-[#6B7A99] mt-0.5">
                        Reportado por: {orden.ticket.reportedBy.name}
                        {orden.ticket.reportedBy.houseNumber && ` · Casa ${orden.ticket.reportedBy.houseNumber}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {orden.afterPhotoUrl && (
                        <span className="text-xs text-[#1DB87E]">✓ Con evidencia</span>
                      )}
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ color: st.color, background: st.bg }}
                      >
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