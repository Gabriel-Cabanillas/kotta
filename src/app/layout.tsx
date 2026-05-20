/**
 * Define el layout raíz compartido por toda la aplicación Kotta.
 *
 * Contiene la metadata pública del sitio, la configuración base de idioma y la
 * carga global de estilos para todas las rutas del App Router.
 *
 * Se relaciona con `src/app/globals.css`, la landing page en `src/app/page.tsx`
 * y todos los layouts y páginas anidadas dentro de `src/app`.
 *
 * Existe para establecer el contenedor HTML común y los metadatos iniciales que
 * Next.js aplica en cualquier experiencia del producto.
 */
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KOTTA — Tu comunidad, bajo control',
  description: 'El sistema operativo de tu condominio.',
  metadataBase: new URL('https://kotta.com.mx'),
  openGraph: {
    title: 'KOTTA — Tu comunidad, bajo control',
    description: 'El sistema operativo de tu condominio.',
    url: 'https://kotta.com.mx',
    siteName: 'KOTTA',
    locale: 'es_MX',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
