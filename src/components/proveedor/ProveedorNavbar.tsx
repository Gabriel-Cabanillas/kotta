'use client'

/**
 * Barra de navegacion principal para el panel del proveedor.
 * Contiene los accesos a ordenes e historial, el contexto del usuario y el cierre de sesion.
 * Se relaciona con src/app/[coto]/proveedor/page.tsx,
 * src/app/[coto]/proveedor/ordenes/page.tsx, src/app/[coto]/proveedor/reportes/page.tsx
 * y el endpoint /api/auth/logout.
 * Existe dentro de Kotta para que los proveedores naveguen sus tareas asignadas
 * dentro del coto correspondiente.
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/components/lib/utils'
import NotificationBell from '@/components/notifications/NotificationBell'

const NAV_ITEMS = [
  { label: 'Mis órdenes', href: ''          },
  { label: 'Historial',   href: '/ordenes'  },
  { label: 'Pagos recibidos', href: '/pagos' },
  { label: 'Reportes',    href: '/reportes' },
  {label: 'Configuración', href: '/configuracion'}
]

export default function ProveedorNavbar({
  user,
  orgName,
  coto,
}: {
  user: { name: string }
  orgName: string
  coto: string
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const base     = `/${coto}/proveedor`

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/sign-in')
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
      <div className="container-kotta">
        <div className="flex items-center justify-between h-16">

          {/* Marca */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-[0.16em] text-neutral-400 uppercase leading-none">
                Kotta
              </p>
              <p className="text-sm font-medium text-neutral-900 leading-none mt-1.5">
                {orgName}
              </p>
            </div>
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const href     = `${base}${item.href}`
              const isActive = item.href === ''
                ? pathname === base
                : pathname.startsWith(href)
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'text-neutral-900'
                      : 'text-neutral-400 hover:text-neutral-900'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute left-4 right-4 -bottom-px h-[2px] bg-red rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Usuario */}
          <div className="flex items-center gap-3">
            <NotificationBell centerHref={`${base}/notificaciones`} />
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center">
                <span className="text-[11px] font-medium text-white">{initials}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900 leading-none">{user.name}</p>
                <p className="text-[11px] text-neutral-400 mt-1">Proveedor</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-neutral-400 hover:text-red border border-neutral-100 hover:border-red/30 px-3.5 py-2 rounded-lg transition-colors duration-200"
            >
              Salir
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}
