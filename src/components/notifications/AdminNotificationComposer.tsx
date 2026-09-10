'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, Send, UserRound, Users } from 'lucide-react'
import type { NotificationRecipientOption } from '@/lib/notifications/types'

type RecipientRole = NotificationRecipientOption['role']

const ROLE_LABELS: Record<RecipientRole, string> = {
  VECINO: 'Vecinos',
  PROVEEDOR: 'Proveedores',
  GUARDIA: 'Guardias',
}

export default function AdminNotificationComposer({ backHref }: { backHref: string }) {
  const requestKeyRef = useRef('')
  const [recipients, setRecipients] = useState<NotificationRecipientOption[]>([])
  const [audience, setAudience] = useState<'ROLE' | 'USER'>('ROLE')
  const [role, setRole] = useState<RecipientRole>('VECINO')
  const [recipientUserId, setRecipientUserId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loadingRecipients, setLoadingRecipients] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<number | null>(null)

  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const response = await fetch('/api/notificaciones/admin/destinatarios', { cache: 'no-store' })
        const data = await response.json() as { recipients?: NotificationRecipientOption[]; error?: string }
        if (!response.ok) throw new Error(data.error ?? 'No fue posible consultar los destinatarios.')
        setRecipients(data.recipients ?? [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No fue posible consultar los destinatarios.')
      } finally {
        setLoadingRecipients(false)
      }
    }
    void loadRecipients()
  }, [])

  const recipientCount = useMemo(() => (
    audience === 'ROLE'
      ? recipients.filter((recipient) => recipient.role === role).length
      : recipientUserId ? 1 : 0
  ), [audience, recipientUserId, recipients, role])

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (recipientCount === 0) return
    setSending(true)
    setError(null)
    setSuccess(null)

    try {
      if (!requestKeyRef.current) requestKeyRef.current = crypto.randomUUID()
      const response = await fetch('/api/notificaciones/admin/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          role: audience === 'ROLE' ? role : undefined,
          recipientUserId: audience === 'USER' ? recipientUserId : undefined,
          title,
          message,
          idempotencyKey: requestKeyRef.current,
        }),
      })
      const data = await response.json() as { error?: string; created?: number; recipients?: number }
      if (!response.ok) throw new Error(data.error ?? 'No fue posible enviar el comunicado.')
      setSuccess(data.recipients ?? data.created ?? recipientCount)
      setTitle('')
      setMessage('')
      requestKeyRef.current = ''
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'No fue posible enviar el comunicado.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Volver a notificaciones
      </Link>

      <header className="mt-5 border-b border-neutral-200 pb-7">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">Comunicado interno</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-neutral-900">Nueva notificación</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Envía un aviso a vecinos, proveedores o guardias de este condominio. La organización se obtiene de tu sesión.</p>
      </header>

      <form onSubmit={send} className="mt-7 grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,31,52,0.04)] sm:p-7">
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">Destinatarios</legend>
            <div className="mt-3 grid grid-cols-2 rounded-xl bg-neutral-100 p-1">
              <button type="button" onClick={() => setAudience('ROLE')} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${audience === 'ROLE' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}><Users className="h-4 w-4" />Grupo por rol</button>
              <button type="button" onClick={() => setAudience('USER')} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${audience === 'USER' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}><UserRound className="h-4 w-4" />Usuario</button>
            </div>

            {audience === 'ROLE' ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {(Object.keys(ROLE_LABELS) as RecipientRole[]).map((recipientRole) => {
                  const count = recipients.filter((recipient) => recipient.role === recipientRole).length
                  return <button key={recipientRole} type="button" onClick={() => setRole(recipientRole)} className={`rounded-xl border px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${role === recipientRole ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}><span className="block text-sm font-semibold">{ROLE_LABELS[recipientRole]}</span><span className={`mt-1 block text-xs ${role === recipientRole ? 'text-white/55' : 'text-neutral-400'}`}>{count} activos</span></button>
                })}
              </div>
            ) : (
              <label className="mt-4 block text-xs font-semibold text-neutral-600">Usuario específico
                <select value={recipientUserId} onChange={(event) => setRecipientUserId(event.target.value)} disabled={loadingRecipients} className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm text-neutral-900 focus:border-black focus:outline-none disabled:bg-neutral-50">
                  <option value="">Selecciona un usuario</option>
                  {recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.name} · {ROLE_LABELS[recipient.role]}{recipient.detail ? ` · ${recipient.detail}` : ''}</option>)}
                </select>
              </label>
            )}
          </fieldset>

          <div className="mt-7 border-t border-neutral-100 pt-6">
            <label className="block text-xs font-semibold text-neutral-600">Título
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="Ej. Mantenimiento programado" className="mt-2 w-full rounded-xl border border-neutral-200 px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-black focus:outline-none" />
            </label>
            <label className="mt-5 block text-xs font-semibold text-neutral-600">Mensaje
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} required rows={7} placeholder="Escribe un mensaje claro y con el contexto necesario." className="mt-2 w-full resize-y rounded-xl border border-neutral-200 px-3.5 py-3 text-sm leading-6 text-neutral-900 placeholder:text-neutral-300 focus:border-black focus:outline-none" />
            </label>
            <div className="mt-2 flex justify-end text-[11px] text-neutral-400">{message.length}/4000</div>
          </div>

          {error && <p role="alert" className="mt-5 rounded-xl border border-red/20 bg-red/[0.05] px-4 py-3 text-sm text-red">{error}</p>}
          {success !== null && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-success/20 bg-success/[0.06] px-4 py-3 text-sm text-success"><CheckCircle2 className="h-4 w-4" />Comunicado creado dentro de Kotta para {success} {success === 1 ? 'usuario' : 'usuarios'}.</p>}
        </div>

        <aside className="rounded-2xl bg-black p-5 text-white lg:sticky lg:top-24">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/45">Resumen de entrega</p>
          <p className="mt-5 text-4xl font-semibold tabular-nums">{recipientCount}</p>
          <p className="mt-1 text-sm text-white/50">{recipientCount === 1 ? 'destinatario' : 'destinatarios'}</p>
          <div className="my-5 h-px bg-white/10" />
          <p className="text-xs leading-5 text-white/50">La notificación in-app se crea siempre. El email solo se intenta cuando el canal está habilitado por Kotta.</p>
          <button type="submit" disabled={sending || loadingRecipients || recipientCount === 0 || title.trim().length < 3 || message.trim().length < 3} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {sending ? 'Enviando…' : 'Enviar notificación'}
          </button>
        </aside>
      </form>
    </div>
  )
}
