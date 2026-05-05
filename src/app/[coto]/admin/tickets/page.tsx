import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TicketsList from '@/components/admin/TicketsList'

export default async function TicketsPage({
  params, searchParams,
}: { params: { coto: string }; searchParams: { status?: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const orgId = user.orgId!
  const statusFilter = searchParams.status
  const where = { orgId, ...(statusFilter && statusFilter !== 'TODOS' ? { status: statusFilter as any } : {}) }

  const [tickets, proveedores, counts] = await Promise.all([
    prisma.ticket.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { reportedBy: true, workOrder: { include: { provider: true } } },
    }),
    prisma.user.findMany({ where: { orgId, role: 'PROVEEDOR', isActive: true }, orderBy: { name: 'asc' } }),
    prisma.ticket.groupBy({ by: ['status'], where: { orgId }, _count: true }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Tickets</h1>
        <p className="text-sm text-[#6B7A99]">Reportes de vecinos y su estado actual</p>
      </div>
      <TicketsList tickets={tickets as any} proveedores={proveedores as any}
        counts={counts as any} coto={params.coto} currentStatus={statusFilter ?? 'TODOS'} />
    </div>
  )
}