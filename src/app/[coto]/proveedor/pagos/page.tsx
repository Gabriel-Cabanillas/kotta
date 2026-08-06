/**
 * Historial de distribuciones enviadas al proveedor autenticado.
 * Muestra el contexto de cada orden y ticket sin exponer pagos de otros
 * proveedores u organizaciones.
 */
import { CircleDollarSign, ClipboardList, RotateCcw } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProveedorNavbar from '@/components/proveedor/ProveedorNavbar'

const ESTADO_CONFIG: Record<string, { etiqueta: string; clases: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', clases: 'text-amber-700 bg-amber-50' },
  PROCESANDO: { etiqueta: 'Procesando', clases: 'text-blue-700 bg-blue-50' },
  PAGADO: { etiqueta: 'Pagado', clases: 'text-success bg-success/10' },
  FALLIDO: { etiqueta: 'Fallido', clases: 'text-red bg-red/10' },
  REEMBOLSADO: { etiqueta: 'Reembolsado', clases: 'text-neutral-600 bg-neutral-100' },
}

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

export default async function ProveedorPagos({
  params,
}: {
  params: { coto: string }
}) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'PROVEEDOR') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const cuentaConectada = await prisma.cuentaConectada.findUnique({
    where: { proveedorId: user.id },
    select: { id: true },
  })

  const distribuciones = cuentaConectada
    ? await prisma.distribucionPago.findMany({
        where: {
          destino: 'PROVEEDOR',
          cuentaConectadaId: cuentaConectada.id,
          orgId: user.orgId,
        },
        include: {
          workOrder: {
            include: {
              ticket: {
                select: { folio: true, title: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
    : []

  const pagosConfirmados = distribuciones.filter(
    (distribucion) => distribucion.estado === 'PAGADO'
  )
  const pagosReembolsados = distribuciones.filter(
    (distribucion) => distribucion.estado === 'REEMBOLSADO'
  )
  const totalRecibido = pagosConfirmados.reduce(
    (total, distribucion) => total + Number(distribucion.monto),
    0
  )
  const totalReembolsado = pagosReembolsados.reduce(
    (total, distribucion) => total + Number(distribucion.monto),
    0
  )

  return (
    <div className="min-h-screen bg-white">
      <ProveedorNavbar
        user={user as any}
        orgName={user.org?.name ?? ''}
        coto={params.coto}
      />

      <main className="container-kotta py-10">
        <div className="mb-8">
          <h1 className="font-gotham text-2xl text-neutral-900 tracking-tight mb-1">
            Pagos recibidos
          </h1>
          <p className="text-sm text-neutral-400">
            Consulta las transferencias enviadas por Kotta para tus órdenes.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-3 mb-6" aria-label="Resumen de pagos">
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <CircleDollarSign className="w-5 h-5 text-success mb-4" strokeWidth={1.8} />
            <p className="text-xs text-neutral-400 mb-1">Total recibido</p>
            <p className="font-gotham text-2xl text-neutral-900">{moneda.format(totalRecibido)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <ClipboardList className="w-5 h-5 text-neutral-900 mb-4" strokeWidth={1.8} />
            <p className="text-xs text-neutral-400 mb-1">Pagos confirmados</p>
            <p className="font-gotham text-2xl text-neutral-900">{pagosConfirmados.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <RotateCcw className="w-5 h-5 text-red mb-4" strokeWidth={1.8} />
            <p className="text-xs text-neutral-400 mb-1">Monto reembolsado</p>
            <p className="font-gotham text-2xl text-neutral-900">{moneda.format(totalReembolsado)}</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-medium text-neutral-900">Historial</h2>
          </div>

          {distribuciones.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <CircleDollarSign className="w-5 h-5 text-neutral-400" strokeWidth={1.8} />
              </div>
              <p className="text-sm font-medium text-neutral-900 mb-1">Aún no hay pagos registrados</p>
              <p className="text-sm text-neutral-400">
                Las transferencias de tus órdenes aparecerán aquí cuando se confirmen.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {distribuciones.map((distribucion) => {
                const estado = ESTADO_CONFIG[distribucion.estado] ?? ESTADO_CONFIG.PENDIENTE
                const ticket = distribucion.workOrder?.ticket
                const esPagoExterno = distribucion.origenManual

                return (
                  <div
                    key={distribucion.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-neutral-100/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {ticket?.title ?? 'Transferencia sin orden asociada'}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {ticket ? `Ticket #${ticket.folio}` : 'Sin ticket asociado'}
                        {distribucion.workOrder && ' · Orden de trabajo'}
                        {' · '}
                        {new Date(distribucion.updatedAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[11px] text-neutral-400">Recibiste</p>
                        <p className="text-sm font-medium text-neutral-900">{moneda.format(Number(distribucion.monto))}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estado.clases}`}>
                        {estado.etiqueta}
                      </span>
                      {esPagoExterno && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-neutral-600 bg-neutral-100">
                          Pago externo
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
