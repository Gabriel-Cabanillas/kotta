/**
 * Página de configuración del proveedor dentro de un coto de Kotta.
 * Muestra el estado de su cuenta bancaria y el formulario embebido de
 * Stripe para conectarla o editarla.
 * Se relaciona con getSession, prisma, ProveedorNavbar y ProveedorCuentaPago.
 * Existe para que el proveedor gestione sus propios datos de pago.
 */
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProveedorNavbar from '@/components/proveedor/ProveedorNavbar'
import ProveedorCuentaPago from '@/components/proveedor/ProveedorCuentaPago'

export default async function ProveedorConfiguracion({
  params,
}: {
  params: { coto: string }
}) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'PROVEEDOR') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const cuentaConectada = await prisma.cuentaConectada.findUnique({
    where: { proveedorId: user.id },
    select: { payoutsEnabled: true, detailsSubmitted: true },
  })

  return (
    <div className="min-h-screen bg-white">
      <ProveedorNavbar
        user={user as any}
        orgName={user.org?.name ?? ''}
        coto={params.coto}
      />
      <main className="container-kotta py-10">
        <div className="mb-8">
          <h1 className="font-gotham text-2xl text-neutral-900 tracking-tight mb-1">Configuración</h1>
          <p className="text-sm text-neutral-400">Gestiona tus datos de pago</p>
        </div>
        <ProveedorCuentaPago cuentaConectada={cuentaConectada} />
      </main>
    </div>
  )
}