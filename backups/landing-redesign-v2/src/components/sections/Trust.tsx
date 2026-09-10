import { CheckCircle2 } from 'lucide-react'

const FACTS = [
  ['Separación por condominio', 'Cada organización conserva sus propios usuarios, configuración y datos.'],
  ['Roles y permisos', 'Administrador, vecino, proveedor y guardia acceden a experiencias distintas.'],
  ['Trazabilidad operativa', 'Los reportes, movimientos y cambios mantienen contexto e historial.'],
  ['Plataforma web', 'El equipo trabaja desde el navegador, sin depender de una instalación local.'],
] as const

export default function Trust() {
  return (
    <section className="bg-black py-24 text-white md:py-36">
      <div className="container-kotta">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Confianza por diseño</p><h2 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.06] tracking-[-0.04em] md:text-6xl">La confianza no necesita promesas grandes. Necesita información clara.</h2><p className="mt-7 max-w-xl text-base leading-7 text-white/50">Kotta organiza la operación para que cada acción tenga un lugar, un responsable y un contexto dentro del condominio.</p></div><div className="border-t border-white/20">{FACTS.map(([title, description]) => <div key={title} className="grid grid-cols-[auto_1fr] gap-4 border-b border-white/20 py-6"><CheckCircle2 className="mt-0.5 h-4 w-4 text-white/70" /><div><p className="text-sm font-medium text-white">{title}</p><p className="mt-2 text-sm leading-6 text-white/40">{description}</p></div></div>)}</div></div>
      </div>
    </section>
  )
}
