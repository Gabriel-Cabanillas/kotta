/**
 * Componente de gestion de tickets del panel administrativo de Kotta.
 * Contiene filtros por estado, listado de reportes del coto y el flujo para
 * asignar tickets a proveedores.
 * Se relaciona con la pagina admin de tickets, proveedores disponibles y la API
 * /api/tickets/assign que crea ordenes de trabajo.
 * Existe para que el ADMIN supervise incidencias y conecte tickets con ordenes
 * dentro de la operacion del condominio.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_TABS = [
  { key: 'TODOS',       label: 'Todos' },
  { key: 'NUEVO',       label: 'Nuevos' },
  { key: 'EN_PROCESO',  label: 'En proceso' },
  { key: 'ASIGNADO',    label: 'Asignados' },
  { key: 'RESUELTO',    label: 'Resueltos' },
]

const STATUS_LABELS: Record<string, string> = {
  NUEVO:       'Nuevo',
  EN_REVISION: 'En revisión',
  ASIGNADO:    'Asignado',
  EN_PROCESO:  'En proceso',
  RESUELTO:    'Resuelto',
  CERRADO:     'Cerrado',
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  NUEVO:       { color: '#6B7A99', bg: '#F1F5F9' },
  EN_REVISION: { color: '#4FA8E8', bg: '#E8F4FD' },
  ASIGNADO:    { color: '#4FA8E8', bg: '#E8F4FD' },
  EN_PROCESO:  { color: '#F5A623', bg: '#FEF3E2' },
  RESUELTO:    { color: '#1DB87E', bg: '#E6F9F1' },
  CERRADO:     { color: '#1DB87E', bg: '#E6F9F1' },
}

const CATEGORY_LABELS: Record<string, string> = {
  PLOMERIA:       'Plomería',
  ELECTRICIDAD:   'Electricidad',
  HERRERIA:       'Herrería',
  JARDINERIA:     'Jardinería',
  LIMPIEZA:       'Limpieza',
  SEGURIDAD:      'Seguridad',
  INFRAESTRUCTURA:'Infraestructura',
  OTRO:           'Otro',
}

type Ticket = {
  id: string
  folio: string
  title: string
  description: string
  status: string
  category: string
  photoUrl: string | null
  createdAt: Date
  reportedBy: { name: string; houseNumber: string | null }
  workOrder: { provider: { name: string } | null } | null
}

type Proveedor = { id: string; name: string }
type Count = { status: string; _count: number }

export default function TicketsList({
  tickets,
  proveedores,
  counts,
  coto,
  currentStatus,
}: {
  tickets: Ticket[]
  proveedores: Proveedor[]
  counts: Count[]
  coto: string
  currentStatus: string
}) {
  const router = useRouter()
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState('')

  const getCount = (status: string) => {
    if (status === 'TODOS') return tickets.length
    return counts.find((c) => c.status === status)?._count ?? 0
  }

  const handleAssign = async () => {
    if (!selectedTicket || !selectedProveedor) return
    setAssigning(true)
    try {
      await fetch('/api/tickets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          providerId: selectedProveedor,
        }),
      })
      setSelectedTicket(null)
      setSelectedProveedor('')
      router.refresh()
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div>
      {/* Tabs de estado */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.push(`/${coto}/admin/tickets?status=${tab.key}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              currentStatus === tab.key
                ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                : 'bg-white text-[#4A5568] border-[#E2E8F0] hover:border-[#C5D5EE]'
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                currentStatus === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F1F5F9] text-[#6B7A99]'
              }`}
            >
              {getCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {tickets.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#6B7A99] text-sm">No hay tickets en esta categoría.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {tickets.map((ticket) => {
              const st = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.NUEVO
              return (
                <div
                  key={ticket.id}
                  className="flex items-start justify-between px-6 py-4 hover:bg-[#F7F9FC] transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <span className="text-xs font-mono text-[#6B7A99] flex-shrink-0 mt-1">
                      #{ticket.folio}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F1F34] mb-0.5">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-[#6B7A99]">
                        {ticket.reportedBy.name}
                        {ticket.reportedBy.houseNumber && ` · Casa ${ticket.reportedBy.houseNumber}`}
                        {' · '}
                        {CATEGORY_LABELS[ticket.category]}
                      </p>
                      {ticket.workOrder?.provider && (
                        <p className="text-xs text-[#4FA8E8] mt-1">
                          Asignado a: {ticket.workOrder.provider.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <p className="text-xs text-[#6B7A99] hidden sm:block">
                      {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal detalle + asignación */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs font-mono text-[#6B7A99] mb-1">
                  #{selectedTicket.folio}
                </p>
                <h3 className="font-medium text-[#0F1F34]">{selectedTicket.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-[#6B7A99] hover:text-[#0F1F34] transition-colors p-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-[#6B7A99] mb-1">Descripción</p>
                <p className="text-sm text-[#0F1F34]">{selectedTicket.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#6B7A99] mb-1">Reportado por</p>
                  <p className="text-sm text-[#0F1F34]">{selectedTicket.reportedBy.name}</p>
                  {selectedTicket.reportedBy.houseNumber && (
                    <p className="text-xs text-[#6B7A99]">Casa {selectedTicket.reportedBy.houseNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#6B7A99] mb-1">Categoría</p>
                  <p className="text-sm text-[#0F1F34]">{CATEGORY_LABELS[selectedTicket.category]}</p>
                </div>
              </div>

              {/* Foto */}
              {selectedTicket.photoUrl && (
                <div>
                  <p className="text-xs text-[#6B7A99] mb-2">Foto del reporte</p>
                  <img
                    src={selectedTicket.photoUrl}
                    alt="Foto del reporte"
                    className="w-full rounded-xl border border-[#E2E8F0] object-cover max-h-48"
                  />
                </div>
              )}

              {/* Asignar proveedor */}
              {!selectedTicket.workOrder && proveedores.length > 0 && (
                <div>
                  <p className="text-xs text-[#6B7A99] mb-2">Asignar a proveedor</p>
                  <div className="flex gap-2">
                    <select
                      value={selectedProveedor}
                      onChange={(e) => setSelectedProveedor(e.target.value)}
                      className="flex-1 text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F1F34] bg-white focus:outline-none focus:border-[#4FA8E8]"
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedProveedor || assigning}
                      className="btn-primary py-2.5 px-4 text-sm disabled:opacity-50"
                    >
                      {assigning ? 'Asignando...' : 'Asignar'}
                    </button>
                  </div>
                </div>
              )}

              {selectedTicket.workOrder?.provider && (
                <div className="bg-[#E8F4FD] rounded-xl px-4 py-3">
                  <p className="text-xs text-[#185FA5] font-medium">
                    Asignado a {selectedTicket.workOrder.provider.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
