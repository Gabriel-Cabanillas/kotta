import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PagosList from '@/components/admin/PagosList'
import PagosListSkeleton from '@/components/admin/PagosListSkeleton'

export default async function PagosPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Pagos</h1>
        <p className="text-sm text-[#6B7A99]">Control de cuotas mensuales y morosos</p>
      </div>

      <Suspense fallback={<PagosListSkeleton />}>
        <PagosData
          orgId={user.orgId!}
        />
      </Suspense>
    </div>
  )
}

async function PagosData({
  orgId,
}: { orgId: string }) {
  const [cargos, vecinos] = await Promise.all([
    prisma.cargo.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        destinatarios: {
          include: {
            vivienda: {
              select: { id: true, name: true, houseNumber: true },
            },
          },
        },
        // Se ordenan todos los pagos del Cargo para derivar, por vivienda,
        // el intento mÃ¡s reciente. Prisma no permite correlacionar este
        // include con cada destinatario de forma dinÃ¡mica.
        pagos: {
          where: { tipoOperacion: 'CARGO' },
          orderBy: { createdAt: 'desc' },
          select: {
            vecinoId: true,
            estado: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { orgId, role: 'VECINO', isActive: true }, orderBy: { name: 'asc' },
    }),
  ])

  return (
    <PagosList
      cargos={cargos as any}
      vecinos={vecinos as any}
    />
  )
}
