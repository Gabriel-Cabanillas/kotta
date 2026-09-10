import NotificationCenter from '@/components/notifications/NotificationCenter'

export const dynamic = 'force-dynamic'

export default function KottaStaffNotificationsPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
      <NotificationCenter description="Alertas internas, disputas y actividad relevante para el equipo de Kotta." />
    </main>
  )
}
