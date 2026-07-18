/**
 * Skeleton de carga para UsuariosList.
 * Fallback de Suspense en usuarios/page.tsx mientras se resuelven vecinos,
 * proveedores y guardias, y tambien se muestra brevemente tras cada
 * router.refresh() (crear usuario, activar/desactivar).
 */
const ROW_COUNT = 6

export default function UsuariosListSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Tabs + botón agregar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2">
          {['w-24', 'w-28', 'w-24'].map((w, i) => (
            <div key={i} className={`h-9 ${w} rounded-xl bg-[#E2E8F0]`} />
          ))}
        </div>
        <div className="h-9 w-32 rounded-xl bg-[#E2E8F0]" />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="divide-y divide-[#E2E8F0]">
          {Array.from({ length: ROW_COUNT }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#E2E8F0] flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded bg-[#E2E8F0]" />
                  <div className="h-3 w-1/2 rounded bg-[#EDEDED]" />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="h-6 w-16 rounded-full bg-[#E2E8F0]" />
                <div className="h-8 w-20 rounded-lg bg-[#E2E8F0]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}