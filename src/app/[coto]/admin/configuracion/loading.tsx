/**
 * Fallback de carga a nivel de ruta para /[coto]/admin/configuracion.
 * ConfiguracionForm no hace ninguna consulta propia a Prisma (usa user.org de
 * la sesion), asi que este loading solo cubre el instante del chequeo de
 * sesion en navegacion directa/refresh, para consistencia con las demas
 * secciones del admin.
 */
export default function ConfiguracionLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-40 rounded bg-[#E2E8F0] mb-2" />
        <div className="h-4 w-64 rounded bg-[#EDEDED]" />
      </div>

      <div className="max-w-xl space-y-5 animate-pulse">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="h-4 w-40 rounded bg-[#E2E8F0] mb-5" />
          <div className="space-y-4">
            <div className="h-10 rounded-xl bg-[#EDEDED]" />
            <div className="h-10 rounded-xl bg-[#EDEDED]" />
            <div className="h-4 w-20 rounded bg-[#EDEDED]" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-[#E2E8F0] mt-6" />
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="h-4 w-24 rounded bg-[#E2E8F0] mb-4" />
          <div className="h-16 rounded-xl bg-[#EDEDED]" />
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="h-4 w-32 rounded bg-[#E2E8F0] mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-[#EDEDED]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}