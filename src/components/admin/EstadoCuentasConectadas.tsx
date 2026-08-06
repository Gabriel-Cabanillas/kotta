/**
 * Estado de las cuentas Stripe conectadas del condominio y sus proveedores.
 * Solo informa; el reenvío de invitación requiere un flujo dedicado pendiente.
 */
'use client'

import Link from 'next/link'
import { Building2, CheckCircle2, Clock3, Landmark, Mail, Truck } from 'lucide-react'

type Cuenta = { chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean } | null
type Estado = 'VERIFICADO' | 'PENDIENTE' | 'SIN_CONFIGURAR'

function estadoCuenta(cuenta: Cuenta): Estado {
  if (!cuenta) return 'SIN_CONFIGURAR'
  return cuenta.chargesEnabled && cuenta.payoutsEnabled && cuenta.detailsSubmitted ? 'VERIFICADO' : 'PENDIENTE'
}

const CONFIG: Record<Estado, { etiqueta: string; clases: string; Icono: typeof CheckCircle2 }> = {
  VERIFICADO: { etiqueta: 'Verificado y listo', clases: 'bg-success/10 text-success', Icono: CheckCircle2 },
  PENDIENTE: { etiqueta: 'Pendiente de verificación', clases: 'bg-[#FFBA2E]/15 text-[#A66C00]', Icono: Clock3 },
  SIN_CONFIGURAR: { etiqueta: 'Sin configurar', clases: 'bg-neutral-100 text-neutral-600', Icono: Landmark },
}

function BadgeEstado({ cuenta }: { cuenta: Cuenta }) {
  const config = CONFIG[estadoCuenta(cuenta)]
  const Icono = config.Icono
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.clases}`}><Icono className="w-3.5 h-3.5" strokeWidth={2} />{config.etiqueta}</span>
}

export default function EstadoCuentasConectadas({ condominio, proveedores, configuracionHref }: { condominio: Cuenta; proveedores: Array<{ id: string; name: string; cuenta: Cuenta }>; configuracionHref: string }) {
  const estadoCondominio = estadoCuenta(condominio)
  return <section className="mt-8" aria-labelledby="estado-cuentas"><div className="mb-4"><h2 id="estado-cuentas" className="font-display text-xl text-[#0F1F34]">Cuentas conectadas</h2><p className="text-sm text-[#6B7A99] mt-1">Estado de verificación para recibir y distribuir pagos.</p></div><div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"><article className="bg-white rounded-2xl border border-neutral-100 p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center"><Building2 className="w-4 h-4" /></div><div><h3 className="text-sm font-medium text-neutral-900">Cuenta del condominio</h3><p className="text-xs text-neutral-400 mt-0.5">Cuenta Stripe conectada del coto.</p></div></div></div><div className="mt-5"><BadgeEstado cuenta={condominio} /></div>{estadoCondominio !== 'VERIFICADO' && <Link href={configuracionHref} className="inline-flex text-xs font-medium text-red hover:text-neutral-900 mt-5">Ir a configuración de cuenta</Link>}</article><article className="bg-white rounded-2xl border border-neutral-100 overflow-hidden"><div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center"><Truck className="w-4 h-4" /></div><div><h3 className="text-sm font-medium text-neutral-900">Cuentas de proveedores</h3><p className="text-xs text-neutral-400 mt-0.5">Las cuentas que requieren atención aparecen primero.</p></div></div>{proveedores.length === 0 ? <p className="py-10 px-5 text-sm text-neutral-400 text-center">No hay proveedores registrados en este condominio.</p> : <div className="divide-y divide-neutral-100">{proveedores.map((proveedor) => { const estado = estadoCuenta(proveedor.cuenta); return <div key={proveedor.id} className="flex items-center justify-between gap-3 px-5 py-3.5"><div className="min-w-0"><p className="text-sm font-medium text-neutral-900 truncate">{proveedor.name}</p><div className="mt-1"><BadgeEstado cuenta={proveedor.cuenta} /></div></div>{estado !== 'VERIFICADO' && <button type="button" disabled title="Pendiente: requiere un flujo de reenvío de invitación de pago." className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 border border-neutral-100 px-3 py-2 rounded-lg cursor-not-allowed"><Mail className="w-3.5 h-3.5" />Reenviar invitación</button>}</div> })}</div>}</article></div>{/* TODO: habilitar “Reenviar invitación” cuando exista un endpoint autorizado para el onboarding de pagos del proveedor. */}</section>
}
