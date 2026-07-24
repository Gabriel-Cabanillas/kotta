'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AccessLog, VisitorType } from '@prisma/client'
import { VISITOR_TYPES, VISITOR_LABELS } from '@/lib/constants/visitorTypes'

type AccessLogWithGuard = AccessLog & {
  guard: { name: string }
}

type GuardiaPanelProps = {
  userName: string
  orgName: string
  cotoSlug: string
  accessLogs: AccessLogWithGuard[]
}

function formatTime(value: Date | string | null) {
  if (!value) return 'Pendiente'

  return new Date(value).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function GuardiaPanel({
  userName,
  orgName,
  cotoSlug,
  accessLogs,
}: GuardiaPanelProps) {
  const router = useRouter()
  const [visitorName, setVisitorName] = useState('')
  const [visitorType, setVisitorType] = useState<VisitorType>('VISITA')
  const [notes, setNotes] = useState('')
  const [loadingEntry, setLoadingEntry] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const peopleInside = useMemo(
    () => accessLogs.filter((accessLog) => !accessLog.exitTime).length,
    [accessLogs]
  )

  const handleCreateEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = visitorName.trim()
    if (!cleanName) return

    setLoadingEntry(true)
    setError(null)

    try {
      const res = await fetch('/api/accesos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: cleanName,
          visitorType,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'No se pudo registrar la entrada')
      }

      setVisitorName('')
      setVisitorType('VISITA')
      setNotes('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la entrada')
    } finally {
      setLoadingEntry(false)
    }
  }

  const handleCloseAccess = async (accessLogId: string) => {
    setClosingId(accessLogId)
    setError(null)

    try {
      const res = await fetch('/api/accesos/salida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessLogId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'No se pudo registrar la salida')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la salida')
    } finally {
      setClosingId(null)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'No se pudo cerrar sesion')
      }

      router.push('/sign-in')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar sesion')
      setLoggingOut(false)
    }
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-start justify-between gap-4 mb-10 animate-fade-up"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-0.5">
              {orgName}
            </p>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Bitácora del día
            </h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Guardia: <span className="text-neutral-800">{userName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${cotoSlug}/guardia/reportes`}
            className="btn-ghost text-xs py-2 px-3.5"
          >
            Ver reportes
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn-ghost text-xs py-2 px-3.5 disabled:opacity-50"
          >
            {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 animate-fade-up"
        style={{ animationDelay: '80ms' }}
      >
        <div className="card p-6">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
            Accesos del día
          </p>
          <p className="text-4xl font-semibold text-neutral-900 tabular-nums">
            {accessLogs.length}
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Personas dentro
            </p>
            {peopleInside > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse-slow" />
            )}
          </div>
          <p className="text-4xl font-semibold text-neutral-900 tabular-nums">
            {peopleInside}
          </p>
        </div>
      </div>

      {/* ── Formulario ─────────────────────────────────────── */}
      <form
        onSubmit={handleCreateEntry}
        className="card mb-6 animate-fade-up"
        style={{ animationDelay: '140ms' }}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-base font-semibold text-neutral-900">
            Registrar entrada
          </h2>
          {error && <p className="text-xs font-medium text-red">{error}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
              Nombre *
            </label>
            <input
              type="text"
              value={visitorName}
              onChange={(event) => setVisitorName(event.target.value)}
              placeholder="Nombre del visitante"
              className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
              Tipo
            </label>
            <select
              value={visitorType}
              onChange={(event) => setVisitorType(event.target.value as VisitorType)}
              className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
            >
              {VISITOR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {VISITOR_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
              Notas
            </label>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Opcional"
              className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={!visitorName.trim() || loadingEntry}
            className="btn-primary text-sm py-2.5 px-5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingEntry ? 'Registrando...' : 'Registrar entrada'}
          </button>
        </div>
      </form>

      {/* ── Tabla de accesos ───────────────────────────────── */}
      <div
        className="card p-0 overflow-hidden animate-fade-up"
        style={{ animationDelay: '200ms' }}
      >
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-900">
            Accesos de hoy
          </h2>
        </div>

        {accessLogs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-neutral-400">
              No hay accesos registrados hoy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100/60 text-xs text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium px-6 py-3">Nombre</th>
                  <th className="text-left font-medium px-6 py-3">Tipo</th>
                  <th className="text-left font-medium px-6 py-3">Entrada</th>
                  <th className="text-left font-medium px-6 py-3">Salida</th>
                  <th className="text-left font-medium px-6 py-3">Notas</th>
                  <th className="text-right font-medium px-6 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {accessLogs.map((accessLog) => (
                  <tr key={accessLog.id} className="hover:bg-neutral-100/40 transition-colors">
                    <td className="px-6 py-4 text-neutral-900 font-medium">
                      {accessLog.visitorName}
                    </td>
                    <td className="px-6 py-4 text-neutral-800">
                      {VISITOR_LABELS[accessLog.visitorType]}
                    </td>
                    <td className="px-6 py-4 text-neutral-800 tabular-nums">
                      {formatTime(accessLog.entryTime)}
                    </td>
                    <td className="px-6 py-4">
                      {accessLog.exitTime ? (
                        <span className="text-neutral-800 tabular-nums">
                          {formatTime(accessLog.exitTime)}
                        </span>
                      ) : (
                        <span className="badge bg-red/10 text-red gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse-slow" />
                          Dentro
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 max-w-xs truncate">
                      {accessLog.notes || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!accessLog.exitTime ? (
                        <button
                          type="button"
                          onClick={() => handleCloseAccess(accessLog.id)}
                          disabled={closingId === accessLog.id}
                          className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
                        >
                          {closingId === accessLog.id ? 'Registrando...' : 'Registrar salida'}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400">Cerrado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}