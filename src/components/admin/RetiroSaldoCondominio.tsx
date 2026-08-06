/**
 * Formulario para que el administrador transfiera el saldo disponible de
 * plataforma a la cuenta bancaria conectada del condominio.
 */
'use client'

import { useRef, useState } from 'react'
import { Check, Landmark, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

export default function RetiroSaldoCondominio({
  saldoContable,
  disponibleAhora,
  enLiquidacion,
  cuentaLista,
}: {
  saldoContable: number
  disponibleAhora: number | null
  enLiquidacion: number | null
  cuentaLista: boolean
}) {
  const router = useRouter()
  const envioEnCursoRef = useRef(false)
  const [solicitudId, setSolicitudId] = useState(() => crypto.randomUUID())
  const [monto, setMonto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  const retirar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (envioEnCursoRef.current) return
    setError(null)
    setExito(null)

    const montoNumero = Number(monto)
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      setError('Ingresa un monto positivo válido.')
      return
    }
    if (disponibleAhora === null) {
      setError('No fue posible verificar la disponibilidad actual con Stripe. Intenta nuevamente.')
      return
    }
    if (montoNumero > disponibleAhora) {
      setError(`Tienes ${moneda.format(disponibleAhora)} disponibles para retirar ahora. El resto de tu saldo (${moneda.format(enLiquidacion ?? 0)}) está en proceso de liquidación con Stripe y normalmente estará disponible en unos días.`)
      return
    }

    envioEnCursoRef.current = true
    setCargando(true)

    try {
      const respuesta = await fetch('/api/pagos/admin/transferir-saldo-condominio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: montoNumero, solicitudId }),
      })
      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setError(datos.error ?? 'No fue posible realizar el retiro.')
        return
      }

      setExito('Retiro solicitado y confirmado correctamente.')
      setMonto('')
      setSolicitudId(crypto.randomUUID())
      router.refresh()
    } catch {
      setError('No fue posible conectar con el servidor. Intenta nuevamente.')
    } finally {
      envioEnCursoRef.current = false
      setCargando(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-neutral-100 p-7 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[0.9375rem] font-medium text-neutral-900">Retirar saldo</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Transferencia a la cuenta del condominio</p>
          </div>
        </div>
        <span className="text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
          {disponibleAhora === null ? 'Disponibilidad sin verificar' : `Disponible ahora: ${moneda.format(disponibleAhora)}`}
        </span>
      </div>

      <p className="text-xs text-neutral-400 mb-5">
        Saldo contable: {moneda.format(saldoContable)}. La disponibilidad puede variar por
        liquidaciones, reembolsos o transferencias simultáneas de la plataforma.
      </p>
      {enLiquidacion !== null && (
        <p className="text-xs text-neutral-400 -mt-3 mb-5">
          En proceso de liquidación (normalmente disponible en unos días): {moneda.format(enLiquidacion)}
        </p>
      )}

      {!cuentaLista ? (
        <div className="rounded-xl bg-red/5 border border-red/10 px-4 py-3 text-xs text-neutral-600">
          Conecta y completa la configuración de la cuenta bancaria antes de solicitar un retiro.
        </div>
      ) : (
        <form onSubmit={retirar} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="monto-retiro" className="sr-only">Monto a retirar</label>
            <div className="flex items-center rounded-xl border border-neutral-100 focus-within:border-black transition-colors">
              <span className="pl-3.5 text-sm text-neutral-400">$</span>
              <input
                id="monto-retiro"
                type="number"
                min="0.01"
                max={disponibleAhora ?? undefined}
                step="0.01"
                inputMode="decimal"
                value={monto}
                onChange={(event) => {
                  setSolicitudId(crypto.randomUUID())
                  setMonto(event.target.value)
                }}
                disabled={cargando || disponibleAhora === null}
                placeholder="0.00"
                className="w-full px-2 py-2.5 text-sm text-neutral-900 outline-none rounded-xl"
              />
              <span className="pr-3.5 text-xs text-neutral-400">MXN</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={cargando || disponibleAhora === null || disponibleAhora <= 0}
            className="btn-primary py-2.5 px-5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cargando && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />}
            {cargando ? 'Retirando...' : 'Retirar saldo'}
          </button>
        </form>
      )}

      {error && <p className="text-xs text-red mt-3">{error}</p>}
      {exito && (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-success mt-3">
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
          {exito}
        </p>
      )}
    </section>
  )
}
