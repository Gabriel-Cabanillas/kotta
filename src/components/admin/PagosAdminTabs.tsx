/** Organiza el panel de pagos en vistas de resumen, movimientos y cargos. */
'use client'

import { useState } from 'react'
import PanelFinanciero from './PanelFinanciero'
import MovimientosFinancieros, { type MovimientoFinanciero } from './MovimientosFinancieros'
import AlertasPendientes, { type AlertaCargoVencido, type AlertaProveedorPendiente, type AlertaTransferenciaFallida } from './AlertasPendientes'
import PagosList from './PagosList'

type Tab = 'RESUMEN' | 'MOVIMIENTOS' | 'CARGOS'
const TABS: Array<{ id: Tab; etiqueta: string }> = [{ id: 'RESUMEN', etiqueta: 'Resumen' }, { id: 'MOVIMIENTOS', etiqueta: 'Movimientos' }, { id: 'CARGOS', etiqueta: 'Cargos' }]

export default function PagosAdminTabs({ resumen, movimientos, totalMovimientos, cargos, vecinos, alertas, rutas }: { resumen: { ingresos: number; egresos: number; balanceNeto: number; saldoDisponible: number }; movimientos: MovimientoFinanciero[]; totalMovimientos: number; cargos: any[]; vecinos: any[]; alertas: { cargosVencidos: AlertaCargoVencido[]; proveedoresPendientes: AlertaProveedorPendiente[]; transferenciasFallidas: AlertaTransferenciaFallida[] }; rutas: { usuarios: string; ordenes: string; configuracion: string } }) {
  const [tabActiva, setTabActiva] = useState<Tab>('RESUMEN')
  return <div><nav className="flex flex-wrap gap-2 mb-8" aria-label="Secciones de pagos">{TABS.map((tab) => <button key={tab.id} onClick={() => setTabActiva(tab.id)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${tabActiva === tab.id ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-100 hover:text-neutral-900 hover:border-neutral-200'}`}>{tab.etiqueta}</button>)}</nav>{tabActiva === 'RESUMEN' && <><PanelFinanciero resumen={resumen} /><AlertasPendientes {...alertas} onVerCargos={() => setTabActiva('CARGOS')} usuariosHref={rutas.usuarios} ordenesHref={rutas.ordenes} configuracionHref={rutas.configuracion} /></>}{tabActiva === 'MOVIMIENTOS' && <MovimientosFinancieros movimientos={movimientos} totalMovimientos={totalMovimientos} />}{tabActiva === 'CARGOS' && <section><div className="mb-4"><h2 className="font-display text-xl text-[#0F1F34]">Gestión de cargos</h2><p className="text-sm text-[#6B7A99] mt-1">Asigna cargos y consulta el estado de pago de cada vivienda.</p></div><PagosList cargos={cargos} vecinos={vecinos} /></section>}</div>
}
