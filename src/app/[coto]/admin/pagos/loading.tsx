/**
 * Fallback de carga a nivel de ruta para /[coto]/admin/pagos.
 * Cubre navegacion directa, refresh o primera entrada a la seccion.
 */
import PagosListSkeleton from '@/components/admin/PagosListSkeleton'

export default function PagosLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-24 rounded bg-[#E2E8F0] mb-2" />
        <div className="h-4 w-56 rounded bg-[#EDEDED]" />
      </div>
      <PagosListSkeleton />
    </div>
  )
}