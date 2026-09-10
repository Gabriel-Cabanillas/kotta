import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import NotificationCenter from '@/components/notifications/NotificationCenter'

export const dynamic = 'force-dynamic'

export default async function GuardiaNotificationsPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'GUARDIA' || user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-neutral-100">
      <main className="container-kotta py-10">
        <NotificationCenter
          backHref={`/${params.coto}/guardia`}
          description="Comunicados de la administración y avisos relevantes para la operación de la caseta."
        />
      </main>
    </div>
  )
}
