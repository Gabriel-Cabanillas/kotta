import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProveedorNavbar from '@/components/proveedor/ProveedorNavbar'
import OrdenesProveedor from '@/components/proveedor/OrdenesProveedor'

export default async function ProveedorDashboard({
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
      status:     { in: ['PENDIENTE', 'EN_PROCESO'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      ticket: { include: { reportedBy: true } },
    },
  })

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <ProveedorNavbar
        user={user as any}
        orgName={user.org?.name ?? ''}
        coto={params.coto}
      />
      <main className="container-kotta py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-[#0F1F34] mb-1">
            Hola, {user.name.split(' ')[0]}.
          </h1>
          <p className="text-sm text-[#6B7A99]">
            {ordenes.length > 0
              ? `Tienes ${ordenes.length} orden${ordenes.length !== 1 ? 'es' : ''} activa${ordenes.length !== 1 ? 's' : ''}`
              : 'No tienes órdenes activas por ahora'}
          </p>
        </div>
        <OrdenesProveedor ordenes={ordenes as any} />
      </main>
    </div>
  )
}