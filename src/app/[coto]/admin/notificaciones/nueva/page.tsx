import AdminNotificationComposer from '@/components/notifications/AdminNotificationComposer'

export default function NewAdminNotificationPage({ params }: { params: { coto: string } }) {
  return <AdminNotificationComposer backHref={`/${params.coto}/admin/notificaciones`} />
}
