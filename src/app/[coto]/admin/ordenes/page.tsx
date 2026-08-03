import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OrdenesList from '@/components/admin/OrdenesList'
import OrdenesListSkeleton from '@/components/admin/OrdenesListSkeleton'

export default async function OrdenesPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Órdenes de trabajo</h1>
        <p className="text-sm text-[#6B7A99]">Seguimiento de trabajos asignados a proveedores</p>
      </div>

      <Suspense fallback={<OrdenesListSkeleton />}>
        <OrdenesData orgId={user.orgId!} coto={params.coto} />
      </Suspense>
    </div>
  )
}

async function OrdenesData({ orgId, coto }: { orgId: string; coto: string }) {
  const ordenes = await prisma.workOrder.findMany({
    where: { orgId }, orderBy: { createdAt: 'desc' },
    include: {
      ticket: { include: { reportedBy: true } },
      provider: {
        include: {
          cuentaConectada: {
            select: { payoutsEnabled: true },
          },
        },
      },
      distribucionesPago: {
        where: { destino: 'PROVEEDOR' },
        select: { estado: true },
        take: 1,
      },
    },
  })

  return <OrdenesList ordenes={ordenes as any} coto={coto} />
}
