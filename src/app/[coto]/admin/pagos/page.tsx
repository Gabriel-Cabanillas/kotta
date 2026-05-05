import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PagosList from '@/components/admin/PagosList'

export default async function PagosPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const now  = new Date()
  const [pagos, vecinos] = await Promise.all([
    prisma.payment.findMany({
      where: { orgId: user.orgId! }, orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { user: true },
    }),
    prisma.user.findMany({
      where: { orgId: user.orgId!, role: 'VECINO', isActive: true }, orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Pagos</h1>
        <p className="text-sm text-[#6B7A99]">Control de cuotas mensuales y morosos</p>
      </div>
      <PagosList pagos={pagos as any} vecinos={vecinos as any} orgId={user.orgId!}
        mesActual={now.getMonth() + 1} anioActual={now.getFullYear()} />
    </div>
  )
}