/** Acción local de cierre de sesión para la vista interna de Kotta. */
'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function KottaStaffLogout() {
  const router = useRouter()
  const [cerrando, setCerrando] = useState(false)

  const handleLogout = async () => {
    setCerrando(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/sign-in')
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={cerrando}
      className="btn-ghost px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Cerrar sesión"
    >
      {cerrando ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Cerrando...</> : <><LogOut className="h-3.5 w-3.5" />Cerrar sesión</>}
    </button>
  )
}
