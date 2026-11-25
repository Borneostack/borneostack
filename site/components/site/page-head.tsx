// Inner-page head in the Neural world: light beam, title, short description.
type PageHeadProps = {
  title: string
  description: string
}

const PageHead = ({ title, description }: PageHeadProps) => (
  <section className='relative isolate overflow-hidden pt-36 pb-10 sm:pt-44 sm:pb-14'>
    <div aria-hidden className='beam pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]' />
    <div className='mx-auto max-w-3xl space-y-5 px-4 text-center sm:px-6'>
      <h1 className='text-4xl font-extrabold sm:text-5xl lg:text-6xl'>{title}</h1>
      <p className='text-muted-foreground text-base sm:text-lg'>{description}</p>
    </div>
  </section>
)

export default PageHead
