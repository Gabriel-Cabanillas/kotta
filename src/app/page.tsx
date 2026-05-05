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