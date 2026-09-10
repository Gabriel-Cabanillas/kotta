import { ArrowRight, Check, FileSignature, MailCheck, Settings2, UserPlus } from 'lucide-react'

const STEPS = [
  { icon: UserPlus, number: '01', title: 'Registra tu condominio', text: 'Crea la organización y la cuenta de su administrador desde la plataforma.' },
  { icon: MailCheck, number: '02', title: 'Verifica tu cuenta', text: 'El administrador confirma su correo para completar el acceso de forma segura.' },
  { icon: FileSignature, number: '03', title: 'Formaliza la contratación', text: 'Kotta acuerda contigo viviendas, modalidad, precio y condiciones comerciales.' },
  { icon: Settings2, number: '04', title: 'Activa y empieza a operar', text: 'Después del pago inicial y la activación, el equipo puede utilizar los módulos del condominio.' },
] as const

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-neutral-100 bg-neutral-50 py-20 md:py-28">
      <div className="container-kotta">
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Cómo comenzar</p><h2 className="mt-4 text-3xl font-medium tracking-tight text-black md:text-5xl">Un proceso claro, desde el registro hasta la operación.</h2><p className="mt-5 text-base leading-7 text-neutral-500">La contratación se realiza directamente con Kotta. Tu cuenta y la activación comercial siguen procesos separados y seguros.</p></div>
        <div className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{STEPS.map(({ icon: Icon, number, title, text }) => <article key={number} className="relative rounded-2xl border border-neutral-100 bg-white p-6 shadow-card"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white"><Icon className="h-4 w-4" /></div><span className="text-xs font-medium text-neutral-300">{number}</span></div><h3 className="mt-8 text-base font-medium text-black">{title}</h3><p className="mt-3 text-sm leading-6 text-neutral-500">{text}</p></article>)}</div>
        <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><p className="text-lg font-medium text-black">Pagos mensuales en ambas modalidades.</p><p className="mt-2 text-sm text-neutral-500">Mensual sin permanencia o contrato anual con 10% de descuento y compromiso de 12 meses.</p></div><a href="#precio" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-black">Consultar precio <ArrowRight className="h-4 w-4" /></a></div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-neutral-500">{['Contratación directa', 'Pago por transferencia o SPEI', 'Todas las funcionalidades incluidas'].map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-black" />{item}</span>)}</div>
      </div>
    </section>
  )
}
