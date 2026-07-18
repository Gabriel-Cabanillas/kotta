/**
 * Skeleton de carga para TicketsList.
 * Se usa como fallback de Suspense en tickets/page.tsx mientras se resuelven
 * las consultas de tickets, proveedores y conteos. Replica la estructura de
 * tabs + lista de TicketsList para que no haya salto visual al llegar los datos.
 */
const TAB_WIDTHS = ['w-20', 'w-24', 'w-28', 'w-28', 'w-28']
const ROW_COUNT = 6

export default function TicketsListSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TAB_WIDTHS.map((w, i) => (
          <div key={i} className={`h-9 ${w} rounded-xl bg-[#E2E8F0]`} />
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="divide-y divide-[#E2E8F0]">
          {Array.from({ length: ROW_COUNT }).map((_, i) => (
            <div key={i} className="flex items-start justify-between px-6 py-4">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="h-3 w-10 rounded bg-[#EDEDED] flex-shrink-0 mt-1" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-2/5 rounded bg-[#E2E8F0]" />
                  <div className="h-3 w-3/5 rounded bg-[#EDEDED]" />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="h-3 w-10 rounded bg-[#EDEDED] hidden sm:block" />
                <div className="h-6 w-16 rounded-full bg-[#E2E8F0]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}