import React from "react";
import { ChevronRight } from "lucide-react";
export default function TemplatesSection() {
const TemplateCard: React.FC<{ title: string, img: string, tag: string }> = ({ title, img, tag }) => (
  <div className="group cursor-pointer">
    <div className="aspect-[3/4] rounded-xl border border-slate-100 overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-all">
      <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    </div>
    <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{tag}</span>
    <h4 className="font-bold text-slate-900 mt-2">{title}</h4>
  </div>
);
  return (
      <section id="templates" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Start from a Template</h2>
              <p className="text-slate-500">Get up and running in seconds with professional layouts.</p>
            </div>
            <button className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
              View all <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TemplateCard title="Research Paper" img="https://picsum.photos/seed/paper/300/400" tag="Academic" />
            <TemplateCard title="Formal Resume" img="https://picsum.photos/seed/resume/300/400" tag="Career" />
            <TemplateCard title="Beamer Slides" img="https://picsum.photos/seed/slides/300/400" tag="Presentation" />
            <TemplateCard title="Thesis / Book" img="https://picsum.photos/seed/book/300/400" tag="Academic" />
          </div>
        </div>
      </section>

  )
}
