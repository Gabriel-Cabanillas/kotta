export default function LoadingReservas() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="mb-6">
        <div className="h-7 w-32 bg-neutral-100 rounded-lg mb-2" />
        <div className="h-4 w-64 bg-neutral-100 rounded-lg" />
      </div>
      <div className="h-32 bg-white rounded-2xl border border-neutral-100" />
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 bg-white rounded-2xl border border-neutral-100" />
        ))}
      </div>
    </div>
  )
}