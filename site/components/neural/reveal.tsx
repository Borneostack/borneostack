'use client'

// Scroll reveal in the Neural template's manner: content rises a little, sharpens from a blur and fades in, once.
import { motion } from 'motion/react'

const Reveal = ({
  children,
  className,
  delay = 0,
  y = 28,
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
      initial={{ opacity: 0, y, filter: 'blur(10px)', scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  )
}

export default Reveal
