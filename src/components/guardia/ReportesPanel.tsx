'use client'

import { useState } from 'react'
import Link from 'next/link'
import NotificationBell from '@/components/notifications/NotificationBell'

function currentMonthISO() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

type ReportesPanelProps = {
  orgName: string
  userName: string
  cotoSlug: string
}

export default function ReportesPanel({ orgName, userName, cotoSlug }: ReportesPanelProps) {
  const [month, setMonth] = useState(currentMonthISO())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/accesos/reporte?month=${month}`)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'No se pudo generar el reporte')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bitacora-${month}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="relative z-50 mb-4 flex items-center justify-between gap-4 animate-fade-up">
        <Link
          href={`/${cotoSlug}/guardia`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Volver al panel
        </Link>
        <NotificationBell centerHref={`/${cotoSlug}/guardia/notificaciones`} />
      </div>

      <div className="flex items-center gap-4 mb-10 animate-fade-up">
        <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M14 2v6h6"
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
            Reportes de bitácora
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Guardia: <span className="text-neutral-800">{userName}</span>
          </p>
        </div>
      </div>

      <div className="card max-w-md animate-fade-up" style={{ animationDelay: '80ms' }}>
        <h2 className="text-base font-semibold text-neutral-900 mb-1">
          Descargar bitácora en PDF
        </h2>
        <p className="text-sm text-neutral-400 mb-5">
          Elige cualquier mes para generar el reporte de accesos de ese periodo.
        </p>

        <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
          Mes
        </label>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          max={currentMonthISO()}
          className="w-full text-sm border border-neutral-100 rounded-xl px-3.5 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors mb-4"
        />

        {error && <p className="text-xs font-medium text-red mb-4">{error}</p>}

        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="btn-primary text-sm py-2.5 px-5 w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>
    </div>
  )
}
