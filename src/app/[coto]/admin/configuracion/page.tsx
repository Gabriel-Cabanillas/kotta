import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ConfiguracionForm from '@/components/admin/ConfiguracionForm'
import RetiroSaldoCondominio from '@/components/admin/RetiroSaldoCondominio'

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

  const cuentaConectada = await prisma.cuentaConectada.findUnique({
    where: { orgId: user.org!.id },
    select: { payoutsEnabled: true, detailsSubmitted: true },
  })

  const [cobros, distribuciones] = await Promise.all([
    prisma.pago.aggregate({
      where: {
        orgId: user.org!.id,
        tipoOperacion: 'CARGO',
        estado: 'PAGADO',
        enPlataforma: true,
      },
      _sum: { monto: true },
    }),
    prisma.distribucionPago.aggregate({
      where: {
        orgId: user.org!.id,
        estado: { in: ESTADOS_COMPROMETIDOS },
      },
      _sum: { monto: true },
    }),
  ])
  const saldoDisponible = Math.max(
    0,
    Number(cobros._sum.monto ?? 0) - Number(distribuciones._sum.monto ?? 0)
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Configuración</h1>
        <p className="text-sm text-[#6B7A99]">Datos generales del condominio</p>
      </div>
      <ConfiguracionForm org={user.org as any} cuentaConectada={cuentaConectada} />
      <div className="mt-6 max-w-xl">
        <RetiroSaldoCondominio
          saldoDisponible={saldoDisponible}
          cuentaLista={cuentaConectada?.payoutsEnabled === true}
        />
      </div>
    </div>
  )
}
