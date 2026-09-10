import { ArrowDown, Check } from 'lucide-react'

const STEPS = [
  ['01', 'Registro', 'Crea el condominio y la cuenta del administrador.'],
  ['02', 'Verificación', 'Confirma el correo para completar el acceso de la cuenta.'],
  ['03', 'Contratación', 'Kotta define contigo viviendas, modalidad, precio y condiciones.'],
  ['04', 'Activación', 'Después del pago inicial, Kotta habilita comercialmente el servicio.'],
  ['05', 'Operación', 'El equipo entra a sus paneles y comienza a trabajar.'],
] as const

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#F1F1EF] py-24 md:py-36">
      <div className="container-kotta">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24"><div className="lg:sticky lg:top-28 lg:self-start"><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Empezar con Kotta</p><h2 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.035em] text-black md:text-6xl">Cinco momentos. Un solo camino.</h2><p className="mt-6 max-w-md text-base leading-7 text-neutral-500">La cuenta del administrador se verifica primero. La contratación y activación del condominio se completan después con Kotta.</p><a href="#precio" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-black">Conocer modalidades <ArrowDown className="h-4 w-4" /></a></div>
          <ol className="border-t border-black">{STEPS.map(([number, title, description], index) => <li key={number} className="group grid grid-cols-[52px_1fr] gap-4 border-b border-black py-8 sm:grid-cols-[80px_0.55fr_1fr] sm:items-center sm:gap-6 sm:py-10"><span className="font-mono text-xs text-neutral-400">{number}</span><h3 className="text-2xl font-medium tracking-tight text-black transition-transform duration-300 group-hover:translate-x-1 md:text-3xl">{title}</h3><p className="col-start-2 text-sm leading-6 text-neutral-500 sm:col-start-auto">{description}</p>{index < STEPS.length - 1 && <span className="sr-only">Siguiente paso</span>}</li>)}</ol></div>
        <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-neutral-300 pt-6 text-xs text-neutral-500">{['Contratación directa con Kotta', 'Pago por transferencia o SPEI', 'Pagos mensuales en ambas modalidades'].map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-black" />{item}</span>)}</div>
      </div>
    </section>
  )
}
