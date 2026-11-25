// Custom engineering: frontend, backend and system design. Quoted as one fixed price after the free call.
import { CheckIcon, Code2Icon, NetworkIcon, ServerIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Photo from '@/components/neural/photo'
import BrandLogo from '@/components/neural/brand-logo'
import SectionHead from '@/components/neural/section-head'
import Reveal from '@/components/neural/reveal'
import { CUSTOM } from '@/lib/site'

const ICONS = { frontend: Code2Icon, backend: ServerIcon, 'system-design': NetworkIcon }
const STACK = [
  { name: 'Next.js', slug: 'nextdotjs' },
  { name: 'React', slug: 'react' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'Node.js', slug: 'nodedotjs' },
  { name: 'Python', slug: 'python' },
  { name: 'PostgreSQL', slug: 'postgresql' },
  { name: 'Supabase', slug: 'supabase' },
  { name: 'n8n', slug: 'n8n' },
  { name: 'Google', slug: 'google' },
  { name: 'Claude', slug: 'claude' },
  { name: 'Gemini', slug: 'googlegemini' },
  { name: 'OpenAI' },
  { name: 'Figma', slug: 'figma' },
  { name: 'Vercel', slug: 'vercel' }
]

const Custom = ({ id = 'custom' }: { id?: string }) => (
  <section id={id} className='py-20 sm:py-28'>
    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <div className='grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]'>
        <div>
          <SectionHead
            align='left'
            title='Need something bigger? We build custom software too'
            description='Frontend, backend and system design for work that does not fit a package. Same rules: a written scope and one fixed price before we start.'
          />
          <Button className='mt-8 h-11 w-fit rounded-xl px-6' render={<a href='/contact' />} nativeButton={false}>
            Ask for a fixed quote
          </Button>
          <div className='mt-10'>
            <p className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>What we build with</p>
            <ul className='mt-3 flex flex-wrap gap-2'>
              {STACK.map(t => (
                <li
                  key={t.name}
                  className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm'
                >
                  {t.slug && <BrandLogo slug={t.slug} className='size-3.5 opacity-80' />}
                  {t.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Reveal className='max-lg:order-first'>
          <div className='relative mx-auto max-w-md lg:max-w-none'>
            <div aria-hidden className='absolute inset-8 rounded-full bg-[#2b7bff] opacity-20 blur-3xl' />
            <Photo
              name='ill-custom'
              large={1447}
              ratio={4 / 3}
              sizes='(min-width: 1024px) 480px, 100vw'
              alt=''
              className='relative [mask-image:radial-gradient(closest-side,black_70%,transparent)]'
            />
          </div>
        </Reveal>
      </div>

      <div className='mt-12 grid gap-4 md:grid-cols-3'>
        {CUSTOM.map((c, n) => {
          const Icon = ICONS[c.id]

          return (
            <Reveal key={c.id} delay={n * 0.1} className='h-full'>
              <article className='glass flex h-full flex-col rounded-2xl p-6'>
                <Icon className='text-primary size-6' />
                <h3 className='mt-5 text-xl'>{c.name}</h3>
                <p className='text-muted-foreground mt-2 text-sm'>{c.pitch}</p>
                <ul className='mt-5 space-y-2 border-t pt-5 text-sm'>
                  {c.points.map(p => (
                    <li key={p} className='flex gap-2.5'>
                      <CheckIcon className='text-primary mt-0.5 size-4 shrink-0' />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className='text-muted-foreground mt-auto pt-6 text-sm'>Fixed price, quoted after a free call</p>
              </article>
            </Reveal>
          )
        })}
      </div>
    </div>
  </section>
)

export default Custom
