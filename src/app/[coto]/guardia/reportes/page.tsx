/**
 * Pagina de reportes del panel de guardia dentro de un coto en Kotta.
 * Permite descargar la bitacora de accesos de cualquier fecha en PDF.
 */
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ReportesPanel from '@/components/guardia/ReportesPanel'

export default async function GuardiaReportesPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'GUARDIA') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white-100">
      <div className="container-kotta py-10">
        <ReportesPanel
          userName={user.name}
          orgName={user.org?.name ?? ''}
          cotoSlug={params.coto}
        />
      </div>
    </div>
  )
}