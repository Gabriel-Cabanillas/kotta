import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CargosPendientes from '@/components/vecino/CargosPendientes'

/**
 * Muestra los cargos Stripe que pertenecen al vecino autenticado.
 *
 * Se relaciona con CargoDestinatario, Cargo y Pago. Existe para separar los
 * cargos pendientes del historial confirmado con el flujo Stripe activo.
 */
export default async function VecinoPagos({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'VECINO') redirect('/dashboard')

  const destinatarios = await prisma.cargoDestinatario.findMany({
    where: { viviendaId: user.id },
    include: {
      cargo: {
        include: {
          // Cada Cargo puede tener pagos de varios vecinos. Esta consulta se
          // limita al vecino autenticado y toma solamente su intento mas reciente.
          pagos: {
            where: { vecinoId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { estado: true, monto: true, updatedAt: true },
          },
        },
      },
    },
    orderBy: { cargo: { fechaLimite: 'asc' } },
  })

  const cargos = destinatarios.map((destinatario) => ({
    ...destinatario.cargo,
    ultimoPago: destinatario.cargo.pagos[0] ?? null,
  }))
  const cargosPendientes = cargos.filter((cargo) => cargo.ultimoPago?.estado !== 'PAGADO')
  const historialPagos = cargos.filter((cargo) => cargo.ultimoPago?.estado === 'PAGADO')

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioProximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
  const pagosDelMes = historialPagos.filter((cargo) => {
    const fechaPago = new Date(cargo.ultimoPago!.updatedAt)
    return fechaPago >= inicioMes && fechaPago < inicioProximoMes
  })
  const totalPagadoMes = pagosDelMes.reduce(
    (total, cargo) => total + Number(cargo.ultimoPago!.monto),
    0
  )
  const cargosVencidos = cargos.filter(
    (cargo) => new Date(cargo.fechaLimite) < ahora && cargo.ultimoPago?.estado !== 'PAGADO'
  )

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-gotham text-2xl text-neutral-900 mb-1">Mis pagos</h1>
        <p className="text-sm text-neutral-400">Cargos pendientes e historial de pagos</p>
      </div>

      {cargosPendientes.length > 0 && (
        <div className="mb-8">
          <CargosPendientes cargos={cargosPendientes as any} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pagados', value: historialPagos.length, color: '#1E8A34' },
          { label: 'Pendientes', value: cargosPendientes.length, color: '#B8860B' },
          { label: 'Vencidos', value: cargosVencidos.length, color: '#D8352C' },
        ].map((metrica) => (
          <div key={metrica.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
            <p className="text-xs text-neutral-400 mb-2">{metrica.label}</p>
            <p className="font-gotham text-4xl" style={{ color: metrica.color }}>{metrica.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-medium text-neutral-900">Historial de pagos</h2>
        </div>
        {historialPagos.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-400 text-sm">Aun no hay pagos confirmados.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {historialPagos.map((cargo) => (
              <div key={cargo.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-100/60 transition-colors">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{cargo.concepto}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    ${Number(cargo.monto).toLocaleString('es-MX')} MXN
                    {' - Pagado el '}
                    {new Date(cargo.ultimoPago!.updatedAt).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full text-success bg-success/10">
                  Pagado
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-4 text-right">
        <p className="text-xs text-neutral-400">
          Total pagado este mes:{' '}
          <span className="font-medium" style={{ color: '#1E8A34' }}>
            ${totalPagadoMes.toLocaleString('es-MX')} MXN
          </span>
        </p>
      </div>
    </div>
  )
}
