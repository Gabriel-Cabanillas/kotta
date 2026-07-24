export default function LoadingPagos() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-36 bg-neutral-100 rounded-lg mb-2" />
        <div className="h-4 w-52 bg-neutral-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-neutral-100" />
        ))}
      </div>
      <div className="h-72 bg-white rounded-2xl border border-neutral-100" />
    </div>
  )
}