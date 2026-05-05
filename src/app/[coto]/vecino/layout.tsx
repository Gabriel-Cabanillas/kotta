import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import VecinoNavbar from '@/components/vecino/VecinoNavbar'

export default async function VecinoLayout({
  children, params,
}: { children: React.ReactNode; params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'VECINO') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <VecinoNavbar user={user as any} orgName={user.org?.name ?? ''} coto={params.coto} />
      <main className="container-kotta py-8">{children}</main>
    </div>
  )
}