import { SignUpButton } from "@clerk/clerk-react"

export function CTASection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-12 md:p-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white text-balance">Ready to collaborate better?</h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of researchers and academics. Start writing, collaborating, and publishing with CollaborateX
          today.
        </p>
        <SignUpButton mode="modal">
          <button className="px-8 py-3 bg-white text-primary rounded-full hover:bg-white/90 transition font-medium cursor-pointer text-base">
            Start writing free
          </button>
        </SignUpButton>
      </div>
    </section>
  );
}
