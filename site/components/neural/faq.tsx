// FAQ adapted from shadcn/studio faq-component-01, set as a two-column layout like the Neural template.
import { ArrowRightIcon, MessageSquareTextIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SectionHead from "@/components/neural/section-head";
import { FAQS, SITE } from "@/lib/site";

const FAQ = () => (
  <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
    <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <SectionHead
          align="left"
          title="Questions before we start"
          description={
            <>
              Payment, ownership, changes and support after handover. Something
              else? Email{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="text-foreground underline"
              >
                {SITE.email}
              </a>
              .
            </>
          }
        />
        <a
          href="#try"
          className="glass hover:border-primary/60 group mt-8 flex items-center gap-4 rounded-2xl p-4 transition-colors"
        >
          <span className="bg-primary/15 text-primary grid size-10 shrink-0 place-items-center rounded-xl">
            <MessageSquareTextIcon className="size-5" />
          </span>
          <span className="text-sm">
            <span className="block font-semibold">
              Rather ask in your own words?
            </span>
            <span className="text-muted-foreground">
              Try the live document assistant on these answers.
            </span>
          </span>
          <ArrowRightIcon className="text-muted-foreground group-hover:text-primary ml-auto size-4 shrink-0 transition-colors" />
        </a>
      </div>

      <Accordion
        className="glass w-full rounded-2xl px-5 sm:px-6"
        defaultValue={["item-1"]}
      >
        {FAQS.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`item-${index + 1}`}
            className="last:border-b-0"
          >
            <AccordionTrigger className="py-5 text-base font-semibold">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm sm:text-base">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQ;
