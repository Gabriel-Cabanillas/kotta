/**
 * Aviso de Privacidad — landing publica.
 * Cumple con la Ley Federal de Proteccion de Datos Personales en Posesion
 * de los Particulares (publicada el 20 de marzo de 2025) y establece como
 * KOTTA recaba, usa y protege los datos personales de administradores,
 * vecinos, guardias y proveedores dentro de la plataforma.
 * Se enlaza desde el Footer ("/privacidad").
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad | KOTTA',
  description:
    'Aviso de privacidad de KOTTA: cómo recabamos, usamos y protegemos los datos personales dentro de la plataforma.',
}

const LAST_UPDATED = '12 de julio de 2026'

export default function PrivacidadPage() {
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
            Aviso de Privacidad
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
            <strong className="text-black">Gabriel Cabanillas Cabanillas</strong>, Persona Física con Actividad
            Empresarial inscrita en el Régimen Simplificado de Confianza (RESICO), operando bajo el nombre
            comercial <strong className="text-black">KOTTA</strong> ("KOTTA", "nosotros"), con domicilio fiscal en
            Mazatlán, Sinaloa, México y RFC <strong className="text-black">CACG060902888</strong>, es responsable
            del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en
            Posesión de los Particulares y su normatividad aplicable. Este Aviso de Privacidad describe qué datos
            recabamos, para qué los usamos y qué derechos tienes sobre ellos.
          </p>

          {/* 1 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">1. ¿Qué datos personales recabamos?</h2>
            <p className="mb-3">
              Dependiendo de tu rol dentro de la plataforma (Administrador, Vecino, Guardia o Proveedor),
              recabamos los siguientes tipos de datos:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-black">Datos de identificación y contacto:</strong> nombre, correo
                electrónico, teléfono, y datos de la vivienda o unidad que administras u ocupas.
              </li>
              <li>
                <strong className="text-black">Datos de cuenta:</strong> credenciales de acceso, rol asignado
                y actividad dentro de la plataforma.
              </li>
              <li>
                <strong className="text-black">Datos de pago:</strong> historial de cuotas, referencias de pago
                y estado de cuenta. KOTTA no almacena directamente los datos completos de tarjetas de pago; estos
                son procesados por proveedores de pago certificados.
              </li>
              <li>
                <strong className="text-black">Datos de control de acceso:</strong> bitácoras de entradas y
                salidas, registros de visitantes y, en su caso, fotografías o placas vehiculares capturadas por
                el módulo de control de acceso del coto o residencial.
              </li>
              <li>
                <strong className="text-black">Comunicaciones y reportes:</strong> mensajes, tickets de
                mantenimiento y comunicados generados dentro de la plataforma.
              </li>
            </ul>
            <p className="mt-3">
              Algunos de estos datos —como fotografías o registros de acceso— pueden considerarse datos
              personales sensibles bajo la ley aplicable. En esos casos, solicitamos tu consentimiento expreso
              antes de recabarlos.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">2. ¿Para qué usamos tus datos?</h2>
            <p className="mb-3"><strong className="text-black">Finalidades primarias</strong> (necesarias para prestarte el servicio):</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Crear y administrar tu cuenta y la de tu residencial o condominio.</li>
              <li>Gestionar cuotas, pagos y estados de cuenta.</li>
              <li>Operar el control de acceso, bitácoras y órdenes de trabajo con proveedores.</li>
              <li>Enviar notificaciones operativas (avisos, recibos, reportes de mantenimiento).</li>
              <li>Dar soporte técnico y atender solicitudes de administradores y vecinos.</li>
              <li>Cumplir con obligaciones legales y fiscales.</li>
            </ul>
            <p className="mt-4 mb-3"><strong className="text-black">Finalidades secundarias</strong> (opcionales, puedes oponerte sin afectar el servicio):</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Enviarte comunicados sobre nuevas funciones o mejoras del producto.</li>
              <li>Elaborar estadísticas internas para mejorar la plataforma.</li>
            </ul>
            <p className="mt-3">
              Si no deseas que tus datos se usen para finalidades secundarias, puedes indicarlo escribiendo a{' '}
              <a href="mailto:hola@kotta.com.mx" className="text-black underline underline-offset-2 hover:text-neutral-400">
                hola@kotta.com.mx
              </a>.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">3. ¿Con quién compartimos tus datos?</h2>
            <p>
              No vendemos tus datos personales. Los compartimos únicamente con terceros que nos ayudan a operar
              la plataforma, bajo acuerdos de confidencialidad y tratamiento de datos:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Proveedores de infraestructura y almacenamiento en la nube.</li>
              <li>Procesadores de pago para el cobro de cuotas.</li>
              <li>Proveedores de mensajería (correo electrónico y notificaciones).</li>
              <li>Autoridades competentes, cuando exista un requerimiento legal válido.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">4. Uso de cookies y tecnologías de rastreo</h2>
            <p>
              Nuestro sitio y plataforma utilizan cookies y tecnologías similares para mantener tu sesión activa,
              recordar preferencias y entender el uso general del sitio. Puedes deshabilitar las cookies desde la
              configuración de tu navegador; ten en cuenta que algunas funciones podrían dejar de operar
              correctamente.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">5. Derechos ARCO</h2>
            <p>
              Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte (ARCO) al tratamiento de tus datos
              personales, así como a revocar tu consentimiento en cualquier momento. Para ejercer estos derechos,
              envía tu solicitud a{' '}
              <a href="mailto:hola@kotta.com.mx" className="text-black underline underline-offset-2 hover:text-neutral-400">
                hola@kotta.com.mx
              </a>{' '}
              indicando tu nombre, el derecho que deseas ejercer y una copia de identificación oficial. Te
              responderemos dentro de los plazos que establece la ley aplicable.
            </p>
            <p className="mt-3">
              Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes acudir a
              la Secretaría Anticorrupción y Buen Gobierno, autoridad encargada de la protección de datos
              personales en posesión de particulares en México.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">6. Menores de edad</h2>
            <p>
              KOTTA está diseñado para ser utilizado por personas mayores de edad (administradores, vecinos,
              guardias y proveedores). No recabamos intencionalmente datos de menores de edad sin el
              consentimiento de sus padres o tutores.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">7. Cambios a este aviso</h2>
            <p>
              Podemos actualizar este Aviso de Privacidad para reflejar cambios en nuestras prácticas o en la
              legislación aplicable. Publicaremos cualquier cambio en esta misma página junto con la fecha de
              última actualización.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-gotham text-xl text-black mb-3">8. Contacto</h2>
            <p>
              Si tienes dudas sobre este Aviso de Privacidad, escríbenos a{' '}
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