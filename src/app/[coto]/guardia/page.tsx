/**
 * Pagina principal del panel de guardia dentro de un coto en Kotta.
 * Contiene la vista de bitacora diaria para el rol GUARDIA.
 */
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import GuardiaPanel from '@/components/guardia/GuardiaPanel'

export default async function GuardiaPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'GUARDIA') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const accessLogs = await prisma.accessLog.findMany({
    where: {
      orgId: user.orgId!,
      entryTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { entryTime: 'desc' },
    include: {
      guard: {
        select: { name: true },
      },
    },
  })

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="container-kotta py-10">
        <GuardiaPanel
          userName={user.name}
          orgName={user.org?.name ?? ''}
          accessLogs={accessLogs}
        />
      </div>
    </div>
  )
}
