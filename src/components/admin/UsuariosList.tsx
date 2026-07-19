/**
 * Componente de gestion de usuarios del panel administrativo de Kotta.
 * Contiene tabs por rol, listado de vecinos, proveedores y guardias, alta de
 * usuarios invitados y activacion o desactivacion de cuentas.
 * Se relaciona con la pagina admin de usuarios y con las APIs
 * /api/usuarios/crear y /api/usuarios/toggle.
 * Existe para que el ADMIN administre los usuarios de su coto desde la
 * arquitectura multi-rol del SaaS.
 */

// Ya se rediseño
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

// Jerarquía visual por rol: Vecino (relleno negro) > Proveedor (contorno) > Guardia (silenciado).
// Solo afecta al avatar de la fila; la pestaña activa siempre usa el mismo tratamiento.
const TAB_CONFIG: Record<Tab, { label: string; avatar: string }> = {
  VECINO:    { label: 'Vecinos',     avatar: 'bg-black text-white' },
  PROVEEDOR: { label: 'Proveedores', avatar: 'bg-white text-neutral-900 border border-neutral-900' },
  GUARDIA:   { label: 'Guardias',    avatar: 'bg-neutral-100 text-neutral-400' },
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
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex flex-wrap gap-1 p-1 bg-neutral-100/60 rounded-xl">
          {(Object.keys(TAB_CONFIG) as Tab[]).map((tab) => {
            const cfg = TAB_CONFIG[tab]
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {cfg.label}
                <span
                  className={`text-[0.6875rem] font-medium px-1.5 py-0.5 rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-white/15 text-white' : 'bg-neutral-200/70 text-neutral-400'
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
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden">
        {users[activeTab].length === 0 ? (
          <div className="py-20 px-6 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="#A6A6A6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="#A6A6A6" strokeWidth="1.75"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#A6A6A6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-neutral-400 text-sm">
              No hay {TAB_CONFIG[activeTab].label.toLowerCase()} registrados.
            </p>
            <button
              onClick={() => {
                setForm((f) => ({ ...f, role: activeTab }))
                setShowModal(true)
              }}
              className="mt-3 text-sm font-medium text-black hover:text-red transition-colors inline-flex items-center gap-1"
            >
              Agregar el primero
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {users[activeTab].map((u) => {
              const cfg = TAB_CONFIG[activeTab]
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-black/[0.015] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.avatar}`}>
                      <span className="text-xs font-semibold tracking-wide">
                        {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{u.name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
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
                          ? 'bg-success/10 text-success'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      className="text-xs font-medium text-neutral-400 hover:text-neutral-900 border border-neutral-100 hover:border-neutral-900/20 px-3 py-1.5 rounded-lg transition-colors"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-neutral-100 w-full max-w-md shadow-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h3 className="font-medium text-neutral-900">
                Agregar {TAB_CONFIG[form.role].label.slice(0, -1)}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-900 p-1 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. María González"
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400/70"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400/70"
                />
              </div>

              {form.role === 'VECINO' && (
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">
                    Número de casa
                  </label>
                  <input
                    type="text"
                    value={form.houseNumber}
                    onChange={(e) => setForm((f) => ({ ...f, houseNumber: e.target.value }))}
                    placeholder="Ej. 14"
                    className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400/70"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Ej. 6691234567"
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400/70"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Tab }))}
                  className="w-full text-sm border border-neutral-100 rounded-xl px-3 py-2.5 text-neutral-900 bg-white focus:outline-none focus:border-black transition-colors"
                >
                  <option value="VECINO">Vecino</option>
                  <option value="PROVEEDOR">Proveedor</option>
                  <option value="GUARDIA">Guardia</option>
                </select>
              </div>

              <div className="flex items-start gap-2.5 bg-neutral-100/60 rounded-xl px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="9" stroke="#A6A6A6" strokeWidth="1.75"/>
                  <path d="M12 11v5M12 8v.01" stroke="#A6A6A6" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
                <p className="text-xs text-neutral-400 leading-relaxed">
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
                className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-40 disabled:cursor-not-allowed"
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