import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcularDisponibleAhoraCoto, obtenerLiquidezPlataformaMx } from '@/lib/stripe/balance'
import OrdenesList from '@/components/admin/OrdenesList'
import OrdenesListSkeleton from '@/components/admin/OrdenesListSkeleton'

export default async function OrdenesPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Órdenes de trabajo</h1>
        <p className="text-sm text-[#6B7A99]">Seguimiento de trabajos asignados a proveedores</p>
      </div>

      <Suspense fallback={<OrdenesListSkeleton />}>
        <OrdenesData orgId={user.orgId!} coto={params.coto} />
      </Suspense>
    </div>
  )
}

async function OrdenesData({ orgId, coto }: { orgId: string; coto: string }) {
  const [ordenes, cobros, distribuciones, liquidezStripe] = await Promise.all([
    prisma.workOrder.findMany({
    where: { orgId }, orderBy: { createdAt: 'desc' },
    include: {
      ticket: { include: { reportedBy: true } },
      provider: {
        include: {
          cuentaConectada: {
            select: { id: true, payoutsEnabled: true },
          },
        },
      },
      distribucionesPago: {
        where: { destino: 'PROVEEDOR' },
        select: { estado: true, origenManual: true, notaManual: true },
        take: 1,
      },
    },
    }),
    prisma.pago.findMany({
      where: { orgId, tipoOperacion: 'CARGO', estado: 'PAGADO', enPlataforma: true },
      select: { monto: true, montoNeto: true },
    }),
    prisma.distribucionPago.findMany({
      where: { orgId, origenManual: false, estado: { in: ['PENDIENTE', 'PROCESANDO', 'PAGADO'] } },
      select: { monto: true, comisionEstimada: true },
    }),
    obtenerLiquidezPlataformaMx().catch((error) => {
      console.error('No fue posible consultar la liquidez de Stripe para órdenes:', error)
      return null
    }),
  ])

  const saldoContable = Math.max(0, cobros.reduce((total, cobro) => total + Number(cobro.montoNeto ?? cobro.monto), 0) - distribuciones.reduce((total, distribucion) => total + Number(distribucion.monto) + Number(distribucion.comisionEstimada ?? 0), 0))
  const disponibleParaTransferirAhora = liquidezStripe ? calcularDisponibleAhoraCoto(saldoContable, liquidezStripe.disponible) : null
  const saldoEnLiquidacion = disponibleParaTransferirAhora === null ? null : Math.max(0, saldoContable - disponibleParaTransferirAhora)

  return <OrdenesList ordenes={ordenes as any} coto={coto} disponibleParaTransferirAhora={disponibleParaTransferirAhora} saldoEnLiquidacion={saldoEnLiquidacion} />
}
