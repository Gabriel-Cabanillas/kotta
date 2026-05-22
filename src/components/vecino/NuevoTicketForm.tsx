'use client'

/**
 * Formulario para que el vecino registre un nuevo ticket de mantenimiento o reporte.
 * Contiene la captura de titulo, categoria, descripcion y foto opcional del problema.
 * Se relaciona con src/app/[coto]/vecino/tickets/nuevo/page.tsx,
 * la ruta /api/tickets/crear y la vista de tickets del vecino.
 * Existe dentro de Kotta para convertir reportes del residente en tickets
 * asociados a su organizacion, casa y coto.
 */

import { useState, useRef } from 'react'
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
  const router    = useRouter()
  const fileRef   = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [foto, setFoto]       = useState<File | null>(null)
  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    'OTRO',
  })

  const handleSubmit = async () => {
    if (!form.title || !form.description) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title',       form.title)
      formData.append('description', form.description)
      formData.append('category',    form.category)
      formData.append('userId',      userId)
      formData.append('orgId',       orgId)
      if (foto) formData.append('foto', foto)

      const res  = await fetch('/api/tickets/crear', {
        method: 'POST',
        body:   formData,
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

      {/* Foto del problema */}
      <div>
        <label className="text-xs text-[#6B7A99] mb-1.5 block">
          Foto del problema (opcional)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-[#C5D5EE] rounded-xl py-5 flex flex-col items-center gap-2 hover:border-[#4FA8E8] hover:bg-[#E8F4FD] transition-all"
        >
          {foto ? (
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#1DB87E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-sm font-medium text-[#1DB87E]">{foto.name}</p>
            </div>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4FA8E8" strokeWidth="1.8" fill="none"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="#4FA8E8"/>
                <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#4FA8E8" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              </svg>
              <p className="text-sm text-[#4FA8E8] font-medium">Agregar foto del problema</p>
              <p className="text-xs text-[#6B7A99]">Toca para tomar o seleccionar una foto</p>
            </>
          )}
        </button>
        {foto && (
          <button
            type="button"
            onClick={() => setFoto(null)}
            className="text-xs text-[#E8503A] hover:underline mt-1.5"
          >
            Quitar foto
          </button>
        )}
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