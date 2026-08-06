/** Vista interna cross-org de las disputas activas que deben atenderse en Stripe. */
import { Role } from '@prisma/client'
import { AlertTriangle, ArrowLeft, ExternalLink, Scale } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import KottaStaffLogout from '@/components/kotta-staff/KottaStaffLogout'

const ESTADOS_ACTIVOS = ['warning_needs_response', 'warning_under_review', 'needs_response', 'under_review']
const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

export default async function DisputasKottaStaffPage() {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== Role.KOTTA_STAFF) redirect('/dashboard')

  // Consulta cross-org intencional: la ruta se protege exclusivamente con KOTTA_STAFF.
  const disputas = await prisma.disputaStripe.findMany({
    where: { estadoStripe: { in: ESTADOS_ACTIVOS } },
    orderBy: [{ fechaLimite: 'asc' }, { creadaEn: 'desc' }],
    include: {
      pago: {
        select: {
          id: true,
          cargo: { select: { concepto: true } },
          vecino: { select: { name: true } },
          org: { select: { name: true } },
        },
      },
    },
  })
  const limiteProxima = new Date(Date.now() + 72 * 60 * 60 * 1000)
  const proximas = disputas.filter((disputa) => disputa.fechaLimite && disputa.fechaLimite <= limiteProxima).length

  return (
    <main className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-neutral-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-[#FD5F56]">KOTTA · INTERNO</p>
            <h1 className="mt-2 font-display text-3xl tracking-tight text-neutral-900">Disputas activas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Seguimiento operativo. La evidencia se administra directamente en el dashboard de Stripe.</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-neutral-500">{user.name}</p>
            <KottaStaffLogout />
          </div>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/kotta-staff/conciliacion" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-950">
            <ArrowLeft className="h-4 w-4" /> Volver a conciliación
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm ring-1 ring-neutral-100">
            <AlertTriangle className="h-4 w-4 text-[#FD5F56]" />
            {disputas.length} activa{disputas.length === 1 ? '' : 's'} · {proximas} con fecha límite próxima
          </div>
        </div>

        {disputas.length === 0 ? (
          <section className="rounded-2xl border border-neutral-100 bg-white px-6 py-14 text-center shadow-sm">
            <Scale className="mx-auto h-7 w-7 text-[#2BC842]" />
            <h2 className="mt-4 font-display text-xl text-neutral-900">No hay disputas activas</h2>
            <p className="mt-2 text-sm text-neutral-500">Stripe no reporta casos que requieran evidencia o seguimiento en este momento.</p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 border-b border-neutral-100 bg-neutral-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
              <span>Caso y condominio</span><span>Motivo y fecha límite</span><span className="text-right">Acción</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {disputas.map((disputa) => {
                const vencePronto = disputa.fechaLimite && disputa.fechaLimite <= limiteProxima
                return (
                  <article key={disputa.id} className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
                    <div>
                      <p className="font-medium text-neutral-900">{disputa.pago.org.name}</p>
                      <p className="mt-1 text-sm text-neutral-600">{disputa.pago.cargo?.concepto ?? 'Cargo sin concepto'} · {disputa.pago.vecino?.name ?? 'Vecino no disponible'}</p>
                      <p className="mt-2 font-display text-lg text-neutral-900">{moneda.format(Number(disputa.monto))}</p>
                    </div>
                    <div className="text-sm text-neutral-600">
                      <p>Motivo: <span className="font-medium text-neutral-800">{disputa.motivo}</span></p>
                      <p className={vencePronto ? 'mt-1 font-medium text-[#FD5F56]' : 'mt-1'}>
                        Fecha límite: {disputa.fechaLimite ? disputa.fechaLimite.toLocaleDateString('es-MX', { dateStyle: 'long' }) : 'No informada por Stripe'}
                      </p>
                    </div>
                    <a href={`https://dashboard.stripe.com/disputes/${disputa.stripeDisputeId}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700">
                      Abrir en Stripe <ExternalLink className="h-4 w-4" />
                    </a>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
