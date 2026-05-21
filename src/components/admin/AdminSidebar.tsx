/**
 * Componente de navegacion lateral del panel administrativo de Kotta.
 * Contiene los accesos principales del ADMIN hacia dashboard, tickets, ordenes,
 * usuarios, activos, pagos y configuracion dentro del coto actual.
 * Se relaciona con el layout de src/app/[coto]/admin, las paginas admin por
 * seccion y las rutas construidas con el slug del coto recibido por props.
 * Existe para dar estructura persistente al panel administrativo y sostener la
 * gestion central de usuarios, tickets, pagos, activos, ordenes y configuracion.
 */
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/components/lib/utils'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      </svg>
    ),
  },
  {
    label: 'Tickets',
    href: '/tickets',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  {
    label: 'Órdenes de trabajo',
    href: '/ordenes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  {
    label: 'Usuarios',
    href: '/usuarios',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  {
    label: 'Activos',
    href: '/activos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Pagos',
    href: '/pagos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    label: 'Configuración',
    href: '/configuracion',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          stroke="currentColor" strokeWidth="1.8" fill="none"/>
      </svg>
    ),
  },
]

export default function AdminSidebar({ coto }: { coto: string }) {
  const pathname = usePathname()
  const base = `/${coto}/admin`

  return (
    <aside className="hidden md:flex flex-col w-60 bg-[#1E3A5F] min-h-screen flex-shrink-0">
      {/* Logo */}
        <div className="flex items-center pl-18 pr-5 py-5 border-b border-white/10">
        <a href="#" className="flex items-center" aria-label="KOTTA inicio">
            <img
            src="/Logocompletowhite.svg"
            alt="KOTTA"
            className="h-8 w-auto"
            />
        </a>
        </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const href = `${base}${item.href}`
          const isActive = item.href === ''
            ? pathname === base
            : pathname.startsWith(href)

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-[#8BA8C4] hover:bg-white/8 hover:text-white'
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#8BA8C4] hover:text-white hover:bg-white/8 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          </svg>
          Ir al sitio
        </Link>
      </div>
    </aside>
  )
}
