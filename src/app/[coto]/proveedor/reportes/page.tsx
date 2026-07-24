/**
 * Pagina de reportes mensuales del proveedor dentro de un coto de Kotta.
 * Permite al proveedor elegir un periodo y descargar un PDF con el resumen
 * de ordenes completadas e ingresos de ese mes.
 * Se relaciona con getSession, ProveedorNavbar y ReportesProveedor.
 * Existe para dar al proveedor evidencia descargable de su actividad mensual.
 */
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ProveedorNavbar from '@/components/proveedor/ProveedorNavbar'
import ReportesProveedor from '@/components/proveedor/ReportesProveedor'

export default async function ProveedorReportes({
  params,
}: {
  params: { coto: string }
}) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'PROVEEDOR') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">
      <ProveedorNavbar
        user={user as any}
        orgName={user.org?.name ?? ''}
        coto={params.coto}
      />
      <main className="container-kotta py-10">
        <div className="mb-8">
          <h1 className="font-gotham text-2xl text-neutral-900 tracking-tight mb-1">Reportes</h1>
          <p className="text-sm text-neutral-400">Descarga tu actividad mensual en PDF</p>
        </div>
        <ReportesProveedor />
      </main>
    </div>
  )
}