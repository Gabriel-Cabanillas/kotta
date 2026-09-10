'use client'

import { useId, useState } from 'react'
import { Mail, MessageCircle, Plus } from 'lucide-react'

const FAQS = [
  ['¿Cómo se calcula el precio de Kotta?', 'De 1 a 100 viviendas cuesta $3,500 MXN + IVA al mes. De 101 a 300 se suman $15 por vivienda adicional a 100. De 301 a 600, el precio parte de $6,500 y se suman $18 por vivienda adicional a 300. Para más de 600 viviendas se prepara una cotización Enterprise personalizada.'],
  ['¿Todas las funcionalidades están incluidas?', 'Sí. El precio cambia por el número de viviendas y la modalidad de contratación, no por módulos bloqueados.'],
  ['¿Cuál es la diferencia entre mensual y contrato anual?', 'La modalidad mensual conserva el precio completo, no tiene permanencia y puede cancelarse sin penalización. El contrato anual incluye 10% de descuento y un compromiso de 12 meses. En ambos casos el pago sigue siendo mensual; el contrato anual no se paga por adelantado.'],
  ['¿Cómo se contrata Kotta?', 'El condominio se registra y verifica su cuenta. Después, la contratación se formaliza directamente con Kotta y el servicio queda pendiente hasta completar la configuración comercial y la activación.'],
  ['¿Cómo se paga la suscripción?', 'Los pagos se realizan mediante transferencia bancaria o SPEI a la cuenta indicada por Kotta durante la contratación.'],
  ['¿Cuánto tiempo tengo para pagar?', 'Tienes 10 días naturales a partir de la fecha de la mensualidad correspondiente.'],
  ['¿Qué pasa si me atraso?', 'Se aplica una penalización única del 5% sobre el monto vencido del servicio. Si pasan 15 días naturales después del vencimiento sin regularizar el pago, Kotta puede suspender temporalmente el servicio.'],
  ['¿Puedo cancelar?', 'En la modalidad mensual puedes cancelar sin penalización por terminación. En el contrato anual existe un compromiso de 12 meses y una terminación anticipada puede generar una penalización conforme a las condiciones contractuales.'],
  ['¿Necesito descargar una aplicación?', 'No. Kotta es una plataforma web y se utiliza desde el navegador de un teléfono o computadora.'],
  ['¿Puedo administrar más de un condominio?', 'Sí. Cada condominio funciona como una organización independiente, con sus propios usuarios y datos. Su precio se calcula individualmente.'],
] as const

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return <div className="border-b border-neutral-200"><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={id} className="flex w-full items-center justify-between gap-5 py-5 text-left"><span className="text-sm font-medium text-black sm:text-base">{question}</span><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 transition ${open ? 'rotate-45 bg-black text-white' : 'text-black'}`}><Plus className="h-4 w-4" /></span></button><div id={id} className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><p className="max-w-2xl pb-6 pr-12 text-sm leading-6 text-neutral-500">{answer}</p></div></div></div>
}

export default function FAQ() {
  return (
    <section id="faq" className="bg-neutral-50 py-20 md:py-28">
      <div className="container-kotta grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Preguntas frecuentes</p><h2 className="mt-4 text-3xl font-medium tracking-tight text-black md:text-5xl">Información clara antes de comenzar.</h2><p className="mt-5 max-w-md text-sm leading-6 text-neutral-500">Si necesitas revisar tu caso, puedes hablar directamente con el equipo de Kotta.</p><div className="mt-8 flex flex-col gap-2 sm:flex-row lg:flex-col"><a href="https://wa.me/526699999999?text=Hola,%20tengo%20una%20pregunta%20sobre%20Kotta" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-black"><MessageCircle className="h-4 w-4" />Hablar por WhatsApp</a><a href="mailto:hola@kotta.com.mx" className="inline-flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-black"><Mail className="h-4 w-4" />hola@kotta.com.mx</a></div></div>
        <div className="border-t border-neutral-200">{FAQS.map(([question, answer]) => <FaqItem key={question} question={question} answer={answer} />)}</div>
      </div>
    </section>
  )
}
