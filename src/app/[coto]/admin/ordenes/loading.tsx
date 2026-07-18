/**
 * Fallback de carga a nivel de ruta para /[coto]/admin/ordenes.
 * Cubre navegacion directa, refresh o primera entrada a la seccion.
 */
import OrdenesListSkeleton from '@/components/admin/OrdenesListSkeleton'

export default function OrdenesLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-56 rounded bg-[#E2E8F0] mb-2" />
        <div className="h-4 w-80 rounded bg-[#EDEDED]" />
      </div>
      <OrdenesListSkeleton />
    </div>
  )
}