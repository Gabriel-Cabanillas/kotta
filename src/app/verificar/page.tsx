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
import Image from 'next/image'

function VerificarForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const email        = searchParams.get('email') ?? ''
  const tipo         = searchParams.get('tipo') ?? 'LOGIN'
  const esRegistro   = tipo === 'REGISTRO'

  const [codigo, setCodigo] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [reenvioTimer, setReenvioTimer] = useState(60)
  const [reenviando, setReenviando] = useState(false)
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
    if (reenvioTimer > 0 || reenviando) return
    const endpoint = tipo === 'REGISTRO' ? '/api/auth/registro/reenviar' : '/api/auth/login/reenviar'
    setReenviando(true)
    setError('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setReenvioTimer(Number(res.headers.get('Retry-After')) || 60)
      if (!res.ok) { setError(data.error ?? 'No fue posible reenviar el código'); return }
      setCodigo(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } catch {
      setError('No fue posible reenviar el código. Intenta nuevamente.')
    } finally {
      setReenviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-10">
          <Image
            src="/LogoKnegro.svg"
            alt="Kotta"
            width={44}
            height={44}
            priority
            className="h-11 w-11 mb-7"
          />
          <h1 className="text-2xl font-medium text-black">
            {esRegistro ? 'Revisa tu correo' : 'Verifica tu identidad'}
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            {esRegistro
              ? 'Ingresa el código de verificación que te enviamos a'
              : 'Enviamos un código de 6 dígitos a'}
          </p>
          <p className="text-sm font-medium text-black mt-0.5">{email}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-neutral-100 p-8 sm:p-10 shadow-card">

          {error && (
            <div className="bg-red/[0.06] border border-red/20 rounded-xl px-4 py-3 mb-6">
              <p className="text-sm text-red">{error}</p>
            </div>
          )}

          {/* Inputs del código */}
          <div className="flex gap-3 justify-center mb-7" onPaste={handlePaste}>
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
                className={`w-12 h-14 text-center text-xl font-medium border-2 rounded-2xl transition-all duration-200 focus:outline-none ${
                  digit
                    ? 'border-black bg-black/[0.03] text-black'
                    : 'border-neutral-100 bg-white text-black focus:border-black'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => handleVerificar()}
            disabled={loading || codigo.some((d) => d === '')}
            className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-40"
          >
            {loading ? 'Verificando...' : 'Verificar código'}
          </button>

          <div className="text-center mt-5">
            {reenvioTimer > 0 ? (
              <p className="text-sm text-neutral-400">
                Reenviar código en <span className="font-medium text-black">{reenvioTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleReenviar}
                disabled={reenviando}
                className="text-sm text-black hover:text-red font-medium transition-colors duration-200"
              >
                Reenviar código
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
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
