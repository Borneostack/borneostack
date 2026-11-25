'use client'

// Headline reveal: each word rises out of its own line mask, one after another, on an ease-in-out curve.
// `onMount` (the hero) runs in CSS so it starts the moment the page arrives, before scripts load.
import { Fragment } from 'react'
import { motion } from 'motion/react'

import { EASE_IN_OUT } from '@/components/neural/reveal'

const Words = ({
  text,
  accent = [],
  delay = 0,
  stagger = 0.05,
  onMount = false
}: {
  text: string
  accent?: string[]
  delay?: number
  stagger?: number
  onMount?: boolean
}) => {
  const words = text.split(' ')
  const tone = (w: string) => (accent.includes(w.replace(/[.,!?]/g, '')) ? 'text-primary inline-block' : 'inline-block')
  const mask = (n: number, inner: React.ReactNode) => (
    <Fragment key={n}>
      <span aria-hidden className='-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom'>
        {inner}
      </span>
      {n < words.length - 1 && ' '}
    </Fragment>
  )

  if (onMount) {
    return (
      <span>
        <span className='sr-only'>{text}</span>
        {words.map((w, n) =>
          mask(
            n,
            <span
              className={`${tone(w)} word-rise`}
              style={{ '--d': `${delay + n * stagger}s` } as React.CSSProperties}
            >
              {w}
            </span>
          )
        )}
      </span>
    )
  }

  return (
    <motion.span
      initial='hidden'
      whileInView='show'
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      <span className='sr-only'>{text}</span>
      {words.map((w, n) =>
        mask(
          n,
          <motion.span
            className={tone(w)}
            variants={{ hidden: { y: '100%', opacity: 0 }, show: { y: '0%', opacity: 1 } }}
            transition={{ duration: 0.8, ease: EASE_IN_OUT }}
          >
            {w}
          </motion.span>
        )
      )}
    </motion.span>
  )
}

export default Words
