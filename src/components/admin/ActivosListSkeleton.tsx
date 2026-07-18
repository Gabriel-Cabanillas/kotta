/**
 * Skeleton de carga para ActivosList.
 * Fallback de Suspense en activos/page.tsx mientras se resuelve el inventario,
 * y tambien se muestra brevemente tras cada router.refresh() (crear/editar
 * activo). Replica stats + filtros + lista para evitar salto visual.
 */
const ROW_COUNT = 6

export default function ActivosListSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <div className="h-3 w-16 rounded bg-[#EDEDED] mb-3" />
            <div className="h-8 w-10 rounded bg-[#E2E8F0]" />
          </div>
        ))}
      </div>

      {/* Filtros + botón */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['w-16', 'w-16', 'w-20', 'w-20', 'w-20'].map((w, i) => (
            <div key={i} className={`h-9 ${w} rounded-xl bg-[#E2E8F0]`} />
          ))}
        </div>
        <div className="h-9 w-36 rounded-xl bg-[#E2E8F0]" />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="divide-y divide-[#E2E8F0]">
          {Array.from({ length: ROW_COUNT }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#E2E8F0] flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-2/5 rounded bg-[#E2E8F0]" />
                  <div className="h-3 w-1/3 rounded bg-[#EDEDED]" />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="h-6 w-16 rounded-full bg-[#E2E8F0]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}