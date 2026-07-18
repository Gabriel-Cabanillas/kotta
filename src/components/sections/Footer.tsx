/**
 * Pie de pagina de la landing publica.
 * Contiene la marca, canales de contacto, enlaces internos del producto y referencias legales.
 * Se relaciona con src/app/page.tsx, Navbar y las secciones ancladas de la landing.
 * Existe dentro de Kotta para cerrar la presentacion comercial con contacto,
 * navegacion secundaria y datos institucionales.
 */

const PRODUCT_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Características', href: '#caracteristicas' },
  { label: 'Los 3 pilares', href: '#pilares' },
  { label: 'Precio', href: '#precio' },
  { label: 'FAQ', href: '#faq' },
] as const

const ROLES = [
  { label: 'Administrador', desc: 'Control total' },
  { label: 'Vecino', desc: 'Reportes y pagos' },
  { label: 'Proveedor', desc: 'Órdenes de trabajo' },
  { label: 'Guardia', desc: 'Control de acceso' },
] as const

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-black border-t border-white/10">

      {/* Main footer */}
      <div className="container-kotta py-14">
        <div className="grid md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">

            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/Logocompletowhite.svg"
                alt="KOTTA"
                className="h-8 w-auto object-contain"
              />
            </div>

            <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-xs">
              El sistema operativo de tu condominio. Gestión de tickets,
              proveedores, activos y pagos desde un solo lugar.
            </p>

            {/* Contacto */}
            <div className="space-y-2.5">
              <a
                href="https://wa.me/526699999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-white/50 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21z"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                WhatsApp
              </a>
              <a
                href="mailto:hola@kotta.com.mx"
                className="flex items-center gap-2.5 text-sm text-white/50 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/>
                  <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                hola@kotta.com.mx
              </a>
              <a
                href="https://kotta.com.mx"
                className="flex items-center gap-2.5 text-sm text-white/50 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" fill="none"/>
                  <path d="M2 12h20M12 2c-2.5 3-4 6.5-4 10s1.5 7 4 10M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                </svg>
                kotta.com.mx
              </a>
            </div>
          </div>

          {/* Producto */}
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
              Producto
            </p>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Roles */}
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
              Roles del sistema
            </p>
            <ul className="space-y-2.5">
              {ROLES.map((role) => (
                <li key={role.label}>
                  <span className="text-sm text-white/50">
                    {role.label}
                    <span className="text-white/25 ml-1">— {role.desc}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
                Acceso
              </p>
              <a
                href="#precio"
                className="inline-flex items-center gap-2 text-sm text-white hover:text-red transition-colors"
              >
                Ver planes
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-kotta py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {year} KOTTA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-5">
            <a href="/privacidad" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Aviso de privacidad
            </a>
            <a href="/terminos" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Términos de uso
            </a>
          </div>
        </div>
      </div>

    </footer>
  )
}