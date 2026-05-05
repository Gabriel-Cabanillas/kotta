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