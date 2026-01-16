import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Play, 
  Download, 
  Share2, 
  Code2, 
  Search, 
  MessageSquare, 
  FileText,
  Maximize2,
  Minimize2,
  ChevronRight,
  Loader2,
  Terminal,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { loadLanguage } from '@uiw/codemirror-extensions-langs';
import { githubLight } from '@uiw/codemirror-theme-github';
import FileExplorer from '../components/Editor/FileExplorer';

const Editor: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const projectName = searchParams.get('name') || 'Project Workspace';
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isPdfVisible, setIsPdfVisible] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [autoCompile, setAutoCompile] = useState(true);
  const [splitRatio, setSplitRatio] = useState(50); // percentage
  const [activeFile, setActiveFile] = useState('main.tex');
  const [isCompiling, setIsCompiling] = useState(false);
  
  const [logs, setLogs] = useState<string[]>([
    '[system] Workspace initialized.',
    '[system] LaTeX 2.0e engine ready.',
    '[system] Collaborative session: ACTIVE'
  ]);

  const [latexCode, setLatexCode] = useState(`\\documentclass{article}
\\usepackage{blindtext}
\\usepackage[utf8]{inputenc}

\\title{Exploring the Galactic Core}
\\author{Alice Johnson}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Black holes are regions of space where gravity is so strong that nothing, not even light, can escape. The concept was first theorized in the context of General Relativity.

\\section{Scientific Significance}
These massive objects play a crucial role in the evolution of galaxies. Most large galaxies are believed to have a supermassive black hole at their center.

\\begin{equation}
    E = mc^2
\\end{equation}

\\end{document}`);

  const [parsedDoc, setParsedDoc] = useState({
    title: 'Exploring the Galactic Core',
    author: 'Alice Johnson',
    sections: [] as {title: string, content: string}[]
  });

  const handleRecompile = useCallback((silent = false) => {
    if (!silent) setIsCompiling(true);
    
    // Compilation simulation
    setTimeout(() => {
      const titleMatch = latexCode.match(/\\title\{([^}]+)\}/);
      const authorMatch = latexCode.match(/\\author\{([^}]+)\}/);
      
      const sections: {title: string, content: string}[] = [];
      const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/g;
      let match;
      let count = 1;
      while ((match = sectionRegex.exec(latexCode)) !== null) {
        sections.push({
          title: `${count++} ${match[1]}`,
          content: match[2].trim().replace(/\\blindtext/g, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.')
        });
      }

      setParsedDoc({
        title: titleMatch ? titleMatch[1] : 'Untitled',
        author: authorMatch ? authorMatch[1] : 'Anonymous',
        sections: sections.length > 0 ? sections : [{ title: 'Preview', content: 'No sections found.' }]
      });
      
      if (!silent) {
        setLogs(prev => [...prev, `[compilation] Built successfully in ${Math.floor(Math.random() * 200 + 300)}ms`]);
        setIsCompiling(false);
      }
    }, 800);
  }, [latexCode]);

  useEffect(() => {
    if (!autoCompile) return;
    const timer = setTimeout(() => {
      handleRecompile(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [latexCode, autoCompile, handleRecompile]);

  useEffect(() => {
    handleRecompile();
  }, [handleRecompile]);

  // Resizing logic
  const isResizing = useRef(false);
  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newRatio = (e.clientX / window.innerWidth) * 100;
    if (newRatio > 10 && newRatio < 90) {
      setSplitRatio(newRatio);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const downloadPDF = () => {
    alert("Downloading PDF document...");
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden select-none">
      {/* Header - Standardized h-14 */}
      <header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">{projectName}</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-mono">projectID: {id}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-lg transition-colors border border-slate-200"
          >
            <Download size={16} /> PDF
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1"></div>
          <div className="flex items-center gap-2 mr-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto</span>
            <button 
              onClick={() => setAutoCompile(!autoCompile)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoCompile ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoCompile ? 'left-4.5' : 'right-0.5'}`}></div>
            </button>
          </div>
          <button 
            onClick={() => handleRecompile()}
            disabled={isCompiling}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isCompiling ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} 
            Recompile
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <FileExplorer 
          isOpen={isSidebarOpen} 
          activeFile={activeFile} 
          onFileSelect={setActiveFile} 
        />

        <div className="flex-1 flex relative">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-4 -left-3 z-30 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-600 transition-all hover:scale-110 active:scale-95"
          >
            {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Editor Area */}
          <div 
            className={`flex flex-col border-r border-slate-200 transition-all duration-300 ${isPreviewExpanded ? 'w-0 hidden' : ''}`} 
            style={{ width: isPreviewExpanded ? '0%' : (isPdfVisible ? `${splitRatio}%` : '100%') }}
          >
            <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Code2 size={12} className="text-slate-400" />
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{activeFile}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPdfVisible(!isPdfVisible)}
                  className={`p-1 rounded transition-colors ${!isPdfVisible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
                  title={isPdfVisible ? "Hide Preview" : "Show Preview"}
                >
                  {isPdfVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {/* Fix: Changed 'latex' to 'stex' as CodeMirror 6 language identifier for LaTeX is 'stex' */}
              <CodeMirror
                value={latexCode}
                height="100%"
                theme={githubLight}
                // extensions={[loadLanguage('stex')!]}
                onChange={(value) => setLatexCode(value)}
                className="h-full text-sm"
              />
            </div>
          </div>

          {/* Resizer */}
          {isPdfVisible && !isPreviewExpanded && (
            <div 
              onMouseDown={handleMouseDown}
              className="w-1.5 bg-slate-100 hover:bg-blue-500 cursor-col-resize transition-colors group z-20"
            >
              <div className="h-full w-full opacity-0 group-hover:opacity-100 bg-blue-500/20"></div>
            </div>
          )}

          {/* Preview Area */}
          {isPdfVisible && (
            <div 
              className="flex flex-col bg-slate-100 relative text-left"
              style={{ flex: 1 }}
            >
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileText size={12} className="text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">PDF Viewer</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)} 
                    className={`text-slate-400 hover:text-slate-600 transition-colors ${isPreviewExpanded ? 'text-blue-600 bg-blue-50 rounded p-0.5' : ''}`}
                    title="Toggle Fullscreen Preview"
                  >
                    {isPreviewExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button onClick={downloadPDF} className="text-slate-400 hover:text-slate-600 transition-colors" title="Download PDF"><Download size={14} /></button>
                </div>
              </div>
              
              {/* PDF Centering Fix: Use grid and justify-center to ensure strict centering */}
              <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center bg-slate-200/50">
                <div className={`bg-white w-[595px] min-h-[842px] paper-shadow rounded-sm p-16 relative transition-opacity duration-300 ${isCompiling ? 'opacity-40' : 'opacity-100'}`}>
                  <div className="text-center mb-12">
                    <h1 className="text-3xl font-serif mb-3 text-slate-900 leading-tight">{parsedDoc.title}</h1>
                    <p className="text-base font-serif italic text-slate-700">{parsedDoc.author}</p>
                    <p className="text-xs font-serif text-slate-400 mt-1">{new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <div className="prose prose-slate max-w-none font-serif text-slate-800">
                    {parsedDoc.sections.map((section, idx) => (
                      <div key={idx} className="mb-8 text-left">
                        <h2 className="text-xl font-bold mb-3 border-b border-slate-100 pb-1 text-slate-900">{section.title}</h2>
                        <p className="mb-4 leading-relaxed text-justify">{section.content}</p>
                      </div>
                    ))}
                    {latexCode.includes('\\begin{equation}') && (
                      <div className="bg-slate-50 p-6 rounded-lg text-center my-10 border border-slate-100">
                         <span className="font-serif italic text-2xl text-slate-900">
                          {latexCode.match(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/)?.[1]?.trim() || 'E = mc^2'}
                         </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-8 right-12 text-slate-300 text-[10px] font-mono select-none">
                    Page 1 of 1
                  </div>
                </div>
                
                {/* Spacing for bottom scrolling */}
                <div className="h-16 w-full shrink-0"></div>

                {isCompiling && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                     <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-blue-600" />
                        <span className="text-xs font-medium text-slate-600">Compiling...</span>
                     </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Panel */}
      {showLogs && (
        <div className="h-40 bg-slate-900 border-t border-slate-800 p-3 overflow-y-auto animate-in slide-in-from-bottom duration-200 z-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest px-2">
              <Terminal size={12} /> Full Compilation Logs
            </div>
            <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white transition-colors p-1">
              <Minimize2 size={12} />
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-400 space-y-1 px-2">
            {logs.map((log, i) => <div key={i} className={log.includes('Built') ? 'text-emerald-400' : ''}>{log}</div>)}
            <div className="h-4 w-full"></div>
          </div>
        </div>
      )}

      <footer className="h-7 bg-slate-900 text-slate-400 text-[10px] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Connected</span>
          <span>LaTeX 2e (pdfTeX)</span>
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-1 transition-colors px-2 rounded ${showLogs ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-800'}`}
          >
            <Terminal size={10} /> View Logs
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Activity size={10} /> {autoCompile ? 'Auto-compile: ON' : 'Manual'}</span>
          <span>UTF-8</span>
          <button className="flex items-center gap-1 hover:text-white transition-colors"><MessageSquare size={10} /> Chat</button>
        </div>
      </footer>
    </div>
  );
};

export default Editor;
