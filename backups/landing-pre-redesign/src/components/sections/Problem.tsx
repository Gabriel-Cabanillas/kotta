import Image from 'next/image'
import { AlertCircle, FolderX, TrendingDown, type LucideIcon } from 'lucide-react'

interface PainPoint {
  id: string
  icon: LucideIcon
  title: string
  dolor: string
  realidad: string
}

const PAIN_POINTS: PainPoint[] = [
  {
    id: 'whatsapp',
    icon: AlertCircle,
    title: 'WhatsApp no es un sistema de gestión',
    dolor:
      'Los reportes de fallas se pierden en chats caóticos llenos de mensajes repetidos. Nadie sabe quién atiende la incidencia, si ya se fue asignada o cuándo se resolverá.',
    realidad: '¿Ya arreglaron la fuga del área común? Nadie me avisó nada.',
  },
  {
    id: 'bitacoras',
    icon: FolderX,
    title: 'Bitácoras perdidas e infraestructura a ciegas',
    dolor:
      'El historial clínico de portones, albercas y bombas de agua vive en cuadernos de papel en caseta. Sin mantenimiento preventivo calendarizado, los equipos se descomponen antes de tiempo y las reparaciones se pagan basándose solo en la palabra del proveedor.',
    realidad: 'Se volvió a romper la bomba de la alberca. ¿No le habían dado servicio el mes pasado?',
  },
  {
    id: 'desconfianza',
    icon: TrendingDown,
    title: 'Desconfianza vecinal por falta de evidencias',
    dolor:
      'Los residentes asumen que sus cuotas se administran mal porque los reportes tradicionales de Excel no muestran mejoras físicas reales en el condominio. No hay un canal transparente para validar el trabajo.',
    realidad: '¿Por qué sigue subiendo la cuota si yo veo el coto exactamente igual?',
  },
]

export default function OperationalGapSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-32">
      {/* Textura inferior izquierda */}
      <Image
        src="/Textura_7.png"
        alt=""
        width={400}
        height={400}
        aria-hidden="true"
        className="pointer-events-none select-none absolute bottom-0 left-0 z-0 h-auto w-[30%] max-w-[400px] object-contain object-left-bottom"
      />

      {/* Textura superior derecha */}
      <Image
        src="/Textura_5.png"
        alt=""
        width={550}
        height={550}
        aria-hidden="true"
        className="pointer-events-none select-none absolute top-0 right-0 z-0 h-auto w-[45%] max-w-[550px] object-contain object-right-top"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        <h2 className="mb-6 max-w-3xl font-gotham text-3xl font-medium tracking-tight text-black md:text-5xl">
          El vacío operativo que las aplicaciones tradicionales ignoran
        </h2>

        <p className="mb-16 max-w-2xl text-base font-book italic leading-relaxed text-neutral-600 md:text-lg">
          "Las herramientas actuales solo sirven para cobrar cuotas y enviar PDFs mensuales. Kotta
          resuelve el verdadero dolor de cabeza de un coto: el caos en el mantenimiento, la falta
          de evidencia y la desorganización en campo."
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {PAIN_POINTS.map((point) => {
            const Icon = point.icon
            return (
              <article
                key={point.id}
                className="flex h-full flex-col justify-between rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm"
              >
                <div>
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </div>

                  <h3 className="mb-6 text-lg font-semibold leading-snug text-black">
                    {point.title}
                  </h3>

                  <span className="mb-2 block text-xs font-bold tracking-wider text-neutral-400">
                    EL DOLOR
                  </span>
                  <p className="mb-8 text-sm leading-relaxed text-neutral-600">{point.dolor}</p>
                </div>

                <div>
                  <div className="my-4 border-t border-neutral-100" />

                  <span className="mb-2 block text-xs font-bold tracking-wider text-neutral-400">
                    LA REALIDAD
                  </span>
                  <p className="border-l-2 border-neutral-300 pl-3 text-sm italic text-neutral-800">
                    &ldquo;{point.realidad}&rdquo;
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        <p className="mx-auto mb-8 mt-16 max-w-3xl text-center font-sans text-base font-medium leading-relaxed text-black md:text-lg">
          &ldquo;No es que los administradores sean desorganizados. Es que nunca tuvieron una
          herramienta diseñada específicamente para la integridad física de su comunidad.&rdquo;
        </p>

        <a
          href="#como-funciona"
          className="mx-auto table text-center rounded-xl border border-black bg-white px-6 py-2.5 text-sm font-medium text-black transition-all duration-300 hover:bg-black hover:text-white"
        >
          Solución →
        </a>
      </div>
    </section>
  )
}