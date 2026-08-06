'use client'

/**
 * Lista los Cargo pendientes del vecino y abre el modal de pago con
 * Stripe Elements al dar clic en "Pagar".
 * Se relaciona con /api/pagos/vecino/pagar-cargo (crea el PaymentIntent)
 * y con PagoModal.tsx (el formulario de tarjeta/SPEI en sí).
 * Existe para que el vecino vea y liquide sus cuotas sin salir de Kotta.
 */
import { useState } from 'react'
import { AlertCircle, Clock } from 'lucide-react'
import PagoModal from './PagoModal'

type Cargo = {
  id: string
  concepto: string
  monto: any
  fechaLimite: string | Date
  ultimoPago: { estado: string } | null
}

export default function CargosPendientes({ cargos }: { cargos: Cargo[] }) {
  const [cargoActivo, setCargoActivo] = useState<Cargo | null>(null)

  return (
    <>
      <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-400 mb-3">
        Cargos pendientes
      </h2>
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="divide-y divide-neutral-100">
          {cargos.map((cargo) => {
            const fallido = cargo.ultimoPago?.estado === 'FALLIDO'
            const vencido = new Date(cargo.fechaLimite) < new Date()
            return (
              <div key={cargo.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${vencido ? 'bg-red/10' : 'bg-neutral-100'}`}>
                    {vencido ? <AlertCircle className="w-4 h-4 text-red" strokeWidth={2} /> : <Clock className="w-4 h-4 text-neutral-400" strokeWidth={2} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{cargo.concepto}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      ${Number(cargo.monto).toLocaleString('es-MX')} MXN · Vence {new Date(cargo.fechaLimite).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      {fallido && <span className="text-red"> · Intento anterior falló</span>}
                    </p>
                  </div>
                </div>
                <button onClick={() => setCargoActivo(cargo)} className="btn-primary py-2 px-5 text-sm">
                  Pagar
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {cargoActivo && (
        <PagoModal cargo={cargoActivo} onClose={() => setCargoActivo(null)} />
      )}
    </>
  )
}