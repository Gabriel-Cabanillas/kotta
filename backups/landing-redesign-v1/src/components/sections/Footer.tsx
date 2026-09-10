const PRODUCT_LINKS = [
  ['Producto', '#caracteristicas'],
  ['Cómo funciona', '#como-funciona'],
  ['Precios', '#precio'],
  ['Preguntas frecuentes', '#faq'],
] as const

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="container-kotta grid gap-10 py-12 md:grid-cols-[1.4fr_0.8fr_0.8fr] md:py-16">
        <div><img src="/Logocompletowhite.svg" alt="Kotta" className="h-8 w-auto" /><p className="mt-5 max-w-sm text-sm leading-6 text-white/45">La plataforma web para organizar la operación de condominios y comunidades privadas.</p></div>
        <div><p className="text-xs font-medium uppercase tracking-[0.12em] text-white/35">Producto</p><ul className="mt-5 space-y-3">{PRODUCT_LINKS.map(([label, href]) => <li key={href}><a href={href} className="text-sm text-white/55 transition hover:text-white">{label}</a></li>)}</ul></div>
        <div><p className="text-xs font-medium uppercase tracking-[0.12em] text-white/35">Contacto</p><div className="mt-5 space-y-3"><a href="https://wa.me/526699999999" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/55 transition hover:text-white">WhatsApp</a><a href="mailto:hola@kotta.com.mx" className="block text-sm text-white/55 transition hover:text-white">hola@kotta.com.mx</a><a href="/sign-in" className="block text-sm text-white/55 transition hover:text-white">Iniciar sesión</a></div></div>
      </div>
      <div className="border-t border-white/10"><div className="container-kotta flex flex-col items-center justify-between gap-3 py-5 sm:flex-row"><p className="text-xs text-white/30">© {new Date().getFullYear()} Kotta. Todos los derechos reservados.</p><div className="flex gap-5"><a href="/privacidad" className="text-xs text-white/30 hover:text-white/60">Aviso de privacidad</a><a href="/terminos" className="text-xs text-white/30 hover:text-white/60">Términos de uso</a></div></div></div>
    </footer>
  )
}
