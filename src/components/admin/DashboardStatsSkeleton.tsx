/**
 * Skeleton de las 4 tarjetas de stats del dashboard admin.
 * Fallback de Suspense mientras se resuelven los counts de Prisma.
 */
export default function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="w-9 h-9 rounded-xl bg-[#E2E8F0] mb-4" />
          <div className="h-8 w-14 rounded bg-[#E2E8F0] mb-2" />
          <div className="h-3 w-20 rounded bg-[#EDEDED] mb-1.5" />
          <div className="h-3 w-24 rounded bg-[#EDEDED]" />
        </div>
      ))}
    </div>
  )
}