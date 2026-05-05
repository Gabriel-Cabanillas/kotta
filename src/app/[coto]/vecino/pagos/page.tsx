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
    PAGADO:    { color: '#1DB87E', bg: '#E6F9F1', label: 'Pagado'    },
    PENDIENTE: { color: '#F5A623', bg: '#FEF3E2', label: 'Pendiente' },
    VENCIDO:   { color: '#E8503A', bg: '#FEECEA', label: 'Vencido'   },
  }

  const totalPagado = pagos.filter((p) => p.status === 'PAGADO').reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[#0F1F34] mb-1">Mis pagos</h1>
        <p className="text-sm text-[#6B7A99]">Historial de cuotas del condominio</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pagados',    value: pagos.filter((p) => p.status === 'PAGADO').length,    color: '#1DB87E' },
          { label: 'Pendientes', value: pagos.filter((p) => p.status === 'PENDIENTE').length, color: '#F5A623' },
          { label: 'Vencidos',   value: pagos.filter((p) => p.status === 'VENCIDO').length,   color: '#E8503A' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <p className="text-xs text-[#6B7A99] mb-2">{s.label}</p>
            <p className="font-display text-3xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {pagos.length === 0 ? (
          <div className="py-16 text-center"><p className="text-[#6B7A99] text-sm">No hay pagos registrados aún.</p></div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {pagos.map((pago) => {
              const st = STATUS_CONFIG[pago.status] ?? STATUS_CONFIG.PENDIENTE
              return (
                <div key={pago.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#0F1F34]">{MESES[pago.month - 1]} {pago.year}</p>
                    <p className="text-xs text-[#6B7A99] mt-0.5">${Number(pago.amount).toLocaleString('es-MX')} MXN
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
          <p className="text-xs text-[#6B7A99]">Total pagado: <span className="font-medium text-[#1DB87E]">${totalPagado.toLocaleString('es-MX')} MXN</span></p>
        </div>
      )}
    </div>
  )
}