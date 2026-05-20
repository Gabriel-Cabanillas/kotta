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

      router.push(`/verificar?email=${encodeURIComponent(form.email)}&tipo=REGISTRO`)
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
          <h1 className="font-display text-2xl text-[#0F1F34]">Registrar condominio</h1>
          <p className="text-sm text-[#6B7A99] mt-1">Crea tu cuenta de administrador</p>
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
                Nombre del condominio
              </label>
              <input
                type="text"
                value={form.nombreCoto}
                onChange={(e) => setForm((f) => ({ ...f, nombreCoto: e.target.value }))}
                placeholder="Ej. Residencial Los Pinos"
                className="w-full text-sm border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#6B7A99] mb-1.5 block">
                Correo del administrador
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="admin@ejemplo.com"
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

            {/* Indicador de seguridad */}
            {form.password.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {[
                    form.password.length >= 8,
                    /[A-Z]/.test(form.password),
                    /[0-9]/.test(form.password),
                    /[^A-Za-z0-9]/.test(form.password),
                  ].map((cumple, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-colors"
                      style={{
                        background: cumple ? '#1DB87E' : '#E2E8F0',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#6B7A99]">
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
            className="btn-primary w-full justify-center py-3.5 mt-6 text-base disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta y continuar'}
            {!loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          <div className="bg-[#E8F4FD] rounded-xl px-4 py-3 mt-4">
            <p className="text-xs text-[#185FA5]">
              Recibirás un código de 6 dígitos en tu correo para verificar tu cuenta.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-[#6B7A99] mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/sign-in" className="text-[#4FA8E8] hover:underline font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
