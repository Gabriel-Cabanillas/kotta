import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminNavbar from '@/components/admin/AdminNavbar'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { coto: string }
}) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex">
      <AdminSidebar coto={params.coto} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar user={user} orgName={user.org?.name ?? ''} />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}