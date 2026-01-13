import { Zap, BookOpen, GitBranch, Code } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Real-time Collaboration",
    description:
      "Edit documents together with instant synchronization. See your teammates' changes as they happen, with integrated commenting and track changes.",
  },
  {
    icon: Code,
    title: "Visual & Code Editors",
    description:
      "Choose between our intuitive visual editor or dive into pure LaTeX code. Switch seamlessly between both modes without losing your work.",
  },
  {
    icon: BookOpen,
    title: "Professional Templates",
    description:
      "Access thousands of pre-built templates for journals, conferences, theses, and presentations. Start your project in seconds.",
  },
  {
    icon: GitBranch,
    title: "Version Control",
    description:
      "Never lose work with automatic version history. Revert to previous versions or compare changes between edits effortlessly.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Everything you need for scientific writing</h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Professional tools designed for researchers, academics, and LaTeX enthusiasts.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="border border-border rounded-xl p-8 hover:border-accent transition hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  );
}
