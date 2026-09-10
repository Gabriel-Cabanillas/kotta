const LABELS: Record<string, string> = { PENDING_ACTIVATION: 'Pendiente', ACTIVE: 'Activo', PAST_DUE: 'Pago vencido', SUSPENDED: 'Suspendido', CANCELED: 'Cancelado', LEGACY: 'Sin configuración comercial' }
const STYLES: Record<string, string> = { PENDING_ACTIVATION: 'bg-amber-50 text-amber-700', ACTIVE: 'bg-emerald-50 text-emerald-700', PAST_DUE: 'bg-orange-50 text-orange-700', SUSPENDED: 'bg-red-50 text-red-700', CANCELED: 'bg-neutral-100 text-neutral-600', LEGACY: 'bg-slate-100 text-slate-600' }
export default function SubscriptionStatusBadge({ status }: { status: string }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] ?? STYLES.LEGACY}`}>{LABELS[status] ?? status}</span> }

