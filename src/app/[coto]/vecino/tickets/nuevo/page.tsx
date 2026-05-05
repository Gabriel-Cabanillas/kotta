import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import NuevoTicketForm from '@/components/vecino/NuevoTicketForm'

export default async function NuevoTicketPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'VECINO') redirect('/dashboard')

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Nuevo reporte</h1>
        <p className="text-sm text-[#6B7A99]">Describe el problema y el administrador lo atenderá</p>
      </div>
      <NuevoTicketForm userId={user.id} orgId={user.orgId!} coto={params.coto} houseNumber={user.houseNumber} />
    </div>
  )
}