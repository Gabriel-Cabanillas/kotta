import { getSession } from '@/lib/auth'
import { NotificationService } from '@/lib/notifications/notification-service'

const ALLOWED_ROLES = new Set(['KOTTA_STAFF', 'ADMIN', 'VECINO', 'PROVEEDOR', 'GUARDIA'])

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getSession()
  if (!user || !ALLOWED_ROLES.has(user.role)) {
    return Response.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const requestedFilter = searchParams.get('filter')
  const filter = requestedFilter === 'unread' || requestedFilter === 'read' ? requestedFilter : 'all'
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '30', 10) || 30))

  try {
    const result = await NotificationService.listForUser({ userId: user.id, filter, page, pageSize })
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('No fue posible consultar notificaciones.', error instanceof Error ? error.name : 'UnknownError')
    return Response.json({ error: 'No fue posible consultar tus notificaciones.' }, { status: 500 })
  }
}
