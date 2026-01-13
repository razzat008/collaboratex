const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "PhD Researcher, MIT",
    content:
      "CollaborateX has transformed how our lab collaborates on research papers. Real-time editing is a game-changer.",
    avatar: "SC",
  },
  {
    name: "Prof. James Wilson",
    role: "Computer Science, Stanford",
    content:
      "The best LaTeX editor for academic collaboration. My students love it, and it saves us hours on formatting.",
    avatar: "JW",
  },
  {
    name: "Dr. Emma Rodriguez",
    role: "Materials Science, Oxford",
    content:
      "Finally, a platform that understands academic writing. The templates alone have saved our team countless hours.",
    avatar: "ER",
  },
]

export function TestimonialsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-secondary/30">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Loved by researchers worldwide</h2>
        <p className="text-lg text-muted-foreground">Join thousands of academics using CollaborateX</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial) => (
          <div key={testimonial.name} className="bg-background border border-border rounded-lg p-8">
            <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                {testimonial.avatar}
              </div>
              <div>
                <p className="font-bold text-sm">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
