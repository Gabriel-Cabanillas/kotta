import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { NotificationRecipientOption } from '@/lib/notifications/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN' || !admin.orgId) {
    return Response.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: {
      orgId: admin.orgId,
      isActive: true,
      role: { in: ['VECINO', 'PROVEEDOR', 'GUARDIA'] },
    },
    select: { id: true, name: true, role: true, houseNumber: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  const recipients: NotificationRecipientOption[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role as NotificationRecipientOption['role'],
    detail: user.role === 'VECINO' && user.houseNumber ? `Casa ${user.houseNumber}` : null,
  }))

  return Response.json({ recipients }, { headers: { 'Cache-Control': 'no-store' } })
}
