import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ConfiguracionForm from '@/components/admin/ConfiguracionForm'
import RetiroSaldoCondominio from '@/components/admin/RetiroSaldoCondominio'
import { calcularDisponibleAhoraCoto, obtenerLiquidezPlataformaMx } from '@/lib/stripe/balance'
import KottaPlanCard from '@/components/admin/KottaPlanCard'

const ESTADOS_COMPROMETIDOS: Array<'PENDIENTE' | 'PROCESANDO' | 'PAGADO'> = [
  'PENDIENTE',
  'PROCESANDO',
  'PAGADO',
]

export default async function ConfiguracionPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  const [cuentaConectada, subscription] = await Promise.all([
    prisma.cuentaConectada.findUnique({ where: { orgId: user.org!.id }, select: { payoutsEnabled: true, detailsSubmitted: true } }),
    prisma.kottaSubscription.findUnique({ where: { organizationId: user.org!.id } }),
  ])

  const [cobros, distribuciones] = await Promise.all([
    prisma.pago.findMany({
      where: {
        orgId: user.org!.id,
        tipoOperacion: 'CARGO',
        estado: 'PAGADO',
        enPlataforma: true,
      },
      select: { monto: true, montoNeto: true },
    }),
    prisma.distribucionPago.findMany({
      where: {
        orgId: user.org!.id,
        origenManual: false,
        estado: { in: ESTADOS_COMPROMETIDOS },
      },
      select: { monto: true, comisionEstimada: true },
    }),
  ])
  const saldoDisponible = Math.max(
    0,
    cobros.reduce((total, cobro) => total + Number(cobro.montoNeto ?? cobro.monto), 0)
      - distribuciones.reduce((total, distribucion) => total + Number(distribucion.monto) + Number(distribucion.comisionEstimada ?? 0), 0)
  )
  const liquidezStripe = await obtenerLiquidezPlataformaMx().catch((error) => {
    console.error('No fue posible consultar la liquidez de Stripe para el retiro:', error)
    return null
  })
  const disponibleAhora = liquidezStripe ? calcularDisponibleAhoraCoto(saldoDisponible, liquidezStripe.disponible) : null
  const enLiquidacion = disponibleAhora === null ? null : Math.max(0, saldoDisponible - disponibleAhora)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Configuración</h1>
        <p className="text-sm text-[#6B7A99]">Datos generales del condominio</p>
      </div>
      <ConfiguracionForm org={user.org as any} cuentaConectada={cuentaConectada} />
      <div className="mt-6 max-w-xl"><KottaPlanCard plan={subscription ? { ...subscription, baseMonthlyPrice: subscription.baseMonthlyPrice ? Number(subscription.baseMonthlyPrice) : null, discountRate: subscription.discountRate ? Number(subscription.discountRate) : null, contractedMonthlyPrice: subscription.contractedMonthlyPrice ? Number(subscription.contractedMonthlyPrice) : null, vatRate: subscription.vatRate ? Number(subscription.vatRate) : null } : null} /></div>
      <div className="mt-6 max-w-xl">
        <RetiroSaldoCondominio
          saldoContable={saldoDisponible}
          disponibleAhora={disponibleAhora}
          enLiquidacion={enLiquidacion}
          cuentaLista={cuentaConectada?.payoutsEnabled === true}
        />
      </div>
    </div>
  )
}
