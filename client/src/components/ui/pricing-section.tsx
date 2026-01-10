import { Check } from "lucide-react"
import { SignUpButton } from "@clerk/clerk-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: ["Up to 3 collaborative projects", "Basic templates", "1GB storage", "Community support"],
    cta: "Start for free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For serious researchers",
    features: [
      "Unlimited collaborative projects",
      "All templates",
      "100GB storage",
      "Priority support",
      "Advanced version control",
      "Custom branding",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Team",
    price: "$50",
    period: "/month",
    description: "For research groups",
    features: [
      "Everything in Pro",
      "Up to 25 team members",
      "1TB storage",
      "Admin controls",
      "SSO integration",
      "24/7 phone support",
    ],
    cta: "Contact sales",
    featured: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Simple, transparent pricing</h2>
        <p className="text-lg text-muted-foreground">Choose the plan that fits your needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-8 flex flex-col transition ${
              plan.featured ? "border-accent bg-accent/5 scale-105 shadow-lg" : "border-border hover:border-accent/50"
            }`}
          >
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
            </div>

            <SignUpButton mode="modal">
              <button
                className={`w-full py-3 rounded-lg font-medium mb-8 transition cursor-pointer ${
                  plan.featured
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border hover:border-accent/50"
                }`}
              >
                {plan.cta}
              </button>
            </SignUpButton>

            <div className="space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
