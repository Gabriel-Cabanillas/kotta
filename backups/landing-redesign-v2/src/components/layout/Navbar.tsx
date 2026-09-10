'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { cn } from '@/components/lib/utils'

const CONTACT_URL = 'https://wa.me/526699999999?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Kotta'
const NAV_LINKS = [
  { label: 'Producto', href: '#producto' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Precios', href: '#precio' },
  { label: 'Preguntas', href: '#faq' },
] as const

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-300', scrolled || menuOpen ? 'border-b border-neutral-100 bg-white/95 shadow-sm backdrop-blur-xl' : 'bg-white/80 backdrop-blur-md')}>
      <div className="container-kotta">
        <nav className="flex h-16 items-center justify-between md:h-[72px]" aria-label="Navegación principal">
          <a href="#inicio" className="flex items-center" aria-label="Kotta, ir al inicio"><img src="/Logo_for_kotta.svg" alt="Kotta" className="h-8 w-auto" /></a>
          <ul className="hidden items-center gap-1 md:flex">{NAV_LINKS.map((link) => <li key={link.href}><a href={link.href} className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-black">{link.label}</a></li>)}</ul>
          <div className="hidden items-center gap-2 md:flex">
            <a href="/sign-in" className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-black">Iniciar sesión</a>
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary px-5 py-2.5 text-sm">Solicitar información <ArrowRight className="h-4 w-4" /></a>
          </div>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-lg p-2 text-neutral-700 md:hidden" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </nav>
      </div>
      <div id="mobile-menu" className={cn('overflow-hidden bg-white transition-all duration-300 md:hidden', menuOpen ? 'max-h-[480px] border-t border-neutral-100 opacity-100' : 'max-h-0 opacity-0')}>
        <div className="container-kotta flex flex-col gap-1 py-4">
          {NAV_LINKS.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">{link.label}</a>)}
          <div className="mt-2 grid gap-2 border-t border-neutral-100 pt-4"><a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">Solicitar información</a><a href="/sign-in" className="btn-ghost justify-center">Iniciar sesión</a></div>
        </div>
      </div>
    </header>
  )
}
