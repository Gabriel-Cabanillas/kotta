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
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <p className="text-xs text-[#6B7A99]">{orgName}</p>
        <p className="text-sm font-medium text-[#0F1F34]">Panel del administrador</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1E3A5F] flex items-center justify-center">
            <span className="text-xs text-white font-medium">
              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[#0F1F34] leading-none">{user.name}</p>
            <p className="text-xs text-[#6B7A99] mt-0.5">Administrador</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-[#6B7A99] hover:text-[#E8503A] border border-[#E2E8F0] hover:border-[#E8503A] px-3 py-2 rounded-lg transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          </svg>
          Salir
        </button>
      </div>
    </header>
  )
}