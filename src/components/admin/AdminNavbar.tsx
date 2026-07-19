/**
 * Componente de barra superior del panel administrativo de Kotta.
 * Contiene la identificacion del coto, el usuario administrador activo y la
 * accion de cierre de sesion.
 * Se relaciona con el layout de src/app/[coto]/admin y con la API
 * /api/auth/logout para cerrar la sesion del administrador.
 * Existe para mantener contexto de administracion visible en las paginas de
 * gestion de usuarios, tickets, pagos, activos, ordenes y configuracion.
 */

// Ya se rediseño
'use client'

import { useRouter } from 'next/navigation'
import { User } from '@prisma/client'

export default function AdminNavbar({
  user,
  orgName,
}: {
  user: User
  orgName: string
}) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/sign-in')
  }

  return (
    <header className="h-16 bg-white border-b border-neutral-100 flex items-center justify-between px-6 flex-shrink-0">
      {/* Identidad del coto */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-neutral-400 truncate">
            {orgName}
          </p>
          <p className="text-sm font-medium text-neutral-900 leading-tight">
            Panel del administrador
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Usuario activo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center ring-1 ring-black/[0.06]">
            <span className="text-xs text-white font-medium tracking-wide">
              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:flex flex-col gap-1 leading-none">
            <p className="text-sm font-medium text-neutral-900 leading-none">{user.name}</p>
            <span className="badge badge-dark w-fit">Administrador</span>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-neutral-100" />

        {/* Cerrar sesion */}
        <button
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="group flex items-center gap-2 text-xs font-medium text-neutral-400
                     border border-neutral-100 px-3 py-2 rounded-[0.625rem]
                     transition-all duration-200 ease-in-out
                     hover:text-red hover:border-red/25 hover:bg-red/[0.04]"
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            className="transition-transform duration-200 ease-in-out group-hover:translate-x-0.5"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          </svg>
          <span className="hidden md:inline">Salir</span>
        </button>
      </div>
    </header>
  )
}