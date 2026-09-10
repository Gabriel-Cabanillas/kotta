import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ProveedorNavbar from '@/components/proveedor/ProveedorNavbar'
import NotificationCenter from '@/components/notifications/NotificationCenter'

export const dynamic = 'force-dynamic'

export default async function ProveedorNotificationsPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'PROVEEDOR' || user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">
      <ProveedorNavbar user={user} orgName={user.org?.name ?? ''} coto={params.coto} />
      <main className="container-kotta py-10">
        <NotificationCenter description="Órdenes, pagos y comunicados que requieren tu atención como proveedor." />
      </main>
    </div>
  )
}
