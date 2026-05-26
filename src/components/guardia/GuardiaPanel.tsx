'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AccessLog, VisitorType } from '@prisma/client'

type AccessLogWithGuard = AccessLog & {
  guard: { name: string }
}

type GuardiaPanelProps = {
  userName: string
  orgName: string
  accessLogs: AccessLogWithGuard[]
}

const VISITOR_TYPES: VisitorType[] = ['VISITA', 'PROVEEDOR', 'DELIVERY', 'OTRO']

const VISITOR_LABELS: Record<VisitorType, string> = {
  PROVEEDOR: 'Proveedor',
  VISITA: 'Visita',
  DELIVERY: 'Delivery',
  OTRO: 'Otro',
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
      <div className="flex items-start justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6B7A99] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs text-[#6B7A99]">{orgName}</p>
            <h1 className="font-display text-xl text-[#0F1F34]">
              Bitacora del dia
            </h1>
            <p className="text-sm text-[#6B7A99]">Guardia: {userName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-xs text-[#0F1F34] border border-[#E2E8F0] bg-white hover:border-[#C5D5EE] px-3 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          {loggingOut ? 'Cerrando...' : 'Cerrar sesion'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#6B7A99] mb-2">Accesos del dia</p>
          <p className="font-display text-3xl text-[#0F1F34]">{accessLogs.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#6B7A99] mb-2">Personas dentro</p>
          <p className="font-display text-3xl text-[#1DB87E]">{peopleInside}</p>
        </div>
      </div>

      <form
        onSubmit={handleCreateEntry}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-5 mb-6"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-medium text-[#0F1F34]">Registrar entrada</h2>
          {error && <p className="text-xs text-[#E8503A]">{error}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-[#6B7A99] mb-1.5 block">
              Nombre *
            </label>
            <input
              type="text"
              value={visitorName}
              onChange={(event) => setVisitorName(event.target.value)}
              placeholder="Nombre del visitante"
              className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
            />
          </div>

          <div>
            <label className="text-xs text-[#6B7A99] mb-1.5 block">
              Tipo
            </label>
            <select
              value={visitorType}
              onChange={(event) => setVisitorType(event.target.value as VisitorType)}
              className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
            >
              {VISITOR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {VISITOR_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[#6B7A99] mb-1.5 block">
              Notas
            </label>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Opcional"
              className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!visitorName.trim() || loadingEntry}
            className="btn-primary text-sm py-2.5 px-5 disabled:opacity-50"
          >
            {loadingEntry ? 'Registrando...' : 'Registrar entrada'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="font-medium text-[#0F1F34]">Accesos de hoy</h2>
        </div>

        {accessLogs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[#6B7A99]">No hay accesos registrados hoy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F9FC] text-xs text-[#6B7A99]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Nombre</th>
                  <th className="text-left font-medium px-5 py-3">Tipo</th>
                  <th className="text-left font-medium px-5 py-3">Entrada</th>
                  <th className="text-left font-medium px-5 py-3">Salida</th>
                  <th className="text-left font-medium px-5 py-3">Notas</th>
                  <th className="text-right font-medium px-5 py-3">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {accessLogs.map((accessLog) => (
                  <tr key={accessLog.id} className="hover:bg-[#F7F9FC]">
                    <td className="px-5 py-4 text-[#0F1F34] font-medium">
                      {accessLog.visitorName}
                    </td>
                    <td className="px-5 py-4 text-[#4A5568]">
                      {VISITOR_LABELS[accessLog.visitorType]}
                    </td>
                    <td className="px-5 py-4 text-[#4A5568]">
                      {formatTime(accessLog.entryTime)}
                    </td>
                    <td className="px-5 py-4 text-[#4A5568]">
                      {accessLog.exitTime ? (
                        formatTime(accessLog.exitTime)
                      ) : (
                        <span className="text-[#1DB87E] font-medium">Dentro</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#6B7A99] max-w-xs truncate">
                      {accessLog.notes || '-'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!accessLog.exitTime ? (
                        <button
                          type="button"
                          onClick={() => handleCloseAccess(accessLog.id)}
                          disabled={closingId === accessLog.id}
                          className="text-xs text-[#0F1F34] border border-[#E2E8F0] hover:border-[#C5D5EE] px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                          {closingId === accessLog.id ? 'Registrando...' : 'Registrar salida'}
                        </button>
                      ) : (
                        <span className="text-xs text-[#6B7A99]">Cerrado</span>
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
