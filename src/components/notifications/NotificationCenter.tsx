'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Bell, CheckCheck, CreditCard, Inbox, Loader2, MessageSquareText, ShieldAlert, Wrench } from 'lucide-react'
import { announceNotificationsUpdated } from '@/lib/notifications/events'
import { formatNotificationDate } from '@/lib/notifications/format'
import type { NotificationListItem, NotificationListResponse } from '@/lib/notifications/types'

type Filter = 'all' | 'unread' | 'read'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'No leídas' },
  { value: 'read', label: 'Leídas' },
]

function NotificationIcon({ type }: { type: string }) {
  if (type.includes('PAGO') || type.includes('CARGO')) return <CreditCard className="h-4 w-4" strokeWidth={1.8} />
  if (type.includes('ORDEN') || type.includes('TICKET')) return <Wrench className="h-4 w-4" strokeWidth={1.8} />
  if (type.includes('DISPUTA') || type.includes('SUSPENSION')) return <ShieldAlert className="h-4 w-4" strokeWidth={1.8} />
  if (type.includes('COMUNICADO') || type.includes('COMERCIAL')) return <MessageSquareText className="h-4 w-4" strokeWidth={1.8} />
  return <Bell className="h-4 w-4" strokeWidth={1.8} />
}

export default function NotificationCenter({
  composeHref,
  backHref,
  description = 'Avisos operativos y mensajes importantes reunidos en un solo lugar.',
}: {
  composeHref?: string
  backHref?: string
  description?: string
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [notifications, setNotifications] = useState<NotificationListItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (nextPage = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/notificaciones?filter=${filter}&page=${nextPage}&limit=20`, { cache: 'no-store' })
      const data = await response.json() as NotificationListResponse & { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'No fue posible cargar tus notificaciones.')
      setNotifications((current) => append ? [...current, ...data.notifications] : data.notifications)
      setUnreadCount(data.unreadCount)
      setTotal(data.total)
      setPage(data.page)
      setHasMore(data.hasMore)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar tus notificaciones.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filter])

  useEffect(() => {
    void load(1, false)
  }, [load])

  const markRead = async (notification: NotificationListItem, navigate: boolean) => {
    setUpdating(notification.id)
    try {
      if (!notification.isRead) {
        const response = await fetch(`/api/notificaciones/${notification.id}/leer`, { method: 'PATCH' })
        if (!response.ok) throw new Error('No fue posible marcar la notificación.')
        announceNotificationsUpdated()
      }
      if (navigate && notification.href) router.push(notification.href)
      else await load(1, false)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No fue posible actualizar la notificación.')
    } finally {
      setUpdating(null)
    }
  }

  const markAllRead = async () => {
    setUpdating('all')
    setError(null)
    try {
      const response = await fetch('/api/notificaciones/leer-todas', { method: 'POST' })
      if (!response.ok) throw new Error('No fue posible marcar todas como leídas.')
      announceNotificationsUpdated()
      await load(1, false)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No fue posible actualizar tus notificaciones.')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      {backHref && (
        <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
      )}

      <header className="flex flex-col gap-5 border-b border-neutral-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">Centro de actividad</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-neutral-900">Notificaciones</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">{description}</p>
        </div>
        {composeHref && (
          <Link href={composeHref} className="btn-primary w-fit px-5 py-2.5 text-sm">
            Nueva notificación
          </Link>
        )}
      </header>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-xl border border-neutral-200 bg-white p-1" role="tablist" aria-label="Filtrar notificaciones">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${filter === item.value ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:text-black'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-neutral-400">{unreadCount > 0 ? `${unreadCount} sin leer` : `${total} en esta vista`}</p>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={unreadCount === 0 || updating === 'all'}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            {updating === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-red/20 bg-red/[0.05] px-4 py-3 text-sm text-red">
          <span>{error}</span>
          <button type="button" onClick={() => void load(1, false)} className="shrink-0 font-semibold underline underline-offset-4">Reintentar</button>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_30px_rgba(15,31,52,0.04)]">
        {loading ? (
          <div className="divide-y divide-neutral-100" aria-label="Cargando notificaciones">
            {[0, 1, 2, 3].map((item) => <div key={item} className="flex gap-4 px-5 py-5 sm:px-6"><span className="h-10 w-10 animate-pulse rounded-xl bg-neutral-100" /><div className="flex-1"><span className="block h-3 w-2/5 animate-pulse rounded bg-neutral-100" /><span className="mt-3 block h-3 w-4/5 animate-pulse rounded bg-neutral-100" /></div></div>)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"><Inbox className="h-5 w-5" /></div>
            <h2 className="mt-5 text-base font-semibold text-neutral-900">No hay notificaciones aquí</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-400">{filter === 'unread' ? 'No tienes avisos pendientes por revisar.' : filter === 'read' ? 'Las notificaciones que leas aparecerán en esta vista.' : 'Los avisos operativos y comunicados aparecerán cuando haya actividad.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {notifications.map((notification) => (
              <article key={notification.id} className={`relative px-5 py-5 transition-colors sm:px-6 ${notification.isRead ? 'bg-white' : 'bg-[#FCFCFB]'}`}>
                {!notification.isRead && <span className="absolute bottom-5 left-0 top-5 w-[3px] rounded-r-full bg-red" />}
                <div className="flex gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.isRead ? 'bg-neutral-100 text-neutral-400' : 'bg-black text-white'}`}>
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className={`text-sm ${notification.isRead ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900'}`}>{notification.title}</h2>
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">{notification.origin === 'MANUAL' ? 'Comunicado' : 'Sistema'}</span>
                        </div>
                        <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-neutral-500">{notification.message}</p>
                      </div>
                      <time className="shrink-0 text-xs text-neutral-400" dateTime={notification.createdAt}>{formatNotificationDate(notification.createdAt)}</time>
                    </div>
                    {notification.actorName && <p className="mt-3 text-xs text-neutral-400">Enviado por {notification.actorName}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {notification.href && (
                        <button type="button" onClick={() => void markRead(notification, true)} disabled={updating === notification.id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:text-black disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
                          Abrir recurso <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {!notification.isRead && (
                        <button type="button" onClick={() => void markRead(notification, false)} disabled={updating === notification.id} className="text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
                          {updating === notification.id ? 'Actualizando…' : 'Marcar como leída'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {hasMore && !loading && (
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={() => void load(page + 1, true)} disabled={loadingMore} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:text-black disabled:opacity-50">
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} Cargar más
          </button>
        </div>
      )}
    </section>
  )
}
