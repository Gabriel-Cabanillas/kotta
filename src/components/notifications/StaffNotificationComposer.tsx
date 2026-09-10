'use client'

import { useRef, useState } from 'react'
import { BellRing, CheckCircle2, ChevronDown, Loader2, Send } from 'lucide-react'

type AdminRecipient = { id: string; name: string }

export default function StaffNotificationComposer({
  organizationId,
  admins,
}: {
  organizationId: string
  admins: AdminRecipient[]
}) {
  const requestKeyRef = useRef('')
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => admins.map((admin) => admin.id))
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const toggleRecipient = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSending(true)
    setError(null)
    setSuccess(null)
    try {
      if (!requestKeyRef.current) requestKeyRef.current = crypto.randomUUID()
      const response = await fetch(`/api/kotta-staff/condominios/${organizationId}/notificaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserIds: selectedIds,
          title,
          message,
          idempotencyKey: requestKeyRef.current,
        }),
      })
      const data = await response.json() as { error?: string; created?: number; recipients?: number }
      if (!response.ok) throw new Error(data.error ?? 'No fue posible enviar la notificación.')
      const delivered = data.recipients ?? data.created ?? selectedIds.length
      setSuccess(`Notificación creada dentro de Kotta para ${delivered} ${delivered === 1 ? 'administrador' : 'administradores'}.`)
      setTitle('')
      setMessage('')
      requestKeyRef.current = ''
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'No fue posible enviar la notificación.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_10px_28px_rgba(15,31,52,0.04)]">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-neutral-50 sm:px-6">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white"><BellRing className="h-4 w-4" /></span>
          <span><span className="block font-display text-lg text-[#0F1F34]">Notificar a administradores</span><span className="mt-1 block text-xs text-neutral-500">Comunicación comercial directa con los ADMIN de este condominio.</span></span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <form onSubmit={send} className="animate-fade-in border-t border-neutral-100 px-5 py-6 sm:px-6">
          {admins.length === 0 ? (
            <div className="rounded-xl bg-neutral-50 px-4 py-5 text-sm text-neutral-500">Este condominio no tiene administradores activos disponibles.</div>
          ) : (
            <>
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">Destinatarios · {selectedIds.length} seleccionados</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {admins.map((admin) => {
                    const selected = selectedIds.includes(admin.id)
                    return <label key={admin.id} className={`cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${selected ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}><input type="checkbox" checked={selected} onChange={() => toggleRecipient(admin.id)} className="sr-only" /><span>{admin.name}</span></label>
                  })}
                </div>
              </fieldset>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <label className="text-xs font-semibold text-neutral-600">Título
                  <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="Ej. Próximo vencimiento" className="mt-2 w-full rounded-xl border border-neutral-200 px-3.5 py-3 text-sm focus:border-black focus:outline-none" />
                </label>
                <label className="text-xs font-semibold text-neutral-600 lg:row-span-2">Mensaje
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} required rows={5} placeholder="Escribe el contexto comercial necesario." className="mt-2 w-full resize-y rounded-xl border border-neutral-200 px-3.5 py-3 text-sm leading-6 focus:border-black focus:outline-none" />
                </label>
                <div className="rounded-xl bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-500">La entrega in-app no depende del correo. Solo se intenta email cuando la configuración global está habilitada.</div>
              </div>

              {error && <p role="alert" className="mt-4 rounded-xl border border-red/20 bg-red/[0.05] px-4 py-3 text-sm text-red">{error}</p>}
              {success && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success/[0.06] px-4 py-3 text-sm text-success"><CheckCircle2 className="h-4 w-4" />{success}</p>}

              <div className="mt-5 flex justify-end">
                <button type="submit" disabled={sending || selectedIds.length === 0 || title.trim().length < 3 || message.trim().length < 3} className="btn-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {sending ? 'Enviando…' : 'Enviar notificación'}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </section>
  )
}
