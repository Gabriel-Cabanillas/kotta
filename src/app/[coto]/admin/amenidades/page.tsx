import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AmenidadesPanel from '@/components/admin/AmenidadesPanel'
import AmenidadesListSkeleton from '@/components/admin/AmenidadesListSkeleton'

export default async function AmenidadesPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Amenidades</h1>
        <p className="text-sm text-[#6B7A99]">Catálogo y solicitudes de reserva de los vecinos</p>
      </div>

      <Suspense fallback={<AmenidadesListSkeleton />}>
        <AmenidadesData orgId={user.orgId!} coto={params.coto} />
      </Suspense>
    </div>
  )
}

async function AmenidadesData({ orgId, coto }: { orgId: string; coto: string }) {
  const [amenidades, reservaciones] = await Promise.all([
    prisma.amenity.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.amenityReservation.findMany({
      where: { amenity: { orgId } },
      orderBy: [{ status: 'asc' }, { date: 'asc' }],
      include: {
        amenity: { select: { name: true } },
        user: { select: { name: true, houseNumber: true } },
      },
    }),
  ])

  // Decimal de Prisma no es serializable a Client Components: se convierte a number plano
  const amenidadesSerializadas = amenidades.map((a) => ({
    ...a,
    extraCost: a.extraCost ? Number(a.extraCost) : null,
  }))

  return (
    <AmenidadesPanel
      amenidades={amenidadesSerializadas}
      reservaciones={reservaciones}
      coto={coto}
    />
  )
}