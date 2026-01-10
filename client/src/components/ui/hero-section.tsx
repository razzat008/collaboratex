import { Code } from "lucide-react"
import { SignUpButton } from "@clerk/clerk-react"

export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-balance">
            Write like a scientist with <span className="text-accent">CollaborateX</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            The collaborative LaTeX editor that brings your research and technical writing to life. Real-time editing,
            powerful templates, and seamless teamwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <SignUpButton mode="modal">
              <button className="px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition font-medium cursor-pointer text-base">
                Start writing free
              </button>
            </SignUpButton>
            <button className="px-8 py-3 border-2 border-border rounded-full hover:bg-secondary transition font-medium text-base">
              Watch demo
            </button>
          </div>
        </div>
        <div className="bg-secondary rounded-2xl p-8 aspect-square flex items-center justify-center">
          <div className="text-center">
            <Code className="w-24 h-24 mx-auto mb-4 text-accent opacity-50" />
            <p className="text-muted-foreground">Editor Preview</p>
          </div>
        </div>
      </div>
    </section>
  )
}
