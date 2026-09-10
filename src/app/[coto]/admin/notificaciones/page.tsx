import NotificationCenter from '@/components/notifications/NotificationCenter'

export const dynamic = 'force-dynamic'

export default function AdminNotificationsPage({ params }: { params: { coto: string } }) {
  return (
    <NotificationCenter
      composeHref={`/${params.coto}/admin/notificaciones/nueva`}
      description="Comunicados del condominio, avisos operativos y mensajes de Kotta para la administración."
    />
  )
}
