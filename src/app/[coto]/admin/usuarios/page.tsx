import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import UsuariosList from '@/components/admin/UsuariosList'

export default async function UsuariosPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const orgId = user.orgId!
  const [vecinos, proveedores, guardias] = await Promise.all([
    prisma.user.findMany({ where: { orgId, role: 'VECINO' },     orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { orgId, role: 'PROVEEDOR' },  orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { orgId, role: 'GUARDIA' },    orderBy: { name: 'asc' } }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Usuarios</h1>
        <p className="text-sm text-[#6B7A99]">Vecinos, proveedores y guardias del condominio</p>
      </div>
      <UsuariosList vecinos={vecinos as any} proveedores={proveedores as any}
        guardias={guardias as any} orgId={orgId} coto={params.coto} />
    </div>
  )
}