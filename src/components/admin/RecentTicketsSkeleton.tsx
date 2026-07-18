/**
 * Skeleton del bloque "Tickets recientes" del dashboard admin.
 * Fallback de Suspense mientras se resuelve la consulta a Prisma.
 */
export default function RecentTicketsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
        <div className="h-4 w-32 rounded bg-[#E2E8F0]" />
        <div className="h-3 w-16 rounded bg-[#EDEDED]" />
      </div>
      <div className="divide-y divide-[#E2E8F0]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="h-3 w-10 rounded bg-[#EDEDED] flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-2/5 rounded bg-[#E2E8F0]" />
                <div className="h-3 w-1/3 rounded bg-[#EDEDED]" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-[#E2E8F0] flex-shrink-0 ml-4" />
          </div>
        ))}
      </div>
    </div>
  )
}