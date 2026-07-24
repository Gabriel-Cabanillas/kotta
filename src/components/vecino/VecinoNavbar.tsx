'use client'

/**
 * Barra de navegacion principal para el panel del vecino.
 * Contiene los enlaces de seccion, el estado del menu movil y la accion de cierre de sesion.
 * Se relaciona con src/app/[coto]/vecino/layout.tsx, las paginas bajo src/app/[coto]/vecino
 * y el endpoint /api/auth/logout.
 * Existe dentro de Kotta para dar al residente una entrada consistente a sus tickets,
 * pagos y reservas dentro del coto activo.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { cn } from '@/components/lib/utils'
import Image from 'next/image'

const NAV_ITEMS = [
  { label: 'Inicio',      href: ''         },
  { label: 'Mis tickets', href: '/tickets' },
  { label: 'Mis pagos',   href: '/pagos'   },
  { label: 'Reservas',    href: '/reservas' },
]

export default function VecinoNavbar({
  user, orgName, coto,
}: {
  user: { name: string; houseNumber: string | null }
  orgName: string
  coto: string
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const base     = `/${coto}/vecino`
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/sign-in')
  }

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-40">
      <div className="container-kotta">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <Image
              src="/LogoKnegro.svg"
              alt="Kotta"
              width={36}
              height={36}
              className="flex-shrink-0"
              priority
            />
            <div>
              <p className="text-[11px] font-medium tracking-[0.08em] text-neutral-400 leading-none uppercase">KOTTA</p>
              <p className="text-sm font-medium text-neutral-900 leading-none mt-1">{orgName}</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const href     = `${base}${item.href}`
              const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
              return (
                <Link key={item.href} href={href}
                  className={cn('px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive ? 'bg-black text-white' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
                  )}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-neutral-900 leading-none">{user.name}</p>
              {user.houseNumber && <p className="text-xs text-neutral-400 mt-1">Casa {user.houseNumber}</p>}
            </div>
            <button onClick={handleLogout}
              className="text-xs font-medium text-neutral-400 hover:text-red border border-neutral-100 hover:border-red/30 hover:bg-red/5 px-3 py-2 rounded-lg transition-all duration-200">
              Salir
            </button>
            <button className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all" onClick={() => setOpen(!open)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-neutral-100 py-3 flex flex-col gap-1 animate-fade-in">
            {NAV_ITEMS.map((item) => {
              const href     = `${base}${item.href}`
              const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
              return (
                <Link key={item.href} href={href} onClick={() => setOpen(false)}
                  className={cn('px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive ? 'bg-black text-white' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
                  )}>
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}