import { FileText, BookMarked, Beaker, PieChart } from "lucide-react"

const templates = [
  {
    icon: FileText,
    title: "Research Papers",
    description: "IEEE, ACM, and journal templates",
  },
  {
    icon: BookMarked,
    title: "Theses & Dissertations",
    description: "University-approved formats",
  },
  {
    icon: Beaker,
    title: "Lab Reports",
    description: "Science and engineering projects",
  },
  {
    icon: PieChart,
    title: "Presentations",
    description: "Beamer and poster templates",
  },
]

export function TemplatesSection() {
  return (
    <section id="templates" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-secondary/30">
      <div className="mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Beautiful templates, ready to use</h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Start with professionally designed templates for every type of document.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template) => {
          const Icon = template.icon
          return (
            <div
              key={template.title}
              className="bg-background border border-border rounded-lg p-6 hover:border-accent transition hover:shadow-md cursor-pointer"
            >
              <Icon className="w-8 h-8 text-accent mb-3" />
              <h3 className="font-bold mb-2">{template.title}</h3>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
