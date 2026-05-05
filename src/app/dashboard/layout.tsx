import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await getSession()
    if (!user) redirect('/sign-in')
  } catch (e) {
    console.error('Layout error:', e)
    redirect('/sign-in')
  }

  return <>{children}</>
}