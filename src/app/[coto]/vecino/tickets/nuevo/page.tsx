import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import NuevoTicketForm from '@/components/vecino/NuevoTicketForm'

export default async function NuevoTicketPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'VECINO') redirect('/dashboard')

  return (
    <div className="max-w-lg animate-fade-in">
      <Link href={`/${params.coto}/vecino/tickets`} className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-900 transition-colors mb-4">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Mis reportes
      </Link>
      <div className="mb-6">
        <h1 className="font-gotham text-2xl text-neutral-900 mb-1">Nuevo reporte</h1>
        <p className="text-sm text-neutral-400">Describe el problema y el administrador lo atenderá</p>
      </div>
      <NuevoTicketForm userId={user.id} orgId={user.orgId!} coto={params.coto} houseNumber={user.houseNumber} />
    </div>
  )
}