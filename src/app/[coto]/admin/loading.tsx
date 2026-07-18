/**
 * Fallback de carga a nivel de ruta para /[coto]/admin (dashboard raiz).
 * Cubre la entrada por navegacion directa, refresh o primer login del ADMIN,
 * antes de que el page.tsx resuelva la sesion y los Suspense internos.
 */
import DashboardStatsSkeleton from '@/components/admin/DashboardStatsSkeleton'
import RecentTicketsSkeleton from '@/components/admin/RecentTicketsSkeleton'

export default function AdminDashboardLoading() {
  return (
    <div>
      <div className="mb-8 animate-pulse">
        <div className="h-7 w-64 rounded bg-[#E2E8F0] mb-2" />
        <div className="h-4 w-48 rounded bg-[#EDEDED]" />
      </div>
      <div className="mb-8">
        <DashboardStatsSkeleton />
      </div>
      <RecentTicketsSkeleton />
    </div>
  )
}