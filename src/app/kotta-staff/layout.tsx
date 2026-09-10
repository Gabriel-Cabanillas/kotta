import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, Scale, ShieldAlert } from 'lucide-react'
import { getSession } from '@/lib/auth'
import KottaStaffLogout from '@/components/kotta-staff/KottaStaffLogout'
import NotificationBell from '@/components/notifications/NotificationBell'

export const dynamic = 'force-dynamic'

export default async function KottaStaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'KOTTA_STAFF') redirect('/dashboard')
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <nav className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-8">
            <Link href="/kotta-staff/condominios" className="font-display text-lg text-[#0F1F34]">KOTTA <span className="text-xs font-medium tracking-widest text-[#FD5F56]">STAFF</span></Link>
            <div className="flex flex-wrap gap-1">
              <Link href="/kotta-staff/condominios" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"><Building2 className="h-4 w-4" />Condominios</Link>
              <Link href="/kotta-staff/conciliacion" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"><Scale className="h-4 w-4" />Conciliación</Link>
              <Link href="/kotta-staff/disputas" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"><ShieldAlert className="h-4 w-4" />Disputas</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell centerHref="/kotta-staff/notificaciones" />
            <span className="text-sm text-neutral-500">{user.name}</span>
            <KottaStaffLogout />
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
