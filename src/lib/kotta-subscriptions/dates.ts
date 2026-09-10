export function addCalendarDays(value: Date, days: number) {
  const result = new Date(value)
  result.setDate(result.getDate() + days)
  return result
}

export function addCalendarMonths(value: Date, months: number) {
  const result = new Date(value)
  const targetDay = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(targetDay, lastDay))
  return result
}

export const nextInvoiceDate = (serviceStart: Date) => addCalendarMonths(serviceStart, 1)
export const paymentDueDate = (invoiceDate: Date) => addCalendarDays(invoiceDate, 10)
export const suspensionEligibleDate = (dueDate: Date) => addCalendarDays(dueDate, 15)
export const annualRenewalDate = (serviceStart: Date) => addCalendarMonths(serviceStart, 12)
export const periodFromDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
export const formatCommercialDate = (date: Date | null | undefined) => date
  ? date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Pendiente'

export function parseCalendarDate(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${field} no es una fecha válida.`)
  const [year, month, day] = value.split('-').map(Number)
  const result = new Date(year, month - 1, day, 12, 0, 0, 0)
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) throw new Error(`${field} no es una fecha válida.`)
  return result
}

