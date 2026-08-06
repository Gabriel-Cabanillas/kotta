/**
 * Listas de desgloses financieros calculados en el servidor para el resumen.
 * Presenta inicialmente los cinco mayores importes de cada agrupación.
 */
'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Users } from 'lucide-react'

type Fila = { id: string; etiqueta: string; monto: number }
type Periodo = { id: string; etiqueta: string; ingresos: number; egresos: number }

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

function ListaDesglose({ titulo, descripcion, filas, Icono, tono }: { titulo: string; descripcion: string; filas: Fila[]; Icono: typeof ArrowDownLeft; tono: string }) {
  const [verTodos, setVerTodos] = useState(false)
  const visibles = verTodos ? filas : filas.slice(0, 5)
  return <article className="bg-white rounded-2xl border border-neutral-100 p-5"><div className="flex items-start gap-3 mb-4"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tono}`}><Icono className="w-4 h-4" strokeWidth={2} /></div><div><h3 className="text-sm font-medium text-neutral-900">{titulo}</h3><p className="text-xs text-neutral-400 mt-0.5">{descripcion}</p></div></div>{visibles.length === 0 ? <p className="text-sm text-neutral-400 py-5">Sin movimientos confirmados este mes.</p> : <div className="divide-y divide-neutral-100">{visibles.map((fila) => <div key={fila.id} className="flex items-center justify-between gap-3 py-2.5"><p className="text-sm text-neutral-700 truncate">{fila.etiqueta}</p><p className="text-sm font-medium text-neutral-900 whitespace-nowrap">{moneda.format(fila.monto)}</p></div>)}</div>}{filas.length > 5 && <button onClick={() => setVerTodos(!verTodos)} className="text-xs font-medium text-red hover:text-neutral-900 mt-4">{verTodos ? 'Ver menos' : `Ver los ${filas.length} registros`}</button>}</article>
}

export default function DesglosesFinancieros({ ingresosPorConcepto, ingresosPorVecino, egresosPorProveedor, egresosPorServicio, periodos }: { ingresosPorConcepto: Fila[]; ingresosPorVecino: Fila[]; egresosPorProveedor: Fila[]; egresosPorServicio: Fila[]; periodos: Periodo[] }) {
  return <section className="mt-8" aria-labelledby="desgloses-financieros"><div className="mb-4"><h2 id="desgloses-financieros" className="font-display text-xl text-[#0F1F34]">Desgloses del mes</h2><p className="text-sm text-[#6B7A99] mt-1">Cobros y pagos confirmados, organizados para seguimiento operativo.</p></div><div className="grid gap-4 lg:grid-cols-2"><ListaDesglose titulo="Ingresos por concepto" descripcion="Cobros que quedaron en plataforma" filas={ingresosPorConcepto} Icono={ArrowDownLeft} tono="bg-success/10 text-success" /><ListaDesglose titulo="Ingresos por vivienda" descripcion="Vecinos con cobros confirmados" filas={ingresosPorVecino} Icono={Users} tono="bg-success/10 text-success" /><ListaDesglose titulo="Egresos por proveedor" descripcion="Pagos confirmados a proveedores" filas={egresosPorProveedor} Icono={ArrowUpRight} tono="bg-red/10 text-red" /><ListaDesglose titulo="Egresos por servicio" descripcion="Categoría del ticket asociado a la orden" filas={egresosPorServicio} Icono={ArrowUpRight} tono="bg-red/10 text-red" /></div><article className="bg-white rounded-2xl border border-neutral-100 p-5 mt-4"><div className="flex items-center gap-3 mb-4"><div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center"><CalendarDays className="w-4 h-4" strokeWidth={2} /></div><div><h3 className="text-sm font-medium text-neutral-900">Actividad por periodo</h3><p className="text-xs text-neutral-400 mt-0.5">Últimos seis meses; base para las gráficas posteriores.</p></div></div><div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{periodos.map((periodo) => <div key={periodo.id} className="rounded-xl bg-neutral-100/60 p-3"><p className="text-xs font-medium text-neutral-500 capitalize">{periodo.etiqueta}</p><p className="text-xs text-success mt-2">+{moneda.format(periodo.ingresos)}</p><p className="text-xs text-red mt-1">−{moneda.format(periodo.egresos)}</p></div>)}</div></article></section>
}
