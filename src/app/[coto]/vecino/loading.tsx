export default function LoadingDashboard() {
  return (
    <div className="animate-pulse">
      <div className="mb-10">
        <div className="h-8 w-56 bg-neutral-100 rounded-lg mb-2" />
        <div className="h-4 w-40 bg-neutral-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[124px] bg-white rounded-2xl border border-neutral-100" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="h-64 bg-white rounded-2xl border border-neutral-100" />
        <div className="h-64 bg-white rounded-2xl border border-neutral-100" />
      </div>
    </div>
  )
}