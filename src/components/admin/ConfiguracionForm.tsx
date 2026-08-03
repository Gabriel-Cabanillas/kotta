/**
 * Componente de configuracion del panel administrativo de Kotta.
 * Contiene la edicion del nombre del condominio, visualizacion del slug, estado
 * de la organizacion, plan activo y URLs por rol.
 * Se relaciona con la pagina admin de configuracion y con la API
 * /api/configuracion/actualizar.
 * Existe para que el ADMIN mantenga datos basicos del coto y consulte los
 * accesos principales de la estructura multi-rol.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Link2, CreditCard, LayoutGrid, ShieldCheck, Users, Truck, KeyRound, Loader2, Check, Landmark } from 'lucide-react'
import { CuentaConectadaEmbed } from '@/components/pagos/CuentaConectadaEmbed'

type Org = {
  id: string
  name: string
  slug: string
  isActive: boolean
}

type CuentaConectada = {
  payoutsEnabled: boolean
  detailsSubmitted: boolean
} | null

const ROLE_ACCESS = [
  { rol: 'Administrador', path: 'admin', icon: ShieldCheck },
  { rol: 'Vecino', path: 'vecino', icon: Users },
  { rol: 'Proveedor', path: 'proveedor', icon: Truck },
  { rol: 'Guardia', path: 'guardia', icon: KeyRound },
] as const

export default function ConfiguracionForm({ org, cuentaConectada }: { org: Org; cuentaConectada: CuentaConectada }) {
  const router  = useRouter()
  const [name, setName]     = useState(org.name)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [mostrarFormularioPago, setMostrarFormularioPago] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await fetch('/api/configuracion/actualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: org.id, name }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">

      {/* Encabezado */}
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-400 mb-1">
          Configuración
        </p>
        <h1 className="text-2xl font-medium text-neutral-900">
          {org.name}
        </h1>
      </div>

      {/* Datos generales */}
      <section className="bg-white rounded-2xl border border-neutral-100 p-7 md:p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-[0.9375rem] font-medium text-neutral-900">
            Datos del condominio
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="condo-name" className="text-xs font-medium text-neutral-400 mb-1.5 block">
              Nombre del condominio
            </label>
            <input
              id="condo-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm text-neutral-900 bg-white border border-neutral-100 rounded-xl
                         px-3.5 py-2.5 transition-colors duration-150
                         focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <span className="text-xs font-medium text-neutral-400 mb-1.5 block">
              URL del sistema
            </span>
            <div className="flex items-center gap-2 bg-black/[0.02] border border-neutral-100 rounded-xl px-3.5 py-2.5">
              <Link2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" strokeWidth={2} />
              <span className="text-xs text-neutral-400">kotta.com.mx/</span>
              <span className="text-sm text-neutral-900 font-mono">{org.slug}</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">
              El slug no se puede modificar una vez creado.
            </p>
          </div>

          <div>
            <span className="text-xs font-medium text-neutral-400 mb-1.5 block">Estado</span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100/60">
              <span className={`w-1.5 h-1.5 rounded-full ${org.isActive ? 'bg-green' : 'bg-red'}`} />
              <span className="text-xs font-medium text-neutral-900">
                {org.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-7 pt-6 border-t border-neutral-100">
          <button
            onClick={handleSave}
            disabled={loading || name === org.name}
            className="btn-primary py-2.5 px-6 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />}
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>

          {saved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green animate-fade-in">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              Cambios guardados
            </span>
          )}
        </div>
      </section>

      {/* Info del plan */}
      <section className="bg-white rounded-2xl border border-neutral-100 p-7 md:p-8">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-[0.9375rem] font-medium text-neutral-900">Plan activo</h2>
        </div>

        <div className="flex items-center justify-between p-5 bg-black rounded-2xl">
          <div>
            <p className="text-sm font-medium text-white">Plan único KOTTA</p>
            <p className="text-xs text-white/60 mt-0.5">Todos los módulos incluidos</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-medium text-white">$1,500</p>
            <p className="text-xs text-white/60">MXN / mes</p>
          </div>
        </div>

        <p className="text-xs text-neutral-400 mt-4">
          Para cambios en tu plan o facturación contacta a{' '}
          <a
            href="mailto:hola@kotta.com.mx"
            className="text-neutral-900 font-medium hover:text-red transition-colors duration-150"
          >
            hola@kotta.com.mx
          </a>
        </p>
      </section>


          {/* Cuenta bancaria (Stripe Connect) */}
      <section className="bg-white rounded-2xl border border-neutral-100 p-7 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-[0.9375rem] font-medium text-neutral-900">Cuenta bancaria</h2>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100/60">
            <span className={`w-1.5 h-1.5 rounded-full ${cuentaConectada?.payoutsEnabled ? 'bg-green' : 'bg-yellow'}`} />
            <span className="text-xs font-medium text-neutral-900">
              {cuentaConectada?.payoutsEnabled ? 'Listo para recibir pagos' : 'Pendiente de configurar'}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-400 mb-5">
          {cuentaConectada?.payoutsEnabled
            ? 'Tu cuenta está lista para recibir las transferencias de saldo solicitadas desde Kotta.'
            : 'Conecta la cuenta bancaria del condominio para poder recibir transferencias de saldo desde Kotta.'}
        </p>

        {mostrarFormularioPago ? (
          <CuentaConectadaEmbed onCompletado={() => { setMostrarFormularioPago(false); router.refresh() }} />
        ) : (
          <button
            onClick={() => setMostrarFormularioPago(true)}
            className="btn-primary py-2.5 px-6 text-sm"
          >
            {cuentaConectada?.detailsSubmitted ? 'Actualizar información' : 'Conectar cuenta bancaria'}
          </button>
        )}
      </section>




      {/* Accesos rápidos */}
      <section className="bg-white rounded-2xl border border-neutral-100 p-7 md:p-8">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-[0.9375rem] font-medium text-neutral-900">URLs del sistema</h2>
        </div>

        <div className="space-y-2">
          {ROLE_ACCESS.map(({ rol, path, icon: Icon }) => (
            <div
              key={path}
              className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-100
                         transition-colors duration-150 hover:bg-black/[0.02]"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-3.5 h-3.5 text-neutral-400" strokeWidth={2} />
                <span className="text-xs font-medium text-neutral-900">{rol}</span>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                /{org.slug}/{path}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
