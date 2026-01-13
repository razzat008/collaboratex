export function SocialProof() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
      <p className="text-center text-muted-foreground text-sm mb-8">Trusted by researchers at</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
        <div className="text-center">
          <p className="font-semibold text-foreground/70">MIT</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground/70">Stanford</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground/70">Harvard</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground/70">Oxford</p>
        </div>
      </div>
    </section>
  )
}
