'use client'

// Scroll reveal: content rises a little and fades in once, on an ease-in-out curve.
import { motion } from 'motion/react'

// Ease-in-out (cubic): starts gently, speeds through the middle, settles softly. Used for all page motion.
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

const Reveal = ({
  children,
  className,
  delay = 0,
  y = 24,
  as = 'div'
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
  as?: 'div' | 'li' | 'section'
}) => {
  const Tag = motion[as]

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, delay, ease: EASE_IN_OUT }}
    >
      {children}
    </Tag>
  )
}

export default Reveal
