
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Search, Grid, List, Tag } from 'lucide-react';
import { ProjectTemplate } from '../types';
import BrandLogo from '../components/BrandLogo';

const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'paper',
    name: 'Research Paper',
    description: 'A standard IEEE/ACM style research paper template with biblatex support.',
    image: 'https://picsum.photos/seed/paper/400/500',
    tag: 'Academic',
    boilerplate: '\\documentclass{article}\n\\title{Research Paper}\n\\begin{document}\n\\maketitle\n\\end{document}'
  },
  {
    id: 'resume',
    name: 'Modern CV',
    description: 'Clean, professional single-column resume for tech jobs.',
    image: 'https://picsum.photos/seed/resume/400/500',
    tag: 'Professional',
    boilerplate: '\\documentclass{article}\n\\begin{document}\nResume Content\n\\end{document}'
  },
  {
    id: 'slides',
    name: 'Presentation Slides',
    description: 'Beamer presentation template with metropolis theme.',
    image: 'https://picsum.photos/seed/slides/400/500',
    tag: 'Presentation',
    boilerplate: '\\documentclass{beamer}\n\\title{Presentation}\n\\begin{document}\n\\frame{\\titlepage}\n\\end{document}'
  },
  {
    id: 'thesis',
    name: 'Thesis / Dissertation',
    description: 'Multi-chapter thesis template with frontmatter and appendices.',
    image: 'https://picsum.photos/seed/thesis/400/500',
    tag: 'Academic',
    boilerplate: '\\documentclass{book}\n\\begin{document}\n\\chapter{Introduction}\n\\end{document}'
  }
];

const Templates: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (template: ProjectTemplate) => {
    const newId = Math.random().toString(36).substr(2, 9);
    navigate(`/project/${newId}?template=${template.id}&name=${encodeURIComponent(template.name)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Standardized h-14 */}
      <nav className="h-14 bg-white border-b border-slate-200 sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <BrandLogo size="sm" />
          <div className="h-6 w-px bg-slate-200"></div>
          <span className="text-sm font-semibold text-slate-900">Browse Project Templates</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">How do you want to start?</h1>
          <p className="text-lg text-slate-500 leading-relaxed">Choose from our curated collection of professional LaTeX templates to kickstart your next document.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TEMPLATES.map((t) => (
            <div 
              key={t.id} 
              onClick={() => handleSelect(t)}
              className="group cursor-pointer flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
            >
              <div className="aspect-[3/4] overflow-hidden bg-slate-100 relative">
                <img 
                  src={t.image} 
                  alt={t.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-600 shadow-sm border border-white">
                    {t.tag}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{t.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{t.description}</p>
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Select Template</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                    <ChevronLeft className="text-slate-400 group-hover:text-white rotate-180 transition-colors" size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Templates;
