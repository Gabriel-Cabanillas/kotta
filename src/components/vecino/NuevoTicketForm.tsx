'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIAS = [
  { value: 'PLOMERIA',        label: 'Plomería'        },
  { value: 'ELECTRICIDAD',    label: 'Electricidad'    },
  { value: 'HERRERIA',        label: 'Herrería'        },
  { value: 'JARDINERIA',      label: 'Jardinería'      },
  { value: 'LIMPIEZA',        label: 'Limpieza'        },
  { value: 'SEGURIDAD',       label: 'Seguridad'       },
  { value: 'INFRAESTRUCTURA', label: 'Infraestructura' },
  { value: 'OTRO',            label: 'Otro'            },
]

export default function NuevoTicketForm({
  userId,
  orgId,
  coto,
  houseNumber,
}: {
  userId: string
  orgId: string
  coto: string
  houseNumber: string | null
}) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    'OTRO',
  })

  const handleSubmit = async () => {
    if (!form.title || !form.description) return
    setLoading(true)
    try {
      const res = await fetch('/api/tickets/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId, orgId }),
      })
      const data = await res.json()
      if (data.ok) {
        router.push(`/${coto}/vecino/tickets`)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

      <div>
        <label className="text-xs text-[#6B7A99] mb-1.5 block">
          Título del problema *
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Ej. Fuga de agua en pasillo"
          className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE]"
        />
      </div>

      <div>
        <label className="text-xs text-[#6B7A99] mb-1.5 block">Categoría</label>
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-[#6B7A99] mb-1.5 block">
          Descripción *
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe el problema con el mayor detalle posible: ubicación exacta, desde cuándo ocurre, si es urgente..."
          rows={4}
          className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8] placeholder:text-[#C5D5EE] resize-none"
        />
      </div>

      {houseNumber && (
        <div className="bg-[#F7F9FC] rounded-xl px-4 py-3 border border-[#E2E8F0]">
          <p className="text-xs text-[#6B7A99]">
            El reporte se registrará a nombre de{' '}
            <span className="font-medium text-[#0F1F34]">Casa {houseNumber}</span>
          </p>
        </div>
      )}

      <div className="bg-[#E8F4FD] rounded-xl px-4 py-3">
        <p className="text-xs text-[#185FA5]">
          El administrador recibirá una notificación inmediata y
          te avisará cuando el problema sea atendido.
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={() => router.back()}
          className="btn-ghost flex-1 py-3 text-sm justify-center"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!form.title || !form.description || loading}
          className="btn-primary flex-1 py-3 text-sm justify-center disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar reporte'}
        </button>
      </div>
    </div>
  )
}