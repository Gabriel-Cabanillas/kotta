import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ReservasForm from '@/components/vecino/ReservasForm'

export default async function VecinoReservas({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'VECINO') redirect('/dashboard')

  const now = new Date()
  const [amenidades, misReservas, ocupadas] = await Promise.all([
    prisma.amenity.findMany({ where: { orgId: user.orgId!, status: 'ACTIVA' }, orderBy: { name: 'asc' } }),
    prisma.amenityReservation.findMany({
      where: { userId: user.id, date: { gte: now } }, orderBy: { date: 'asc' }, include: { amenity: true },
    }),
    prisma.amenityReservation.findMany({
      where: {
        amenity: { orgId: user.orgId! },
        date: { gte: now },
        status: { in: ['PENDIENTE', 'CONFIRMADA'] },
      },
      select: { amenityId: true, date: true, startTime: true, endTime: true },
    }),
  ])

  const amenidadesSerializadas = amenidades.map((a) => ({
    ...a,
    extraCost: a.extraCost ? Number(a.extraCost) : null,
  }))

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-gotham text-2xl text-neutral-900 mb-1">Reservas</h1>
        <p className="text-sm text-neutral-400">Áreas comunes disponibles para reservar</p>
      </div>
      <ReservasForm
        amenidades={amenidadesSerializadas}
        misReservas={misReservas as any}
        ocupadas={ocupadas}
        userId={user.id}
      />
    </div>
  )
}