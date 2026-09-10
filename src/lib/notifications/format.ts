export function formatNotificationDate(value: string | Date, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  const differenceMs = date.getTime() - now.getTime()
  const absoluteMs = Math.abs(differenceMs)

  if (Number.isNaN(date.getTime())) return ''
  if (absoluteMs < 60_000) return 'Ahora'

  const formatter = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })
  if (absoluteMs < 3_600_000) return formatter.format(Math.round(differenceMs / 60_000), 'minute')
  if (absoluteMs < 86_400_000) return formatter.format(Math.round(differenceMs / 3_600_000), 'hour')
  if (absoluteMs < 7 * 86_400_000) return formatter.format(Math.round(differenceMs / 86_400_000), 'day')

  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
