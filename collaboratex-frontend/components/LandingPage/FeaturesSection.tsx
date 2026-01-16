import React from 'react';
import { Zap, ShieldCheck, Code2 } from 'lucide-react';
export default function FeaturesSection() {

  const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 text-2xl">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );

  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need, nothing you don't</h2>
          <p className="text-slate-500 max-w-xl mx-auto">We focused on stripping away the complexity of modern editors to give you a clean slate.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="text-amber-500" />}
            title="Real-time Streaming"
            description="See your PDF updates as you type with our highly optimized streaming preview engine."
          />
          <FeatureCard
            icon={<ShieldCheck className="text-emerald-500" />}
            title="Full Control"
            description="Your files, your way. No vendor lock-in. Export everything as standard LaTeX source or PDFs."
          />
          <FeatureCard
            icon={<Code2 className="text-blue-500" />}
            title="Modern Editor"
            description="Powered by CodeMirror 6, providing the best editing experience with LaTeX highlighting and autocomplete."
          />
        </div>
      </div>
    </section>

  )
}
