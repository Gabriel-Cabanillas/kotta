/**
 * Renderiza la pantalla de inicio de sesión de Kotta.
 *
 * Contiene el formulario cliente para capturar correo y contraseña, validar los
 * campos mínimos y solicitar a la API el envío de un código de verificación de
 * login antes de entrar al dashboard.
 *
 * Se relaciona con `src/app/api/auth/login/route.ts`, `src/app/verificar/page.tsx`
 * y `src/app/dashboard/page.tsx`, que completa la verificación y redirige por rol.
 *
 * Existe para separar la captura inicial de credenciales del segundo paso de
 * autenticación usado por Kotta.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm] = useState({
    email:    '',
    password: '',
  })

  const handleSubmit = async () => {
    setError('')

    if (!form.email || !form.password) {
      setError('Correo y contraseña son requeridos')
      return
    }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión')
        return
      }

      router.push(`/verificar?email=${encodeURIComponent(form.email)}&tipo=LOGIN`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#1E3A5F] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h13" stroke="#4FA8E8" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="19" cy="18" r="3.5" fill="#4FA8E8"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl text-[#0F1F34]">Bienvenido a KOTTA</h1>
          <p className="text-sm text-[#6B7A99] mt-1">Ingresa a tu panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">

          {error && (
            <div className="bg-[#FEECEA] border border-[#FACAC3] rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-[#E8503A]">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#6B7A99] mb-1.5 block">
                Correo electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="tu@correo.com"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full text-sm border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#6B7A99] mb-1.5 block">
                Contraseña
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Tu contraseña"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full text-sm border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE] transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full justify-center py-3.5 mt-6 text-base disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Continuar'}
            {!loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          <div className="bg-[#E8F4FD] rounded-xl px-4 py-3 mt-4">
            <p className="text-xs text-[#185FA5]">
              Recibirás un código de verificación en tu correo para confirmar tu identidad.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-[#6B7A99] mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/sign-up" className="text-[#4FA8E8] hover:underline font-medium">
            Registrar condominio
          </Link>
        </p>
      </div>
    </div>
  )
}
