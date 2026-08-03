/** Alertas de solo lectura para los pendientes financieros del condominio. */
'use client'

import Link from 'next/link'
import { AlertCircle, CheckCircle2, Landmark, Truck, WalletCards } from 'lucide-react'

export type AlertaCargoVencido = { id: string; concepto: string; pendientes: number }
export type AlertaProveedorPendiente = { id: string; name: string }
export type AlertaTransferenciaFallida = { id: string; monto: number; destino: 'PROVEEDOR' | 'CONDOMINIO'; contraparte: string; referencia: string | null }
const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

export default function AlertasPendientes({ cargosVencidos, proveedoresPendientes, transferenciasFallidas, onVerCargos, usuariosHref, ordenesHref, configuracionHref }: { cargosVencidos: AlertaCargoVencido[]; proveedoresPendientes: AlertaProveedorPendiente[]; transferenciasFallidas: AlertaTransferenciaFallida[]; onVerCargos: () => void; usuariosHref: string; ordenesHref: string; configuracionHref: string }) {
  const sinAlertas = cargosVencidos.length === 0 && proveedoresPendientes.length === 0 && transferenciasFallidas.length === 0

  return (
    <section className="mt-8" aria-labelledby="alertas-pendientes">
      <div className="mb-4"><h2 id="alertas-pendientes" className="font-display text-xl text-[#0F1F34]">Alertas y pendientes</h2><p className="text-sm text-[#6B7A99] mt-1">Aspectos que requieren seguimiento administrativo.</p></div>
      {sinAlertas ? <div className="bg-white rounded-2xl border border-neutral-100 px-6 py-12 text-center"><div className="w-11 h-11 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-5 h-5" /></div><p className="text-sm font-medium text-neutral-900">Todo en orden, sin pendientes</p><p className="text-sm text-neutral-400 mt-1">No hay cobros vencidos, cuentas pendientes ni transferencias fallidas.</p></div> : <div className="grid gap-4 lg:grid-cols-3">
        {cargosVencidos.length > 0 && <article className="bg-white rounded-2xl border border-red/15 p-5"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-red/10 text-red flex items-center justify-center"><AlertCircle className="w-4 h-4" /></div><div><p className="text-sm font-medium text-neutral-900">Cargos vencidos</p><p className="text-xs text-neutral-400 mt-1">{cargosVencidos.length} cargo{cargosVencidos.length !== 1 ? 's' : ''} con viviendas pendientes.</p></div></div><div className="mt-4 space-y-1.5">{cargosVencidos.slice(0, 3).map((cargo) => <p key={cargo.id} className="text-xs text-neutral-600 truncate">{cargo.concepto} · {cargo.pendientes} pendiente{cargo.pendientes !== 1 ? 's' : ''}</p>)}</div><button onClick={onVerCargos} className="text-xs font-medium text-red hover:text-neutral-900 mt-4">Ver gestión de cargos</button></article>}
        {proveedoresPendientes.length > 0 && <article className="bg-white rounded-2xl border border-neutral-100 p-5"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center"><Truck className="w-4 h-4" /></div><div><p className="text-sm font-medium text-neutral-900">Cuentas de proveedor pendientes</p><p className="text-xs text-neutral-400 mt-1">{proveedoresPendientes.length} proveedor{proveedoresPendientes.length !== 1 ? 'es' : ''} sin cuenta lista para recibir pagos.</p></div></div><p className="text-xs text-neutral-600 mt-4 truncate">{proveedoresPendientes.slice(0, 3).map((proveedor) => proveedor.name).join(', ')}</p><Link href={usuariosHref} className="inline-block text-xs font-medium text-red hover:text-neutral-900 mt-4">Ver proveedores</Link></article>}
        {transferenciasFallidas.length > 0 && <article className="bg-white rounded-2xl border border-red/15 p-5"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-red/10 text-red flex items-center justify-center"><WalletCards className="w-4 h-4" /></div><div><p className="text-sm font-medium text-neutral-900">Transferencias fallidas</p><p className="text-xs text-neutral-400 mt-1">Revisa el saldo o reintenta desde el módulo correspondiente.</p></div></div><div className="mt-4 space-y-3">{transferenciasFallidas.map((transferencia) => <div key={transferencia.id} className="text-xs"><p className="font-medium text-neutral-700">{moneda.format(transferencia.monto)} · {transferencia.contraparte}</p><p className="text-neutral-400 mt-0.5 line-clamp-2">{transferencia.referencia ?? 'Sin detalle del error.'}</p><Link href={transferencia.destino === 'PROVEEDOR' ? ordenesHref : configuracionHref} className="inline-block text-red font-medium mt-1">{transferencia.destino === 'PROVEEDOR' ? 'Ir a órdenes' : 'Ir a configuración'}</Link></div>)}</div></article>}
      </div>}
      {/* TODO: el criterio de cargo vencido también vive en vecino/pagos y PagosList; extraerlo a un helper compartido si cambia. */}
    </section>
  )
}
