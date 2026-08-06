/**
 * Selector y descarga del reporte financiero PDF para administradores.
 * La generación y los cálculos permanecen en la ruta autenticada del servidor.
 */
'use client'

import { Download, FileText, LoaderCircle } from 'lucide-react'
import { useState } from 'react'

function fechaISO(fecha: Date) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function inicioDelMesActual() {
  const hoy = new Date()
  return fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
}

export default function ReporteFinancieroDescarga() {
  const hoy = fechaISO(new Date())
  const [desde, setDesde] = useState(inicioDelMesActual)
  const [hasta, setHasta] = useState(hoy)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const descargar = async () => {
    if (desde > hasta) {
      setError('La fecha inicial no puede ser posterior a la fecha final.')
      return
    }

    setCargando(true)
    setError(null)

    try {
      const respuesta = await fetch(`/api/pagos/reporte-financiero?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`)
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null)
        throw new Error(datos?.error ?? 'No se pudo generar el reporte financiero.')
      }

      const blob = await respuesta.blob()
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `reporte-financiero-${desde}-${hasta}.pdf`
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      URL.revokeObjectURL(url)
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo generar el reporte financiero.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="mt-5 bg-white rounded-2xl border border-neutral-100 p-5" aria-labelledby="exportar-reporte-financiero">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
              <FileText className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h2 id="exportar-reporte-financiero" className="font-display text-base text-[#0F1F34]">Exportar reporte</h2>
              <p className="text-xs text-[#6B7A99] mt-0.5">Descarga el resumen, desgloses y movimientos del período elegido.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="text-xs font-medium text-neutral-500">
            Desde
            <input type="date" value={desde} max={hoy} onChange={(event) => setDesde(event.target.value)} className="mt-1.5 block w-full sm:w-36 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-black" />
          </label>
          <label className="text-xs font-medium text-neutral-500">
            Hasta
            <input type="date" value={hasta} max={hoy} onChange={(event) => setHasta(event.target.value)} className="mt-1.5 block w-full sm:w-36 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-black" />
          </label>
          <button type="button" onClick={descargar} disabled={cargando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50">
            {cargando ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {cargando ? 'Generando PDF...' : 'Exportar reporte'}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-xs font-medium text-red">{error}</p>}
    </section>
  )
}
