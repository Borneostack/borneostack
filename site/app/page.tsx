import Hero from '@/components/neural/hero'
import Hub from '@/components/neural/hub'
import Problem from '@/components/neural/problem'
import Showcase from '@/components/neural/showcase'
import Custom from '@/components/neural/custom'
import Promises from '@/components/neural/promises'
import Process from '@/components/neural/process'
import ScopeSample from '@/components/neural/scope-sample'
import Pricing from '@/components/neural/pricing'
import Company from '@/components/neural/company'
import CarePlans from '@/components/neural/care-plans'
import Reviews from '@/components/neural/reviews'
import FAQ from '@/components/neural/faq'
import CTA from '@/components/neural/cta'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <Hub />
      <Showcase />
      <Custom />
      <Reviews />
      <Promises />
      <Process />
      <ScopeSample />
      <Pricing />
      <CarePlans />
      <Company />
      <FAQ />
      <CTA />
    </>
  )
}
