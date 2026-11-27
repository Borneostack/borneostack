// The inset panel every /work card draws its piece of real output in, with a one-line note on where it came from.
const PreviewFrame = ({ label, note, children }: { label: string; note: string; children: React.ReactNode }) => (
  <figure className='min-w-0 space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5'>
    <figcaption className='text-muted-foreground text-[13px] font-semibold tracking-wide uppercase'>{label}</figcaption>
    {children}
    <p className='text-muted-foreground text-[13px] leading-snug'>{note}</p>
  </figure>
)

export default PreviewFrame
