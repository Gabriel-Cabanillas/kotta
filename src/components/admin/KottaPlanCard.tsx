import { CalendarDays, CheckCircle2 } from 'lucide-react'
type Plan = { status: string; housingUnits: number | null; billingMode: string | null; isEnterprise: boolean; baseMonthlyPrice: number | null; discountRate: number | null; contractedMonthlyPrice: number | null; vatRate: number | null; nextInvoiceAt: Date | null; nextPaymentDueAt: Date | null; renewalAt: Date | null }
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
const date = (v: Date | null) => v?.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) ?? 'Pendiente'
const statusLabel: Record<string, string> = {
  ACTIVE: 'Activo',
  PAST_DUE: 'Pago vencido',
  SUSPENDED: 'Suspendido',
  PENDING_ACTIVATION: 'Pendiente de activación',
  CANCELED: 'Cancelado',
}
const statusStyle: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  PAST_DUE: 'bg-amber-50 text-amber-700',
  SUSPENDED: 'bg-red-50 text-red-700',
  PENDING_ACTIVATION: 'bg-amber-50 text-amber-700',
  CANCELED: 'bg-neutral-100 text-neutral-600',
}
export default function KottaPlanCard({ plan }: { plan: Plan | null }) {
  if (!plan) return <section className="rounded-2xl border border-neutral-100 bg-white p-6"><h2 className="font-display text-xl text-[#0F1F34]">Tu plan de Kotta</h2><p className="mt-3 text-sm text-neutral-500">Esta organización conserva acceso legacy y todavía no tiene configuración comercial registrada.</p><p className="mt-5 border-t border-neutral-100 pt-4 text-xs leading-5 text-neutral-400">Para cambios en tu plan, contratación o facturación, contacta a Kotta.</p></section>
  const subtotal = plan.contractedMonthlyPrice ?? 0; const vat = subtotal * (plan.vatRate ?? .16); const title = `Kotta ${plan.isEnterprise ? 'Enterprise — ' : ''}${plan.billingMode === 'ANNUAL' ? 'Anual' : 'Mensual'}`
  return <section className="rounded-2xl border border-neutral-100 bg-white p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">Tu plan de Kotta</p><h2 className="mt-2 font-display text-xl text-[#0F1F34]">{title}</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[plan.status] ?? 'bg-neutral-100 text-neutral-600'}`}>{statusLabel[plan.status] ?? plan.status}</span></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><p className="text-sm text-neutral-500">Viviendas<br/><b className="text-neutral-900">{plan.housingUnits ?? 'Pendiente'}</b></p><p className="text-sm text-neutral-500">Permanencia<br/><b className="text-neutral-900">{plan.billingMode === 'ANNUAL' ? `Hasta ${date(plan.renewalAt)}` : 'Sin permanencia'}</b></p><p className="text-sm text-neutral-500">Precio base<br/><b className="text-neutral-900">{plan.baseMonthlyPrice === null ? 'Pendiente' : money.format(plan.baseMonthlyPrice)}</b></p><p className="text-sm text-neutral-500">Descuento<br/><b className="text-neutral-900">{((plan.discountRate ?? 0) * 100).toFixed(0)}%</b></p><p className="text-sm text-neutral-500">Subtotal mensual<br/><b className="text-neutral-900">{money.format(subtotal)}</b></p><p className="text-sm text-neutral-500">IVA<br/><b className="text-neutral-900">{money.format(vat)}</b></p></div><div className="mt-5 rounded-xl bg-[#F7F9FC] p-4"><p className="text-xs text-neutral-400">Total mensual</p><p className="mt-1 font-display text-2xl text-[#0F1F34]">{money.format(subtotal + vat)}</p></div><div className="mt-5 flex flex-col gap-2 text-sm text-neutral-600 sm:flex-row sm:gap-6"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />Factura: {date(plan.nextInvoiceAt)}</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Límite: {date(plan.nextPaymentDueAt)}</span></div><p className="mt-5 border-t border-neutral-100 pt-4 text-xs leading-5 text-neutral-400">Para cambios en tu plan, contratación o facturación, contacta a Kotta.</p></section>
}
