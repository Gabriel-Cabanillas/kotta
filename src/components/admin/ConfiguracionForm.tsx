'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Org = {
  id: string
  name: string
  slug: string
  isActive: boolean
}

export default function ConfiguracionForm({ org }: { org: Org }) {
  const router  = useRouter()
  const [name, setName]     = useState(org.name)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)

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
    <div className="max-w-xl space-y-5">

      {/* Datos generales */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
        <h2 className="font-medium text-[#0F1F34] mb-5">Datos del condominio</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#6B7A99] mb-1.5 block">
              Nombre del condominio
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
            />
          </div>

          <div>
            <label className="text-xs text-[#6B7A99] mb-1.5 block">
              URL del sistema
            </label>
            <div className="flex items-center gap-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl px-3 py-2.5">
              <span className="text-xs text-[#6B7A99]">kotta.com.mx/</span>
              <span className="text-sm text-[#0F1F34] font-mono">{org.slug}</span>
            </div>
            <p className="text-xs text-[#6B7A99] mt-1.5">
              El slug no se puede modificar una vez creado.
            </p>
          </div>

          <div>
            <label className="text-xs text-[#6B7A99] mb-1.5 block">Estado</label>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  org.isActive ? 'bg-[#1DB87E]' : 'bg-[#E8503A]'
                }`}
              />
              <span className="text-sm text-[#0F1F34]">
                {org.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={loading || name === org.name}
            className="btn-primary py-2.5 px-6 text-sm disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {saved && (
            <span className="text-xs text-[#1DB87E] font-medium">
              ✓ Cambios guardados
            </span>
          )}
        </div>
      </div>

      {/* Info del plan */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
        <h2 className="font-medium text-[#0F1F34] mb-4">Plan activo</h2>
        <div className="flex items-center justify-between p-4 bg-[#E8F0F9] rounded-xl border border-[#C5D5EE]">
          <div>
            <p className="text-sm font-medium text-[#1E3A5F]">Plan único KOTTA</p>
            <p className="text-xs text-[#4A5568] mt-0.5">Todos los módulos incluidos</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl text-[#1E3A5F]">$1,500</p>
            <p className="text-xs text-[#6B7A99]">MXN / mes</p>
          </div>
        </div>
        <p className="text-xs text-[#6B7A99] mt-3">
          Para cambios en tu plan o facturación contacta a{' '}
          <a href="mailto:hola@kotta.com.mx" className="text-[#4FA8E8] hover:underline">
            hola@kotta.com.mx
          </a>
        </p>
      </div>

      {/* Accesos rápidos */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
        <h2 className="font-medium text-[#0F1F34] mb-4">URLs del sistema</h2>
        <div className="space-y-2">
          {[
            { rol: 'Administrador', path: 'admin',     color: '#1E3A5F', bg: '#E8F0F9' },
            { rol: 'Vecino',        path: 'vecino',    color: '#4FA8E8', bg: '#E8F4FD' },
            { rol: 'Proveedor',     path: 'proveedor', color: '#1DB87E', bg: '#E6F9F1' },
            { rol: 'Guardia',       path: 'guardia',   color: '#6B7A99', bg: '#F1F5F9' },
          ].map((item) => (
            <div
              key={item.path}
              className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC]"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md"
                  style={{ color: item.color, background: item.bg }}
                >
                  {item.rol}
                </span>
              </div>
              <span className="text-xs font-mono text-[#6B7A99]">
                /{org.slug}/{item.path}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}