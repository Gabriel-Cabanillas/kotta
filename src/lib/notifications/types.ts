export type NotificationListItem = {
  id: string
  type: string
  origin: 'MANUAL' | 'SYSTEM'
  title: string
  message: string
  href: string | null
  readAt: string | null
  isRead: boolean
  createdAt: string
  actorName: string | null
}

export type NotificationListResponse = {
  notifications: NotificationListItem[]
  unreadCount: number
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type NotificationRecipientOption = {
  id: string
  name: string
  role: 'VECINO' | 'PROVEEDOR' | 'GUARDIA'
  detail: string | null
}
