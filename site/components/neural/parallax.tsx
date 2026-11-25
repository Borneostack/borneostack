'use client'

// Slow parallax for photographs: the image drifts against the scroll inside its frame, so the page feels deep.
import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'

const Parallax = ({ children, amount = 8 }: { children: React.ReactNode; amount?: number }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const raw = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`])
  const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 })

  return (
    <div ref={ref} className='overflow-hidden'>
      <motion.div style={{ y, scale: 1 + (amount * 2.4) / 100 }}>{children}</motion.div>
    </div>
  )
}

export default Parallax
