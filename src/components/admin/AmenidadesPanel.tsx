/**
 * Panel con pestañas para la sección de Amenidades del admin.
 * Contiene el interruptor entre el catalogo de amenidades y las solicitudes
 * de reserva pendientes de aprobacion, manteniendo ambas vistas ordenadas
 * dentro de la misma seccion en vez de dispersarlas en el sidebar.
 * Se relaciona con AmenidadesList, AdminReservasList y
 * app/[coto]/admin/amenidades/page.tsx.
 * Existe para darle al ADMIN un solo lugar donde configurar amenidades y
 * resolver las solicitudes que generan los vecinos.
 */
'use client'

import { useState } from 'react'
import AmenidadesList from './AmenidadesList'
import AdminReservasList from './AdminReservasList'

export default function AmenidadesPanel({
  amenidades,
  reservaciones,
  coto,
}: {
  amenidades: any[]
  reservaciones: any[]
  coto: string
}) {
  const [tab, setTab] = useState<'catalogo' | 'solicitudes'>('catalogo')
  const pendientes = reservaciones.filter((r) => r.status === 'PENDIENTE').length

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-100">
        <button
          onClick={() => setTab('catalogo')}
          className={`relative px-1 pb-3 mr-6 text-sm font-medium transition-colors ${
            tab === 'catalogo' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-900'
          }`}
        >
          Catálogo
          {tab === 'catalogo' && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-black rounded-full" />}
        </button>
        <button
          onClick={() => setTab('solicitudes')}
          className={`relative px-1 pb-3 mr-6 text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'solicitudes' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-900'
          }`}
        >
          Solicitudes de reserva
          {pendientes > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium text-white bg-red rounded-full">
              {pendientes}
            </span>
          )}
          {tab === 'solicitudes' && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-black rounded-full" />}
        </button>
      </div>

      {tab === 'catalogo' ? (
        <AmenidadesList amenidades={amenidades} coto={coto} />
      ) : (
        <AdminReservasList reservaciones={reservaciones} />
      )}
    </div>
  )
}