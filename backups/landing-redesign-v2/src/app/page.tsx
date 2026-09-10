import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/sections/Hero'
import Definition from '@/components/sections/Definition'
import Problem from '@/components/sections/Problem'
import Characteristics from '@/components/sections/Characteristics'
import Roles from '@/components/sections/Roles'
import HowItWorks from '@/components/sections/Howitworks'
import Trust from '@/components/sections/Trust'
import Pricing from '@/components/sections/Pricing'
import FAQ from '@/components/sections/FAQ'
import CTAFinal from '@/components/sections/CTAFinal'
import Footer from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Definition />
      <Problem />
      <Characteristics />
      <Roles />
      <HowItWorks />
      <Trust />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  )
}
