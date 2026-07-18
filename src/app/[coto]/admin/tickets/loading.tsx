/**
 * Fallback de carga a nivel de ruta para /[coto]/admin/tickets.
 * Next.js lo muestra automaticamente mientras se resuelve tickets/page.tsx
 * (incluida la validacion de sesion previa al Suspense interno), cubriendo
 * la entrada por navegacion directa, refresh o primera carga del dashboard.
 */
import TicketsListSkeleton from '@/components/admin/TicketsListSkeleton'

export default function TicketsLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-32 rounded bg-[#E2E8F0] mb-2" />
        <div className="h-4 w-56 rounded bg-[#EDEDED]" />
      </div>
      <TicketsListSkeleton />
    </div>
  )
}