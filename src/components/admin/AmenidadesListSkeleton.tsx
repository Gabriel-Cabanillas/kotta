/**
 * Skeleton de carga para el panel de Amenidades del admin.
 * Se muestra mientras se resuelve la consulta a Prisma en el server component.
 * Se relaciona con AmenidadesList y app/[coto]/admin/amenidades/page.tsx.
 */
export default function AmenidadesListSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-5 w-32 bg-neutral-100 rounded-md animate-pulse mb-2" />
          <div className="h-3 w-56 bg-neutral-100 rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-neutral-100 rounded-[0.625rem] animate-pulse" />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="divide-y divide-neutral-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-neutral-100 animate-pulse flex-shrink-0" />
                <div>
                  <div className="h-3.5 w-36 bg-neutral-100 rounded-md animate-pulse mb-2" />
                  <div className="h-3 w-48 bg-neutral-100 rounded-md animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-20 bg-neutral-100 rounded-full animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}