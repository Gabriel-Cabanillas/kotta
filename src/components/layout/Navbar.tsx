'use client'

/**
 * Navegacion fija de la landing publica.
 * Contiene los enlaces a las secciones comerciales, el CTA principal y el menu movil.
 * Se relaciona con src/app/page.tsx y con las secciones ancladas por id
 * dentro de src/components/sections.
 * Existe dentro de Kotta para orientar al visitante por la historia de venta
 * y mantener visible el camino hacia precio o contratacion.
 */

import { useState, useEffect } from 'react'
import { cn } from '@/components/lib/utils'

const NAV_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Características', href: '#caracteristicas' },
  { label: 'Precio', href: '#precio' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="container-kotta">
        <nav className="flex items-center justify-between h-16 md:h-18">

          {/* Logo */}  
        <a href="#" className="flex items-center" aria-label="KOTTA inicio">
        <img
            src="/Logocompleto.svg"
            alt="KOTTA"
            className="h-8 w-auto"
        />
        </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="px-3.5 py-2 text-sm font-medium text-[#4A5568] hover:text-[#1E3A5F] rounded-lg hover:bg-[#F7F9FC] transition-all duration-150"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#precio" className="btn-ghost text-sm py-2 px-4">
              Ver precio
            </a>

            {/*Este botón llevara a la página del Login */}
            <a href="/sign-in" className="btn-primary text-sm py-2.5 px-5">
              Login
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#4A5568] hover:text-[#1E3A5F] hover:bg-[#F7F9FC] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 bg-white border-b border-[#E2E8F0]',
          menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="container-kotta py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-[#4A5568] hover:text-[#1E3A5F] rounded-lg hover:bg-[#F7F9FC] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 mt-2 border-t border-[#E2E8F0]">
            <a href="/sign-in" className="btn-primary text-sm py-2.5 px-5">
                Login
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}