'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function InvitacionForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [loading, setLoading]   = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError]       = useState('')
  const [email, setEmail]       = useState('')
  const [form, setForm] = useState({
    password:        '',
    confirmPassword: '',
  })

  useEffect(() => {
    // Validar token
    const validarToken = async () => {
      try {
        const res  = await fetch(`/api/auth/invitacion/validar?token=${token}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Invitación inválida o expirada')
        } else {
          setEmail(data.email)
        }
      } finally {
        setValidating(false)
      }
    }
    if (token) validarToken()
  }, [token])

  const handleSubmit = async () => {
    setError('')

    if (!form.password || !form.confirmPassword) {
      setError('Todos los campos son requeridos')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/invitacion/activar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password: form.password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al activar cuenta')
        return
      }

      router.push(`/verificar?email=${encodeURIComponent(email)}&tipo=LOGIN`)
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <p className="text-sm text-[#6B7A99]">Validando invitación...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#1E3A5F] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h13" stroke="#4FA8E8" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="19" cy="18" r="3.5" fill="#4FA8E8"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl text-[#0F1F34]">Activa tu cuenta</h1>
          <p className="text-sm text-[#6B7A99] mt-1">Crea tu contraseña para acceder a KOTTA</p>
          {email && (
            <p className="text-sm font-medium text-[#1E3A5F] mt-1">{email}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">

          {error && (
            <div className="bg-[#FEECEA] border border-[#FACAC3] rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-[#E8503A]">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#6B7A99] mb-1.5 block">
                Contraseña
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                className="w-full text-sm border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#6B7A99] mb-1.5 block">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repite tu contraseña"
                className="w-full text-sm border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE] transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !!error}
            className="btn-primary w-full justify-center py-3.5 mt-6 text-base disabled:opacity-50"
          >
            {loading ? 'Activando...' : 'Activar cuenta'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InvitacionPage() {
  return (
    <Suspense>
      <InvitacionForm />
    </Suspense>
  )
}