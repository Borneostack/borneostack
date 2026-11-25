// FAQ adapted from shadcn/studio faq-component-01, set as a two-column layout like the Neural template.
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import SectionHead from '@/components/neural/section-head'
import { FAQS, SITE } from '@/lib/site'

const FAQ = () => (
  <section className='py-20 sm:py-28'>
    <div className='mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16'>
      <SectionHead
        align='left'
        title='Questions before we start'
        description={
          <>
            Prices, ownership and what happens after handover. Something else? Email{' '}
            <a href={`mailto:${SITE.email}`} className='text-foreground underline'>
              {SITE.email}
            </a>
            .
          </>
        }
      />

      <Accordion className='glass w-full rounded-2xl px-5 sm:px-6' defaultValue={['item-1']}>
        {FAQS.map((item, index) => (
          <AccordionItem key={item.question} value={`item-${index + 1}`} className='last:border-b-0'>
            <AccordionTrigger className='py-5 text-base font-semibold'>{item.question}</AccordionTrigger>
            <AccordionContent className='text-muted-foreground text-sm sm:text-base'>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
)

export default FAQ
