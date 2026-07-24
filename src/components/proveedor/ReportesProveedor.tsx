'use client'

/**
 * Selector de periodo y disparador de descarga del reporte mensual del proveedor.
 * Construye la solicitud a /api/proveedor/reporte con el mes/año elegido y
 * descarga el PDF resultante en el navegador.
 * Se relaciona con src/app/[coto]/proveedor/reportes/page.tsx y
 * /api/proveedor/reporte.
 * Existe para que el proveedor obtenga evidencia descargable de su actividad
 * mensual dentro de Kotta.
 */

import { useState } from 'react'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function ReportesProveedor() {
  const now = new Date()
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [year, setYear]       = useState(now.getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)

  const handleDescargar = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/proveedor/reporte?month=${month}&year=${year}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'No se pudo generar el reporte.')
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `reporte-kotta-${year}-${String(month).padStart(2, '0')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo generar el reporte. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 max-w-md">
      <p className="text-sm font-medium text-neutral-900 mb-1">Reporte mensual</p>
      <p className="text-xs text-neutral-400 mb-5">
        Genera un PDF con el resumen de órdenes completadas e ingresos del período seleccionado.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-neutral-100 focus:border-black focus:outline-none transition-colors duration-200 bg-white"
          >
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-neutral-100 focus:border-black focus:outline-none transition-colors duration-200 bg-white"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red mb-3">{error}</p>}

      <button
        onClick={handleDescargar}
        disabled={loading}
        className="w-full py-3 text-sm font-medium text-white bg-black rounded-xl hover:bg-neutral-900 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          'Generando PDF...'
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Descargar PDF
          </>
        )}
      </button>
    </div>
  )
}