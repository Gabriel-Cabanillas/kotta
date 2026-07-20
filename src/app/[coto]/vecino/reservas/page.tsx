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
    // Ocupación de TODAS las amenidades del coto (no solo las del vecino actual),
    // para poder marcar fechas/horarios ya tomados. Solo campos necesarios,
    // sin exponer qué vecino hizo cada reserva.
    prisma.amenityReservation.findMany({
      where: {
        amenity: { orgId: user.orgId! },
        date: { gte: now },
        status: { in: ['PENDIENTE', 'CONFIRMADA'] },
      },
      select: { amenityId: true, date: true, startTime: true, endTime: true },
    }),
  ])

  // Decimal de Prisma no es serializable a Client Components: se convierte a number plano
  const amenidadesSerializadas = amenidades.map((a) => ({
    ...a,
    extraCost: a.extraCost ? Number(a.extraCost) : null,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Reservas</h1>
        <p className="text-sm text-[#6B7A99]">Áreas comunes disponibles para reservar</p>
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