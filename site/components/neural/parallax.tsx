'use client'

// Slow parallax for photographs: the image drifts against the scroll inside its frame. Tied directly to the
// scroll position, so it never lags behind the page.
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

const Parallax = ({ children, amount = 8 }: { children: React.ReactNode; amount?: number }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`])

  return (
    <div ref={ref} className='overflow-hidden'>
      <motion.div style={{ y, scale: 1 + (amount * 2.4) / 100 }} className='will-change-transform'>
        {children}
      </motion.div>
    </div>
  )
}

export default Parallax
