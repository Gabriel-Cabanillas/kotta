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
import Image from 'next/image'
import { ArrowRight, Mail } from 'lucide-react'

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
    <div className="relative min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden">
      {/* Textura de fondo sutil — profundidad sin ruido visual */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.035),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <Image
            src="/LogoKnegro.svg"
            alt="KOTTA"
            width={168}
            height={44}
            priority
            className="h-9 w-auto mx-auto mb-6"
          />
          <h1 className="font-gotham text-4xl font-medium text-black tracking-tight">
            Bienvenido a KOTTA
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Ingresa a tu panel
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-card">

          {error && (
            <div className="flex items-start gap-2.5 bg-red/[0.06] border border-red/20 rounded-xl px-4 py-3 mb-5">
              <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-red shrink-0" aria-hidden="true" />
              <p className="text-sm text-neutral-900">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-400 mb-1.5 block">
                Correo electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="tu@correo.com"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full text-sm border border-neutral-100 rounded-xl px-4 py-3 text-neutral-900 bg-white focus:outline-none focus:border-black placeholder:text-neutral-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-400 mb-1.5 block">
                Contraseña
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Tu contraseña"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full text-sm border border-neutral-100 rounded-xl px-4 py-3 text-neutral-900 bg-white focus:outline-none focus:border-black placeholder:text-neutral-400 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full justify-center py-3.5 mt-6 text-base disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Continuar'}
            {!loading && <ArrowRight size={16} strokeWidth={2} />}
          </button>

          <div className="flex items-start gap-2.5 bg-neutral-100/70 rounded-xl px-4 py-3 mt-4">
            <Mail size={14} strokeWidth={1.8} className="mt-[2px] shrink-0 text-neutral-800" />
            <p className="text-xs text-neutral-800">
              Recibirás un código de verificación en tu correo para confirmar tu identidad.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-neutral-400 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/sign-up" className="text-black hover:text-red font-medium transition-colors">
            Registrar condominio
          </Link>
        </p>
      </div>
    </div>
  )
}