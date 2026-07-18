/**
 * Fallback de carga a nivel de ruta para /[coto]/admin/usuarios.
 * Cubre navegacion directa, refresh o primera entrada a la seccion.
 */
import UsuariosListSkeleton from '@/components/admin/UsuariosListSkeleton'

export default function UsuariosLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-32 rounded bg-[#E2E8F0] mb-2" />
        <div className="h-4 w-72 rounded bg-[#EDEDED]" />
      </div>
      <UsuariosListSkeleton />
    </div>
  )
}