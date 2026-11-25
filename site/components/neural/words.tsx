'use client'

// Headline reveal: each word rises out of its own line mask and sharpens from a blur, one after another.
import { Fragment } from 'react'
import { motion } from 'motion/react'

const EASE = [0.22, 1, 0.36, 1] as const

const Words = ({
  text,
  accent = [],
  delay = 0,
  stagger = 0.055,
  onMount = false
}: {
  text: string
  accent?: string[]
  delay?: number
  stagger?: number
  onMount?: boolean
}) => {
  const words = text.split(' ')
  const show = { y: '0%', opacity: 1, filter: 'blur(0px)', rotate: 0 }

  return (
    <motion.span
      className='inline'
      initial='hidden'
      {...(onMount
        ? { animate: 'show' }
        : {
            whileInView: 'show',
            viewport: { once: true, margin: '0px 0px -10% 0px' }
          })}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      <span className='sr-only'>{text}</span>
      {words.map((w, n) => (
        <Fragment key={n}>
          <span aria-hidden className='-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom'>
            <motion.span
              className={accent.includes(w.replace(/[.,!?]/g, '')) ? 'text-primary inline-block' : 'inline-block'}
              variants={{
                hidden: {
                  y: '105%',
                  opacity: 0,
                  filter: 'blur(10px)',
                  rotate: 4
                },
                show
              }}
              transition={{ duration: 0.9, ease: EASE }}
              style={{ transformOrigin: '0% 100%' }}
            >
              {w}
            </motion.span>
          </span>
          {n < words.length - 1 && ' '}
        </Fragment>
      ))}
    </motion.span>
  )
}

export default Words
