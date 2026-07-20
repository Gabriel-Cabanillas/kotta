import AmenidadesListSkeleton from '@/components/admin/AmenidadesListSkeleton'

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Amenidades</h1>
        <p className="text-sm text-[#6B7A99]">Catálogo de amenidades reservables por los vecinos</p>
      </div>
      <AmenidadesListSkeleton />
    </div>
  )
}