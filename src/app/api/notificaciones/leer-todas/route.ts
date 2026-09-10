import { getSession } from '@/lib/auth'
import { NotificationService } from '@/lib/notifications/notification-service'

export async function POST() {
  const user = await getSession()
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 403 })

  try {
    const result = await NotificationService.markAllRead(user.id)
    return Response.json({ ok: true, updated: result.count })
  } catch (error) {
    console.error('No fue posible marcar todas las notificaciones.', error instanceof Error ? error.name : 'UnknownError')
    return Response.json({ error: 'No fue posible actualizar tus notificaciones.' }, { status: 500 })
  }
}
