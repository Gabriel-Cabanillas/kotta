/**
 * Pagina publica principal de Kotta.
 * Contiene la composicion narrativa de la landing: navegacion, hero, problema,
 * proceso, funcionalidades, pilares, precio, preguntas frecuentes, cierre comercial y footer.
 * Se relaciona con los componentes de src/components/layout/Navbar.tsx y
 * src/components/sections para construir la experiencia completa de venta.
 * Existe dentro de Kotta para presentar el producto a administradores de condominios
 * y guiarlos desde la propuesta de valor hasta la contratacion.
 */

{/* Landin Page */}




import Navbar   from '@/components/layout/Navbar'
import Hero     from '@/components/sections/Hero'
import Problem  from '@/components/sections/Problem'
import HowItWorks from '@/components/sections/Howitworks'
import Features from '@/components/sections/Features'

import Pillars from '@/components/sections/Pillars'
import Pricing from '@/components/sections/Pricing'
import FAQ from '@/components/sections/FAQ'
import CTAFinal from '@/components/sections/CTAFinal'
import Footer from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Pillars />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
      {/* Las siguientes secciones se construirán paso a paso */}
    </main>
  )
}