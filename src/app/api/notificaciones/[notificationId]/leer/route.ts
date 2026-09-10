import { getSession } from '@/lib/auth'
import { NotificationService } from '@/lib/notifications/notification-service'
import { NotificationPolicyError } from '@/lib/notifications/policy'

export async function PATCH(_request: Request, { params }: { params: { notificationId: string } }) {
  const user = await getSession()
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 403 })
  if (!params.notificationId) return Response.json({ error: 'Notificación no válida.' }, { status: 400 })

  try {
    await NotificationService.markRead(user.id, params.notificationId)
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof NotificationPolicyError) {
      return Response.json({ error: error.message }, { status: 404 })
    }
    console.error('No fue posible marcar una notificación.', error instanceof Error ? error.name : 'UnknownError')
    return Response.json({ error: 'No fue posible actualizar la notificación.' }, { status: 500 })
  }
}
