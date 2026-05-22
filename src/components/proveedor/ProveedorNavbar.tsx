'use client'

/**
 * Barra de navegacion principal para el panel del proveedor.
 * Contiene los accesos a ordenes e historial, el contexto del usuario y el cierre de sesion.
 * Se relaciona con src/app/[coto]/proveedor/page.tsx,
 * src/app/[coto]/proveedor/ordenes/page.tsx y el endpoint /api/auth/logout.
 * Existe dentro de Kotta para que los proveedores naveguen sus tareas asignadas
 * dentro del coto correspondiente.
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/components/lib/utils'

const NAV_ITEMS = [
  { label: 'Mis órdenes', href: ''         },
  { label: 'Historial',   href: '/ordenes' },
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

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
      <div className="container-kotta">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1DB87E] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#6B7A99] leading-none">KOTTA</p>
              <p className="text-sm font-medium text-[#0F1F34] leading-none mt-0.5">{orgName}</p>
            </div>
          </div>

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
                    'px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-[#E6F9F1] text-[#0D7A4E]'
                      : 'text-[#4A5568] hover:text-[#1DB87E] hover:bg-[#F7F9FC]'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-[#0F1F34] leading-none">{user.name}</p>
              <p className="text-xs text-[#6B7A99] mt-0.5">Proveedor</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-[#6B7A99] hover:text-[#E8503A] border border-[#E2E8F0] hover:border-[#E8503A] px-3 py-2 rounded-lg transition-all"
            >
              Salir
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}