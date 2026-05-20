/**
 * Renderiza el segundo paso de autenticación por código en Kotta.
 *
 * Contiene la captura del código de seis dígitos, el autoenvío cuando se completa
 * y la llamada a la API que valida el código para crear la sesión del usuario.
 *
 * Se relaciona con `src/app/sign-in/page.tsx`, `src/app/sign-up/page.tsx`,
 * `src/app/api/auth/verificar/route.ts` y `src/app/dashboard/page.tsx`.
 *
 * Existe para unificar la verificación de identidad después de login o registro
 * antes de permitir el acceso a las áreas privadas.
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerificarForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const email        = searchParams.get('email') ?? ''
  const tipo         = searchParams.get('tipo') ?? 'LOGIN'

  const [codigo, setCodigo] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [reenvioTimer, setReenvioTimer] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
    const timer = setInterval(() => {
      setReenvioTimer((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const nuevo = [...codigo]
    nuevo[index] = value.slice(-1)
    setCodigo(nuevo)
    if (value && index < 5) {
      inputs.current[index + 1]?.focus()
    }
    // Auto-submit cuando se completan los 6 dígitos
    if (nuevo.every((d) => d !== '') && nuevo[index] !== '') {
      handleVerificar(nuevo.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codigo[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCodigo(pasted.split(''))
      handleVerificar(pasted)
    }
  }

  const handleVerificar = async (codigoStr?: string) => {
    const code = codigoStr ?? codigo.join('')
    if (code.length !== 6) return

    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/verificar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, codigo: code, tipo }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Código inválido')
        setCodigo(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
        return
      }

      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleReenviar = async () => {
    if (reenvioTimer > 0) return
    const endpoint = tipo === 'REGISTRO' ? '/api/auth/registro/reenviar' : '/api/auth/login/reenviar'
    setReenvioTimer(60)
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
          <h1 className="font-display text-2xl text-[#0F1F34]">Verifica tu identidad</h1>
          <p className="text-sm text-[#6B7A99] mt-1">
            Enviamos un código de 6 dígitos a
          </p>
          <p className="text-sm font-medium text-[#1E3A5F] mt-0.5">{email}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">

          {error && (
            <div className="bg-[#FEECEA] border border-[#FACAC3] rounded-xl px-4 py-3 mb-6">
              <p className="text-sm text-[#E8503A]">{error}</p>
            </div>
          )}

          {/* Inputs del código */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {codigo.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all focus:outline-none ${
                  digit
                    ? 'border-[#1E3A5F] bg-[#E8F0F9] text-[#1E3A5F]'
                    : 'border-[#E2E8F0] bg-white text-[#0F1F34] focus:border-[#4FA8E8]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => handleVerificar()}
            disabled={loading || codigo.some((d) => d === '')}
            className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar código'}
          </button>

          <div className="text-center mt-5">
            {reenvioTimer > 0 ? (
              <p className="text-sm text-[#6B7A99]">
                Reenviar código en <span className="font-medium text-[#1E3A5F]">{reenvioTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleReenviar}
                className="text-sm text-[#4FA8E8] hover:underline font-medium"
              >
                Reenviar código
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#6B7A99] mt-6">
          Revisa tu carpeta de spam si no ves el correo.
        </p>
      </div>
    </div>
  )
}

export default function VerificarPage() {
  return (
    <Suspense>
      <VerificarForm />
    </Suspense>
  )
}
