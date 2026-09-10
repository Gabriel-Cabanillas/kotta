import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import UsuariosList from '@/components/admin/UsuariosList'
import UsuariosListSkeleton from '@/components/admin/UsuariosListSkeleton'

export default async function UsuariosPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Usuarios</h1>
        <p className="text-sm text-[#6B7A99]">Vecinos, proveedores y guardias del condominio</p>
      </div>

      <Suspense fallback={<UsuariosListSkeleton />}>
        <UsuariosData orgId={user.orgId!} coto={params.coto} />
      </Suspense>
    </div>
  )
}

async function UsuariosData({ orgId, coto }: { orgId: string; coto: string }) {
  const select = { id: true, name: true, email: true, phone: true, houseNumber: true, isActive: true, role: true } as const
  const [vecinos, proveedores, guardias] = await Promise.all([
    prisma.user.findMany({ where: { orgId, role: 'VECINO' },    select, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { orgId, role: 'PROVEEDOR' }, select, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { orgId, role: 'GUARDIA' },   select, orderBy: { name: 'asc' } }),
  ])

  // Estado de cuenta bancaria (Stripe) de cada proveedor de este coto.
  // Se arma como Record<proveedorId, estado> para que UsuariosList lo
  // consuma directo por índice, sin tener que buscar en un arreglo.
  const cuentasConectadas = await prisma.cuentaConectada.findMany({
    where: { proveedorId: { in: proveedores.map((p) => p.id) } },
    select: { proveedorId: true, payoutsEnabled: true, detailsSubmitted: true },
  })

  const cuentasPago = Object.fromEntries(
    cuentasConectadas
      .filter((c) => c.proveedorId !== null)
      .map((c) => [c.proveedorId as string, { payoutsEnabled: c.payoutsEnabled, detailsSubmitted: c.detailsSubmitted }])
  )

  return (
    <UsuariosList
      vecinos={vecinos as any}
      proveedores={proveedores as any}
      guardias={guardias as any}
      orgId={orgId}
      coto={coto}
      cuentasPago={cuentasPago}
    />
  )
}
