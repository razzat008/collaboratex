import { Github } from "lucide-react";
export default function OpenSourceSection() {
  return (
    <section id="opensource" className="py-24 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
            <Github className="text-slate-900" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Proudly Open Source</h2>
          <p className="text-lg text-slate-500 mb-8">
            We believe research and writing should be accessible. Collaboratex is built on open protocols and can be self-hosted with ease. Contribute to the future of academic writing.
          </p>
          <div className="flex gap-4">
            <button
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              onClick={() => window.location.href = 'https://github.com/razzat008/gollaboratex'}
            >
              Star on GitHub
            </button>
            <button className="px-6 py-3 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              onClick={() => window.location.href = 'https://github.com/razzat008/gollaboratex/blob/master/README.md'}
            >Documentation</button>
          </div>
        </div>
        <div className="flex-1 bg-slate-900 rounded-3xl p-8 text-slate-300 mono text-sm shadow-xl">
          <div className="flex gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          </div>
          <p className="text-slate-500">$ git clone https://github.com/collaboratex/core.git</p>
          <p className="mt-2"><span className="text-emerald-400">Successfully</span> cloned Collaboratex</p>
          <p className="mt-2">$ cd collaboratex && npm install</p>
          <p className="mt-2 text-slate-500">Installing dependencies...</p>
          <p className="mt-2">$ npm run dev</p>
          <p className="mt-2 text-blue-400">Server running at http://localhost:3000</p>
        </div>
      </div>
    </section>
  )
}
