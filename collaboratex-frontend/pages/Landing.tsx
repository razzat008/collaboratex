import React from 'react';
import { Link } from 'react-router-dom';
import {
  GithubIcon as Github,
  ChevronRight
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import OpenSourceSection from '../components/LandingPage/OpenSourceSection';
import TemplatesSection from '../components/LandingPage/TemplatesSection';
import FooterSection from '@/components/LandingPage/FooterSection';
import FeaturesSection from '@/components/LandingPage/FeaturesSection';

const Landing: React.FC = () => {
  const { isSignedIn } = useUser();

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <BrandLogo />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo('features')} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</button>
              <button onClick={() => scrollTo('opensource')} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Open Source</button>
              <button onClick={() => scrollTo('templates')} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Templates</button>
              <a href="https://github.com/razzat008/gollaboratex" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Github</a>
            </div>

            <div className="flex items-center gap-3">
              {!isSignedIn ? (
                <>
                  <SignInButton mode="modal">
                    <button className="text-sm font-medium px-4 py-2 text-slate-600 hover:text-slate-900">Login</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="text-sm font-medium bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-sm">Start free</button>
                  </SignUpButton>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="text-sm font-medium bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all">
                    Dashboard
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
            <Github size={14} /> 100% Open Source
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Collaborative LaTeX. <br />
            <span className="text-blue-600">Simpler than ever.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Beautifully clean, open-source collaborative LaTeX editor. Control your files, work with your team, and focus on your research without the bloat.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group">
              Start a New Project <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#templates" className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-900 font-semibold rounded-xl hover:bg-slate-50 transition-all">
              Browse Templates
            </a>
          </div>
          <div className="mt-20 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-slate-50">
            <img src="/output.jpg" alt="Editor Preview" className="w-full h-auto opacity-100" />
          </div>
        </div>
      </section>

      <FeaturesSection />
      <OpenSourceSection />
      <TemplatesSection />
      <FooterSection />

    </div>
  );
};

export default Landing;
