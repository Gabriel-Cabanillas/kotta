/**
 * Fallback de carga a nivel de ruta para /[coto]/admin/activos.
 * Cubre navegacion directa, refresh o primera entrada a la seccion.
 */
import ActivosListSkeleton from '@/components/admin/ActivosListSkeleton'

export default function ActivosLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-28 rounded bg-[#E2E8F0] mb-2" />
        <div className="h-4 w-72 rounded bg-[#EDEDED]" />
      </div>
      <ActivosListSkeleton />
    </div>
  )
}