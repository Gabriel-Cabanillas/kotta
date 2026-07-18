import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ActivosList from '@/components/admin/ActivosList'
import ActivosListSkeleton from '@/components/admin/ActivosListSkeleton'

export default async function ActivosPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Activos</h1>
        <p className="text-sm text-[#6B7A99]">Inventario y mantenimiento de equipos e instalaciones</p>
      </div>

      <Suspense fallback={<ActivosListSkeleton />}>
        <ActivosData orgId={user.orgId!} />
      </Suspense>
    </div>
  )
}

async function ActivosData({ orgId }: { orgId: string }) {
  const activos = await prisma.asset.findMany({
    where: { orgId }, orderBy: { createdAt: 'desc' },
  })

  return <ActivosList activos={activos as any} orgId={orgId} />
}