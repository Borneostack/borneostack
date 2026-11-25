import type { NextConfig } from 'next'

// Static export: `pnpm build` writes plain HTML to out/, which scripts/publish.mjs copies into ../website for Vercel.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true }
}

export default nextConfig
