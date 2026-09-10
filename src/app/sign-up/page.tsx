/**
 * Renderiza el registro inicial de un condominio en Kotta.
 *
 * Contiene el formulario cliente para crear una organización y su administrador,
 * validar contraseña y enviar la solicitud de registro antes de pasar al flujo de
 * verificación por código.
 *
 * Se relaciona con `src/app/api/auth/registro/route.ts`,
 * `src/app/verificar/page.tsx` y el modelo `Organization` definido en
 * `prisma/schema.prisma`.
 *
 * Existe para permitir que un nuevo coto entre al sistema con una cuenta ADMIN
 * pendiente de verificación.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function RegistroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm] = useState({
    nombreCoto:       '',
    email:            '',
    password:         '',
    confirmPassword:  '',
  })

  const handleSubmit = async () => {
    setError('')

    if (!form.nombreCoto || !form.email || !form.password || !form.confirmPassword) {
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
      const res  = await fetch('/api/auth/registro', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nombreCoto: form.nombreCoto,
          email:      form.email,
          password:   form.password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al registrar')
        return
      }

      router.replace(`/verificar?email=${encodeURIComponent(form.email)}&tipo=REGISTRO`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 bg-[radial-gradient(circle_at_1px_1px,#00000009_1px,transparent_0)] [background-size:22px_22px]">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-9 animate-fade-in">
          {/* Asunción: LogoKnegro.svg vive en /public (raíz). Ajustar width/height si el
              aspect ratio real de la marca difiere del cuadrado 48x48 usado aquí. */}
          <Image
            src="/LogoKnegro.svg"
            alt="Kotta"
            width={48}
            height={48}
            priority
            className="h-11 w-11 object-contain mb-5"
          />
          <h1 className="font-gotham text-[1.75rem] leading-none tracking-[-0.02em] text-black text-center">
            Registrar condominio
          </h1>
          <p className="text-sm text-neutral-400 mt-2 text-center">
            Crea tu cuenta de administrador
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-card animate-fade-up"
          style={{ animationDelay: '0.08s' }}
        >

          {error && (
            <div className="flex items-start gap-2.5 bg-red/5 border border-red/15 rounded-xl px-4 py-3 mb-5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="9" stroke="#FD5F56" strokeWidth="1.8"/>
                <path d="M12 8v5M12 16h.01" stroke="#FD5F56" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <p className="text-sm text-red leading-snug">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[0.6875rem] font-medium text-neutral-400 uppercase tracking-[0.06em] mb-2 block">
                Nombre del condominio
              </label>
              <input
                type="text"
                value={form.nombreCoto}
                onChange={(e) => setForm((f) => ({ ...f, nombreCoto: e.target.value }))}
                placeholder="Ej. Residencial Los Pinos"
                className="w-full text-sm border border-neutral-100 rounded-xl px-4 py-3 text-black bg-white focus:outline-none focus:border-black focus:ring-4 focus:ring-black/[0.04] placeholder:text-neutral-400/70 transition-all"
              />
            </div>

            <div>
              <label className="text-[0.6875rem] font-medium text-neutral-400 uppercase tracking-[0.06em] mb-2 block">
                Correo del administrador
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="admin@ejemplo.com"
                className="w-full text-sm border border-neutral-100 rounded-xl px-4 py-3 text-black bg-white focus:outline-none focus:border-black focus:ring-4 focus:ring-black/[0.04] placeholder:text-neutral-400/70 transition-all"
              />
            </div>

            <div>
              <label className="text-[0.6875rem] font-medium text-neutral-400 uppercase tracking-[0.06em] mb-2 block">
                Contraseña
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                className="w-full text-sm border border-neutral-100 rounded-xl px-4 py-3 text-black bg-white focus:outline-none focus:border-black focus:ring-4 focus:ring-black/[0.04] placeholder:text-neutral-400/70 transition-all"
              />
            </div>

            <div>
              <label className="text-[0.6875rem] font-medium text-neutral-400 uppercase tracking-[0.06em] mb-2 block">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repite tu contraseña"
                className="w-full text-sm border border-neutral-100 rounded-xl px-4 py-3 text-black bg-white focus:outline-none focus:border-black focus:ring-4 focus:ring-black/[0.04] placeholder:text-neutral-400/70 transition-all"
              />
            </div>

            {/* Indicador de seguridad */}
            {form.password.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  {[
                    form.password.length >= 8,
                    /[A-Z]/.test(form.password),
                    /[0-9]/.test(form.password),
                    /[^A-Za-z0-9]/.test(form.password),
                  ].map((cumple, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${
                        cumple ? 'bg-success' : 'bg-neutral-100'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-neutral-400">
                  {form.password.length < 8
                    ? 'Mínimo 8 caracteres'
                    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password)
                    ? 'Contraseña segura'
                    : 'Agrega mayúsculas y números para mayor seguridad'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="group btn-primary w-full justify-center py-3.5 mt-7 text-[0.9375rem] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta y continuar'}
            {!loading && (
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          <div className="flex items-start gap-2.5 bg-neutral-100/60 rounded-xl px-4 py-3 mt-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#A6A6A6" strokeWidth="1.6"/>
              <path d="M3 7l9 6 9-6" stroke="#A6A6A6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-xs text-neutral-800 leading-snug">
              Recibirás un código de 6 dígitos en tu correo para verificar tu cuenta.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-neutral-400 mt-7">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/sign-in"
            className="text-black font-medium underline underline-offset-4 decoration-neutral-200 hover:decoration-black transition-colors"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
