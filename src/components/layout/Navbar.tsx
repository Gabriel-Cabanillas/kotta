'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { cn } from '@/components/lib/utils'

const CONTACT_URL = 'https://wa.me/526699999999?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Kotta'
const NAV_LINKS = [
  { label: 'Producto', href: '#producto' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Precios', href: '#precio' },
  { label: 'FAQ', href: '#faq' },
] as const

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-500', scrolled || menuOpen ? 'border-black/[0.07] bg-white/95 shadow-[0_1px_18px_rgba(0,0,0,0.045)] backdrop-blur-xl' : 'border-transparent bg-white/75 backdrop-blur-md')}>
      <div className="landing-shell">
        <nav className={cn('flex items-center justify-between transition-[height] duration-500', scrolled ? 'h-16' : 'h-[72px]')} aria-label="Navegación principal">
          <a href="#inicio" className="landing-focus flex rounded-sm" aria-label="Kotta, ir al inicio"><img src="/Logo_for_kotta.svg" alt="Kotta" className="h-8 w-auto" /></a>
          <ul className="hidden items-center gap-1 lg:flex">{NAV_LINKS.map((link) => <li key={link.href}><a href={link.href} className="landing-focus group relative px-3.5 py-2 text-sm font-medium text-neutral-500 transition-colors duration-300 hover:text-black"><span>{link.label}</span><span className="absolute inset-x-3.5 bottom-1 h-px origin-left scale-x-0 bg-black transition-transform duration-300 group-hover:scale-x-100" /></a></li>)}</ul>
          <div className="hidden items-center gap-2 lg:flex"><a href="/sign-in" className="landing-focus rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:text-black">Iniciar sesión</a><a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="landing-focus group inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-900 hover:shadow-black">Solicitar información <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" /></a></div>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="landing-focus rounded-lg p-2 text-neutral-700 lg:hidden" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </nav>
      </div>
      <div id="mobile-menu" className={cn('overflow-hidden bg-white transition-all duration-500 lg:hidden', menuOpen ? 'max-h-[480px] border-t border-neutral-100 opacity-100' : 'max-h-0 opacity-0')}>
        <div className="landing-shell flex flex-col gap-1 py-4">{NAV_LINKS.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="landing-focus rounded-lg px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50">{link.label}</a>)}<div className="mt-2 grid gap-2 border-t border-neutral-100 pt-4"><a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">Solicitar información</a><a href="/sign-in" className="btn-ghost justify-center">Iniciar sesión</a></div></div>
      </div>
    </header>
  )
}
