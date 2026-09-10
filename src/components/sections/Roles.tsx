'use client'

import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'

const ROLES = [
  { id: 'admin', number: '01', name: 'Administrador', statement: 'Ve la comunidad completa y decide con contexto.', description: 'Coordina usuarios, tickets, órdenes, pagos, activos, amenidades y accesos desde el panel operativo.', actions: ['Prioriza pendientes', 'Asigna responsables', 'Consulta historial'] },
  { id: 'vecino', number: '02', name: 'Vecino', statement: 'Resuelve lo cotidiano sin perseguir respuestas.', description: 'Consulta pagos, crea reportes, reserva amenidades y genera invitaciones desde una experiencia sencilla.', actions: ['Reporta incidencias', 'Sigue solicitudes', 'Gestiona visitas'] },
  { id: 'proveedor', number: '03', name: 'Proveedor', statement: 'Recibe el trabajo claro y documenta el resultado.', description: 'Accede a las órdenes asignadas, registra avances y carga evidencia del trabajo realizado.', actions: ['Consulta órdenes', 'Actualiza avances', 'Entrega evidencia'] },
  { id: 'guardia', number: '04', name: 'Guardia', statement: 'Valida accesos con menos pasos y más información.', description: 'Revisa invitaciones y registra entradas o salidas desde una interfaz centrada en la operación de caseta.', actions: ['Valida visitantes', 'Registra accesos', 'Consulta autorizaciones'] },
] as const

export default function Roles() {
  const [activeId, setActiveId] = useState<(typeof ROLES)[number]['id']>('admin')
  const active = ROLES.find((role) => role.id === activeId) ?? ROLES[0]
  return (
    <section className="bg-white py-24 sm:py-28 md:py-36">
      <div className="landing-shell">
        <div className="grid gap-12 lg:grid-cols-[0.62fr_1.38fr] lg:gap-20">
          <div className="landing-reveal"><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Una plataforma, cuatro perspectivas</p><h2 className="mt-4 text-4xl font-medium leading-[1.08] tracking-[-0.04em] text-black md:text-5xl">Cada persona ve lo que necesita para avanzar.</h2><p className="mt-5 max-w-md text-sm leading-7 text-neutral-500">Los roles comparten la misma operación sin cargar con herramientas que no les corresponden.</p></div>
          <div className="landing-reveal" style={{ transitionDelay: '100ms' }}>
            <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 pb-px" role="tablist" aria-label="Roles de Kotta">{ROLES.map((role) => <button key={role.id} type="button" role="tab" aria-selected={activeId === role.id} onClick={() => setActiveId(role.id)} className={`landing-focus group relative min-w-fit px-1 pb-4 pr-8 text-left transition-colors duration-300 ${activeId === role.id ? 'text-black' : 'text-neutral-300 hover:text-neutral-600'}`}><span className="mr-2 font-mono text-[10px]">{role.number}</span><span className="text-sm font-medium sm:text-base">{role.name}</span><span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-black transition-transform duration-300 ${activeId === role.id ? 'scale-x-100' : 'scale-x-0'}`} /></button>)}</div>
            <div key={activeId} className="product-panel-enter grid gap-10 py-10 sm:grid-cols-[1fr_0.7fr] sm:py-14"><div><p className="text-3xl font-medium leading-tight tracking-[-0.03em] text-black md:text-5xl">{active.statement}</p><p className="mt-6 max-w-xl text-base leading-7 text-neutral-500">{active.description}</p></div><div className="border-l border-neutral-200 pl-6"><p className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">En su panel puede</p><ul className="mt-5 space-y-4">{active.actions.map((action) => <li key={action} className="flex items-center gap-3 text-sm text-neutral-700"><Check className="h-4 w-4" />{action}</li>)}</ul><a href="#como-funciona" className="landing-focus group mt-8 inline-flex items-center gap-2 text-sm font-medium text-black">Ver el flujo <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></a></div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
