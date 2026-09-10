/**
 * Pagina principal del proveedor asignado a un coto dentro de Kotta.
 * Contiene el panel de ordenes activas para el rol PROVEEDOR y muestra las
 * tareas pendientes o en proceso asociadas al usuario.
 * Se relaciona con getSession, prisma, ProveedorNavbar y OrdenesProveedor;
 * [coto] representa el slug del condominio u organizacion.
 * Existe para integrar proveedores en la arquitectura multi-rol y multi-coto
 * del SaaS, validando sesion, rol y pertenencia al coto antes de listar ordenes.
 */
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProveedorNavbar from '@/components/proveedor/ProveedorNavbar'
import OrdenesProveedor from '@/components/proveedor/OrdenesProveedor'

export default async function ProveedorDashboard({
  params,
}: {
  params: { coto: string }
}) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'PROVEEDOR') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const ordenes = await (prisma as any).workOrder.findMany({
    where: {
      providerId: user.id,
      orgId: user.orgId,
      ticket: { orgId: user.orgId, reportedBy: { orgId: user.orgId } },
      status:     { in: ['PENDIENTE', 'EN_PROCESO'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      ticket: { include: { reportedBy: { select: { name: true, houseNumber: true } } } },
    },
  })

  return (
    <div className="min-h-screen bg-white">
      <ProveedorNavbar
        user={user as any}
        orgName={user.org?.name ?? ''}
        coto={params.coto}
      />
      <main className="container-kotta py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="font-gotham text-2xl text-neutral-900 tracking-tight mb-1">
            Hola, {user.name.split(' ')[0]}.
          </h1>
          <p className="text-sm text-neutral-400">
            {ordenes.length > 0
              ? `Tienes ${ordenes.length} orden${ordenes.length !== 1 ? 'es' : ''} activa${ordenes.length !== 1 ? 's' : ''}`
              : 'No tienes órdenes activas por ahora'}
          </p>
        </div>
        <OrdenesProveedor ordenes={ordenes as any} />
      </main>
    </div>
  )
}
