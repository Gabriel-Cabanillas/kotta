'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  name: string
  email: string
  phone: string | null
  houseNumber: string | null
  isActive: boolean
  role: string
}

type Tab = 'VECINO' | 'PROVEEDOR' | 'GUARDIA'

const TAB_CONFIG = {
  VECINO:    { label: 'Vecinos',     color: '#4FA8E8', bg: '#E8F4FD' },
  PROVEEDOR: { label: 'Proveedores', color: '#1DB87E', bg: '#E6F9F1' },
  GUARDIA:   { label: 'Guardias',    color: '#6B7A99', bg: '#F1F5F9' },
}

export default function UsuariosList({
  vecinos,
  proveedores,
  guardias,
  orgId,
  coto,
}: {
  vecinos: User[]
  proveedores: User[]
  guardias: User[]
  orgId: string
  coto: string
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('VECINO')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:        '',
    email:       '',
    phone:       '',
    houseNumber: '',
    role:        'VECINO' as Tab,
  })

  const users = {
    VECINO:    vecinos,
    PROVEEDOR: proveedores,
    GUARDIA:   guardias,
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email) return
    setLoading(true)
    try {
      await fetch('/api/usuarios/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, orgId }),
      })
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', houseNumber: '', role: 'VECINO' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    await fetch('/api/usuarios/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isActive: !isActive }),
    })
    router.refresh()
  }

  return (
    <div>
      {/* Tabs + botón agregar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2">
          {(Object.keys(TAB_CONFIG) as Tab[]).map((tab) => {
            const cfg = TAB_CONFIG[tab]
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  activeTab === tab
                    ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                    : 'bg-white text-[#4A5568] border-[#E2E8F0] hover:border-[#C5D5EE]'
                }`}
              >
                {cfg.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F1F5F9] text-[#6B7A99]'
                  }`}
                >
                  {users[tab].length}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => {
            setForm((f) => ({ ...f, role: activeTab }))
            setShowModal(true)
          }}
          className="btn-primary text-sm py-2.5 px-5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Agregar {TAB_CONFIG[activeTab].label.slice(0, -1)}
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {users[activeTab].length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#6B7A99] text-sm">
              No hay {TAB_CONFIG[activeTab].label.toLowerCase()} registrados.
            </p>
            <button
              onClick={() => {
                setForm((f) => ({ ...f, role: activeTab }))
                setShowModal(true)
              }}
              className="mt-3 text-sm text-[#4FA8E8] hover:underline"
            >
              Agregar el primero →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {users[activeTab].map((u) => {
              const cfg = TAB_CONFIG[activeTab]
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F9FC] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: cfg.color }}
                      >
                        {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0F1F34]">{u.name}</p>
                      <p className="text-xs text-[#6B7A99]">
                        {u.email}
                        {u.houseNumber && ` · Casa ${u.houseNumber}`}
                        {u.phone && ` · ${u.phone}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        u.isActive
                          ? 'bg-[#E6F9F1] text-[#0D7A4E]'
                          : 'bg-[#F1F5F9] text-[#6B7A99]'
                      }`}
                    >
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      className="text-xs text-[#6B7A99] hover:text-[#0F1F34] border border-[#E2E8F0] hover:border-[#C5D5EE] px-3 py-1.5 rounded-lg transition-all"
                    >
                      {u.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal crear usuario */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <h3 className="font-medium text-[#0F1F34]">
                Agregar {TAB_CONFIG[form.role].label.slice(0, -1)}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#6B7A99] hover:text-[#0F1F34] p-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. María González"
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
                />
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
                />
              </div>

              {form.role === 'VECINO' && (
                <div>
                  <label className="text-xs text-[#6B7A99] mb-1.5 block">
                    Número de casa
                  </label>
                  <input
                    type="text"
                    value={form.houseNumber}
                    onChange={(e) => setForm((f) => ({ ...f, houseNumber: e.target.value }))}
                    placeholder="Ej. 14"
                    className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Ej. 6691234567"
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
                />
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] mb-1.5 block">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Tab }))}
                  className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                >
                  <option value="VECINO">Vecino</option>
                  <option value="PROVEEDOR">Proveedor</option>
                  <option value="GUARDIA">Guardia</option>
                </select>
              </div>

              <div className="bg-[#E8F4FD] rounded-xl px-4 py-3">
                <p className="text-xs text-[#185FA5]">
                  Se enviará una invitación por correo para que el usuario active su cuenta.
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost flex-1 py-3 text-sm justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.email || loading}
                className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}