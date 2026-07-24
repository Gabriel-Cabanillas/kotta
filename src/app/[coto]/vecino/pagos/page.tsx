import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default async function VecinoPagos({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'VECINO') redirect('/dashboard')

  const pagos = await prisma.payment.findMany({
    where: { userId: user.id }, orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    PAGADO:    { color: '#1E8A34', bg: 'rgba(43,200,66,0.12)',  label: 'Pagado'    },
    PENDIENTE: { color: '#B8860B', bg: 'rgba(255,186,46,0.16)', label: 'Pendiente' },
    VENCIDO:   { color: '#D8352C', bg: 'rgba(253,95,86,0.12)',  label: 'Vencido'   },
  }

  const totalPagado = pagos.filter((p) => p.status === 'PAGADO').reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-gotham text-2xl text-neutral-900 mb-1">Mis pagos</h1>
        <p className="text-sm text-neutral-400">Historial de cuotas del condominio</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pagados',    value: pagos.filter((p) => p.status === 'PAGADO').length,    color: '#1E8A34' },
          { label: 'Pendientes', value: pagos.filter((p) => p.status === 'PENDIENTE').length, color: '#B8860B' },
          { label: 'Vencidos',   value: pagos.filter((p) => p.status === 'VENCIDO').length,   color: '#D8352C' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
            <p className="text-xs text-neutral-400 mb-2">{s.label}</p>
            <p className="font-gotham text-4xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {pagos.length === 0 ? (
          <div className="py-16 text-center"><p className="text-neutral-400 text-sm">No hay pagos registrados aún.</p></div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {pagos.map((pago) => {
              const st = STATUS_CONFIG[pago.status] ?? STATUS_CONFIG.PENDIENTE
              return (
                <div key={pago.id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-100/60 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{MESES[pago.month - 1]} {pago.year}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">${Number(pago.amount).toLocaleString('es-MX')} MXN
                      {pago.paidAt && <span> · Pagado el {new Date(pago.paidAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {totalPagado > 0 && (
        <div className="mt-4 text-right">
          <p className="text-xs text-neutral-400">Total pagado: <span className="font-medium" style={{ color: '#1E8A34' }}>${totalPagado.toLocaleString('es-MX')} MXN</span></p>
        </div>
      )}
    </div>
  )
}