/**
 * Componente de gestion de tickets del panel administrativo de Kotta.
 * Contiene filtros por estado, listado de reportes del coto y el flujo para
 * asignar tickets a proveedores.
 * Se relaciona con la pagina admin de tickets, proveedores disponibles y la API
 * /api/tickets/assign que crea ordenes de trabajo.
 * Existe para que el ADMIN supervise incidencias y conecte tickets con ordenes
 * dentro de la operacion del condominio.
 */

// Ya se rediseño
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Droplet,
  Zap,
  Hammer,
  Leaf,
  Sparkles,
  ShieldCheck,
  Building2,
  MoreHorizontal,
  X,
  ChevronRight,
  User,
  Tag,
  Inbox,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'

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

// Punto de color por estado; la etiqueta usa el mismo tratamiento neutro
// para todos los estados (patrón de "dot status" tipo Linear/Stripe).
const STATUS_DOT: Record<string, string> = {
  NUEVO:       'bg-red',
  EN_REVISION: 'bg-yellow',
  ASIGNADO:    'bg-neutral-400',
  EN_PROCESO:  'bg-black',
  RESUELTO:    'bg-green',
  CERRADO:     'bg-neutral-400',
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

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  PLOMERIA:        Droplet,
  ELECTRICIDAD:    Zap,
  HERRERIA:        Hammer,
  JARDINERIA:      Leaf,
  LIMPIEZA:        Sparkles,
  SEGURIDAD:       ShieldCheck,
  INFRAESTRUCTURA: Building2,
  OTRO:            MoreHorizontal,
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
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
              currentStatus === tab.key
                ? 'bg-black text-white border-black'
                : 'bg-white text-text-secondary border-border hover:border-black/25 hover:text-text-primary'
            }`}
          >
            {tab.label}
            <span
              className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${
                currentStatus === tab.key
                  ? 'bg-white/15 text-white'
                  : 'bg-neutral-100 text-text-muted'
              }`}
            >
              {getCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {tickets.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <div className="h-11 w-11 rounded-full bg-neutral-100 flex items-center justify-center text-text-muted">
              <Inbox size={18} strokeWidth={1.5} />
            </div>
            <p className="text-text-muted text-sm">No hay tickets en esta categoría.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((ticket) => {
              const dot = STATUS_DOT[ticket.status] ?? STATUS_DOT.NUEVO
              const CategoryIcon = CATEGORY_ICONS[ticket.category] ?? MoreHorizontal
              return (
                <div
                  key={ticket.id}
                  className="group flex items-start gap-4 px-6 py-4 hover:bg-black/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center text-text-secondary flex-shrink-0">
                    <CategoryIcon size={16} strokeWidth={1.75} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-mono text-text-muted tracking-wide mb-0.5">
                      #{ticket.folio}
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {ticket.reportedBy.name}
                      {ticket.reportedBy.houseNumber && ` · Casa ${ticket.reportedBy.houseNumber}`}
                      {' · '}
                      {CATEGORY_LABELS[ticket.category]}
                    </p>
                    {ticket.workOrder?.provider && (
                      <p className="flex items-center gap-1.5 text-xs text-text-secondary mt-1.5">
                        <CheckCircle2 size={12} strokeWidth={2} className="text-green flex-shrink-0" />
                        Asignado a {ticket.workOrder.provider.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <p className="text-xs text-text-muted hidden sm:block">
                      {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800">
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    <ChevronRight
                      size={16}
                      strokeWidth={2}
                      className="hidden md:block text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all"
                    />
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white rounded-3xl border border-border w-full max-w-lg shadow-black max-h-[90vh] overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-border sticky top-0 bg-white">
              <div>
                <p className="text-[11px] font-mono text-text-muted tracking-wide mb-1">
                  #{selectedTicket.folio}
                </p>
                <h3 className="text-lg font-medium text-text-primary leading-snug">
                  {selectedTicket.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-text-muted hover:text-text-primary hover:bg-black/[0.04] transition-colors p-2 -mr-2 -mt-1 rounded-full flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">
                  Descripción
                </p>
                <p className="text-sm text-text-primary leading-relaxed bg-neutral-100/70 rounded-xl p-4">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted mb-1.5">
                    <User size={12} strokeWidth={2} />
                    Reportado por
                  </p>
                  <p className="text-sm text-text-primary">{selectedTicket.reportedBy.name}</p>
                  {selectedTicket.reportedBy.houseNumber && (
                    <p className="text-xs text-text-muted mt-0.5">Casa {selectedTicket.reportedBy.houseNumber}</p>
                  )}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted mb-1.5">
                    <Tag size={12} strokeWidth={2} />
                    Categoría
                  </p>
                  <p className="text-sm text-text-primary">{CATEGORY_LABELS[selectedTicket.category]}</p>
                </div>
              </div>

              {/* Foto */}
              {selectedTicket.photoUrl && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">
                    Foto del reporte
                  </p>
                  <img
                    src={selectedTicket.photoUrl}
                    alt="Foto del reporte"
                    className="w-full rounded-xl border border-border object-cover max-h-48"
                  />
                </div>
              )}

              {/* Asignar proveedor */}
              {!selectedTicket.workOrder && proveedores.length > 0 && (
                <div className="bg-neutral-100/70 rounded-xl p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2.5">
                    Asignar a proveedor
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedProveedor}
                      onChange={(e) => setSelectedProveedor(e.target.value)}
                      className="flex-1 text-sm border border-border rounded-lg px-3 py-2.5 text-text-primary bg-white focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedProveedor || assigning}
                      className="btn-primary py-2.5 px-4 text-sm disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                      {assigning ? 'Asignando...' : 'Asignar'}
                    </button>
                  </div>
                </div>
              )}

              {selectedTicket.workOrder?.provider && (
                <div className="flex items-center gap-2 bg-green/10 rounded-xl px-4 py-3">
                  <CheckCircle2 size={16} strokeWidth={2} className="text-green flex-shrink-0" />
                  <p className="text-xs font-medium text-neutral-900">
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