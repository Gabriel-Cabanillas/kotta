'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { cn } from '@/components/lib/utils'

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
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
      <div className="container-kotta">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h10M4 18h13" stroke="#4FA8E8" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="19" cy="18" r="3.5" fill="#4FA8E8"/>
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
              const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
              return (
                <Link key={item.href} href={href}
                  className={cn('px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive ? 'bg-[#E8F0F9] text-[#1E3A5F]' : 'text-[#4A5568] hover:text-[#1E3A5F] hover:bg-[#F7F9FC]'
                  )}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-[#0F1F34] leading-none">{user.name}</p>
              {user.houseNumber && <p className="text-xs text-[#6B7A99] mt-0.5">Casa {user.houseNumber}</p>}
            </div>
            <button onClick={handleLogout}
              className="text-xs text-[#6B7A99] hover:text-[#E8503A] border border-[#E2E8F0] hover:border-[#E8503A] px-3 py-2 rounded-lg transition-all">
              Salir
            </button>
            <button className="md:hidden p-2 rounded-lg text-[#4A5568]" onClick={() => setOpen(!open)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-[#E2E8F0] py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={`${base}${item.href}`} onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm text-[#4A5568] hover:text-[#1E3A5F] hover:bg-[#F7F9FC] rounded-lg transition-all">
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}