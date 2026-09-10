'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, ChevronRight } from 'lucide-react'
import { announceNotificationsUpdated, NOTIFICATIONS_UPDATED_EVENT } from '@/lib/notifications/events'
import { formatNotificationDate } from '@/lib/notifications/format'
import type { NotificationListItem, NotificationListResponse } from '@/lib/notifications/types'

export default function NotificationBell({ centerHref }: { centerHref: string }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationListItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/notificaciones?limit=5', { cache: 'no-store' })
      if (!response.ok) throw new Error('No disponible')
      const data = await response.json() as NotificationListResponse
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = window.setInterval(load, 60_000)
    const onFocus = () => void load()
    const onUpdate = () => void load()
    window.addEventListener('focus', onFocus)
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate)
    }
  }, [load])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const openNotification = async (notification: NotificationListItem) => {
    if (!notification.isRead) {
      const response = await fetch(`/api/notificaciones/${notification.id}/leer`, { method: 'PATCH' })
      if (response.ok) announceNotificationsUpdated()
    }
    setOpen(false)
    router.push(notification.href ?? centerHref)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-100 bg-white text-neutral-500 transition-all duration-200 hover:border-neutral-200 hover:bg-neutral-50 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Vista previa de notificaciones"
          className="absolute right-0 top-12 z-50 w-[min(23rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_22px_60px_rgba(15,31,52,0.16)] animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Notificaciones</p>
              <p className="mt-0.5 text-xs text-neutral-400">{unreadCount === 0 ? 'Todo está al día' : `${unreadCount} sin leer`}</p>
            </div>
            {loading && <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-300" />}
          </div>

          <div className="max-h-[25rem] overflow-y-auto">
            {error ? (
              <button type="button" onClick={() => void load()} className="w-full px-5 py-8 text-center text-sm text-neutral-500 hover:bg-neutral-50">
                No pudimos actualizar. Intentar de nuevo.
              </button>
            ) : notifications.length === 0 && !loading ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><Bell className="h-4 w-4" /></div>
                <p className="mt-3 text-sm font-medium text-neutral-800">Sin notificaciones</p>
                <p className="mt-1 text-xs text-neutral-400">Los avisos importantes aparecerán aquí.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => void openNotification(notification)}
                  className="group relative flex w-full gap-3 border-b border-neutral-100 px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-neutral-50 focus:outline-none focus-visible:bg-neutral-50"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? 'bg-neutral-200' : 'bg-red'}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${notification.isRead ? 'font-medium text-neutral-600' : 'font-semibold text-neutral-900'}`}>{notification.title}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-neutral-400">{notification.message}</span>
                    <span className="mt-2 block text-[11px] text-neutral-400">{formatNotificationDate(notification.createdAt)}</span>
                  </span>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-500" />
                </button>
              ))
            )}
          </div>

          <Link href={centerHref} onClick={() => setOpen(false)} className="flex items-center justify-center border-t border-neutral-100 px-5 py-3.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black">
            Ver todas
          </Link>
        </div>
      )}
    </div>
  )
}
