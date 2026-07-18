/**
 * Terminos de Uso — landing publica.
 * Regula el acceso y uso de la plataforma KOTTA por parte de administradores,
 * vecinos, guardias y proveedores: cuentas, suscripcion, obligaciones,
 * propiedad intelectual y limites de responsabilidad.
 * Se enlaza desde el Footer ("/terminos").
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Uso | KOTTA',
  description:
    'Términos y condiciones de uso de la plataforma KOTTA para administradores, vecinos, guardias y proveedores.',
}

const LAST_UPDATED = '12 de julio de 2026'

export default function TerminosPage() {
  return (
    <main className="bg-white">
      {/* Header */}
      <div className="border-b border-neutral-100">
        <div className="container-kotta py-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-black transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver al inicio
          </a>
          <h1 className="font-gotham text-3xl md:text-4xl text-black mt-6">
            Términos de Uso
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Última actualización: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container-kotta py-14">
        <div className="max-w-3xl mx-auto space-y-12 text-neutral-800 leading-relaxed">

          <p>
            Estos Términos de Uso regulan el acceso y uso de la plataforma KOTTA (el "Servicio"), operada por{' '}
            <strong className="text-black">Gabriel Cabanillas Cabanillas</strong>, Persona Física con Actividad
            Empresarial inscrita en el Régimen Simplificado de Confianza (RESICO), con domicilio fiscal en
            Mazatlán, Sinaloa, México y RFC <strong className="text-black">CACG060902888</strong>, operando bajo el
            nombre comercial <strong className="text-black">KOTTA</strong> ("KOTTA", "nosotros"). Al crear una
            cuenta o utilizar el Servicio, aceptas estos términos. Si no estás de acuerdo, no debes utilizar la
            plataforma.
          </p>

          {/* 1 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">1. Descripción del servicio</h2>
            <p>
              KOTTA es una plataforma de software como servicio (SaaS) para la administración de condominios y
              residenciales privados en México. Centraliza cobro de cuotas, control de acceso, bitácoras de
              mantenimiento, comunicación entre residentes y gestión de proveedores, a través de cuatro roles:
              Administrador, Vecino, Guardia y Proveedor.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">2. Cuentas y roles</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Cada usuario es responsable de la confidencialidad de sus credenciales de acceso.</li>
              <li>
                El <strong className="text-black">Administrador</strong> es responsable de la configuración del
                condominio, la asignación de roles y la veracidad de la información capturada en la plataforma.
              </li>
              <li>Debes proporcionar información veraz y mantenerla actualizada.</li>
              <li>
                Eres responsable de toda actividad realizada desde tu cuenta. Notifícanos de inmediato ante
                cualquier uso no autorizado.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">3. Planes, precios y facturación</h2>
            <p>
              El Servicio se contrata mediante un plan de suscripción mensual (Esencial, Pro o Enterprise), cuyo
              precio depende del número de viviendas administradas. Todos los roles de usuario están incluidos
              en cada plan, sin cargos adicionales por usuario.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>La suscripción se renueva automáticamente cada mes salvo cancelación previa.</li>
              <li>Los precios vigentes se muestran en la sección de planes de nuestro sitio.</li>
              <li>
                Puedes cambiar de plan o cancelar tu suscripción en cualquier momento; los cambios aplican en el
                siguiente ciclo de facturación, salvo que se indique lo contrario al momento de la contratación.
              </li>
              <li>La falta de pago puede resultar en la suspensión temporal del acceso al Servicio.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">4. Uso aceptable</h2>
            <p className="mb-3">Al usar KOTTA, te comprometes a no:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Utilizar la plataforma para fines ilícitos o contrarios a estos Términos.</li>
              <li>Intentar vulnerar la seguridad del Servicio o acceder a datos de otros condominios sin autorización.</li>
              <li>Cargar contenido difamatorio, fraudulento o que infrinja derechos de terceros.</li>
              <li>Realizar ingeniería inversa, copiar o revender el Servicio sin autorización expresa de KOTTA.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">5. Datos y contenido del usuario</h2>
            <p>
              La información que captures en KOTTA (cuotas, bitácoras, reportes, comunicados) sigue siendo
              propiedad tuya o de tu condominio. Nos otorgas una licencia limitada para almacenar y procesar esa
              información con el único fin de operar el Servicio. El tratamiento de datos personales se rige por
              nuestro{' '}
              <a href="/privacidad" className="text-black underline underline-offset-2 hover:text-neutral-400">
                Aviso de Privacidad
              </a>.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">6. Propiedad intelectual</h2>
            <p>
              El software, diseño, marca y contenido de KOTTA son propiedad de{' '}
              <strong className="text-black">Gabriel Cabanillas Cabanillas</strong>, operando bajo el nombre
              comercial KOTTA, y están protegidos por la legislación aplicable en materia de propiedad
              intelectual. Estos Términos no te otorgan ningún
              derecho de propiedad sobre el Servicio, más allá de la licencia de uso necesaria para operarlo
              conforme a tu plan contratado.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">7. Disponibilidad del servicio</h2>
            <p>
              Trabajamos para mantener KOTTA disponible de forma continua, pero no garantizamos que el Servicio
              esté libre de interrupciones. Podemos realizar mantenimientos programados, previa notificación
              cuando sea posible, y no somos responsables por interrupciones causadas por terceros (proveedores
              de infraestructura, conectividad del usuario, etc.).
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">8. Suspensión y terminación</h2>
            <p>
              Podemos suspender o cancelar tu acceso al Servicio si incumples estos Términos, por falta de pago,
              o por uso indebido de la plataforma. Puedes cancelar tu cuenta en cualquier momento contactándonos;
              la cancelación no genera reembolsos de periodos ya facturados, salvo que la ley aplicable indique
              lo contrario.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">9. Limitación de responsabilidad</h2>
            <p>
              KOTTA se ofrece "tal cual" y "según disponibilidad". En la medida permitida por la ley, no seremos
              responsables por daños indirectos, incidentales o consecuentes derivados del uso del Servicio,
              incluyendo pérdida de datos, ingresos o decisiones tomadas por el condominio con base en la
              información capturada en la plataforma.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">10. Modificaciones a estos Términos</h2>
            <p>
              Podemos actualizar estos Términos de Uso periódicamente. Notificaremos cambios relevantes a través
              de la plataforma o por correo electrónico, y la fecha de "última actualización" reflejará la
              versión vigente.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">11. Legislación aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia
              relacionada con el Servicio, las partes se someten a los tribunales competentes de{' '}
              <strong className="text-black">Mazatlán, Sinaloa, México</strong>, renunciando a cualquier otro
              fuero que pudiera corresponderles por razón de su domicilio presente o futuro.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">12. Contacto</h2>
            <p>
              Si tienes preguntas sobre estos Términos de Uso, escríbenos a{' '}
              <a href="mailto:hola@kotta.com.mx" className="text-black underline underline-offset-2 hover:text-neutral-400">
                hola@kotta.com.mx
              </a>.
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}