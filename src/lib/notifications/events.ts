export const NOTIFICATIONS_UPDATED_EVENT = 'kotta:notifications-updated'

export function announceNotificationsUpdated() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT))
}
