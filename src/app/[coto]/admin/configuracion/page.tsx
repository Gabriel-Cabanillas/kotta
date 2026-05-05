import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ConfiguracionForm from '@/components/admin/ConfiguracionForm'

export default async function ConfiguracionPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Configuración</h1>
        <p className="text-sm text-[#6B7A99]">Datos generales del condominio</p>
      </div>
      <ConfiguracionForm org={user.org as any} />
    </div>
  )
}