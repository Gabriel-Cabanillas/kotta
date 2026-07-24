export default function LoadingTickets() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-44 bg-neutral-100 rounded-lg mb-2" />
          <div className="h-4 w-56 bg-neutral-100 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-neutral-100 rounded-[0.625rem]" />
      </div>
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden divide-y divide-neutral-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="h-4 w-20 bg-neutral-100 rounded mb-2" />
            <div className="h-4 w-64 bg-neutral-100 rounded mb-2" />
            <div className="h-3 w-40 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}