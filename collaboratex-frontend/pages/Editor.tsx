
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
  EyeOff,
  Save
} from 'lucide-react';
import  CMEditor  from "../components/Editor/Codemirror"
import FileExplorer from '../components/Editor/FileExplorer';
import { useUpdateWorkingFile } from '@/src/graphql/generated';
import { autocompletion, latex } from 'codemirror-lang-latex';

interface CurrentFile {
  id: string;
  name: string;
  content: string;
}

const Editor: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const projectName = searchParams.get('name') || 'Project Workspace';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isPdfVisible, setIsPdfVisible] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [autoCompile, setAutoCompile] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);
  const [currentFile, setCurrentFile] = useState<CurrentFile | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isResizing, setIsResizing] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCompiledContentRef = useRef<string | null>(null);

  const [logs, setLogs] = useState<string[]>([
    '[system] Workspace initialized.',
    '[system] LaTeX 2.0e engine ready.',
    '[system] Collaborative session: ACTIVE'
  ]);

  const [parsedDoc, setParsedDoc] = useState({
    title: 'Untitled Document',
    author: 'Anonymous',
    sections: [] as { title: string, content: string }[]
  });

  // GraphQL mutation for updating file content
  const [updateWorkingFile] = useUpdateWorkingFile();

  // Handle file selection from FileExplorer
  const handleFileSelect = (
    fileId: string,
    fileName: string,
    content: string
  ) => {
    const file = { id: fileId, name: fileName, content };
    setCurrentFile(file);
    setHasUnsavedChanges(false);
    setIsInitialLoad(false);
    setLogs(prev => [...prev, `[file] Opened ${fileName}`]);

    handleRecompile(false);
  };

  const handleAssetSelect = (assetPath: string) => {
    setLogs(prev => [...prev, `[asset] Selected ${assetPath}`]);
  };

  const handleFilesLoaded = (files: Array<{ id: string; name: string }>, rootFileId?: string) => {
    if (!isInitialLoad || files.length === 0) return;
    let defaultFile = files.find(f => f.name.toLowerCase() === 'main.tex');
    if (!defaultFile && rootFileId) {
      defaultFile = files.find(f => f.id === rootFileId);
    }
    if (!defaultFile) {
      defaultFile = files[0];
    }
    return defaultFile.id;
  };

  const saveFile = async () => {
    if (!currentFile || !hasUnsavedChanges) return;
    try {
      setIsSaving(true);
      await updateWorkingFile({
        variables: {
          input: {
            fileId: currentFile.id,
            content: currentFile.content
          }
        }
      });
      setHasUnsavedChanges(false);
      setLogs(prev => [...prev, `[save] Saved ${currentFile.name}`]);
    } catch (error) {
      console.error('Failed to save:', error);
      setLogs(prev => [...prev, `[error] Failed to save ${currentFile.name}`]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (value: string) => {
    if (!currentFile) return;
    setCurrentFile({ ...currentFile, content: value });
    setHasUnsavedChanges(true);
    if (!autoSave) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await saveFile();
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleRecompile = useCallback((silent = false) => {
    if (!currentFile?.content) return;
    if (currentFile.content === lastCompiledContentRef.current) return;
    lastCompiledContentRef.current = currentFile.content;
    if (!silent) setIsCompiling(true);

    setTimeout(() => {
      const titleMatch = currentFile.content.match(/\\title\{([^}]+)\}/);
      const authorMatch = currentFile.content.match(/\\author\{([^}]+)\}/);
      const sections: { title: string, content: string }[] = [];
      const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/g;
      let match;
      let count = 1;
      while ((match = sectionRegex.exec(currentFile.content)) !== null) {
        sections.push({
          title: `${count++} ${match[1]}`,
          content: match[2].trim().replace(/\\blindtext/g, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
        });
      }
      setParsedDoc({
        title: titleMatch ? titleMatch[1] : 'Untitled Document',
        author: authorMatch ? authorMatch[1] : 'Anonymous',
        sections: sections.length > 0 ? sections : [{ title: 'Preview', content: 'No sections found.' }]
      });
      if (!silent) {
        setLogs(prev => [...prev, `[compilation] Built successfully`]);
        setIsCompiling(false);
      }
    }, 800);
  }, [currentFile?.content]);

  useEffect(() => {
    if (!autoCompile || !currentFile) return;
    const timer = setTimeout(() => handleRecompile(true), 1500);
    return () => clearTimeout(timer);
  }, [currentFile?.content, autoCompile, handleRecompile]);

  // Smooth Resizing Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerBounds = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerBounds.left;
    const newRatio = (mouseX / containerBounds.width) * 100;
    if (newRatio > 15 && newRatio < 85) {
      setSplitRatio(newRatio);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden select-none">
      {/* Resizing Overlay to prevent interaction with CodeMirror/PDF during drag */}
      {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize" />}

      <header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white z-40">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">{projectName}</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-mono">ID: {id}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </div>
          )}
          {!isSaving && hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Unsaved changes
            </div>
          )}

          <button
            onClick={saveFile}
            disabled={isSaving || !hasUnsavedChanges || !currentFile}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-lg transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} /> Save
          </button>

          <button
            onClick={() => alert("PDF Export...")}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-lg transition-colors border border-slate-200"
          >
            <Download size={16} /> PDF
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto Save</span>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoSave ? 'bg-green-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoSave ? 'right-0.5' : 'left-4.5'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto Compile</span>
            <button
              onClick={() => setAutoCompile(!autoCompile)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoCompile ? 'bg-green-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoCompile ? 'right-0.5' : 'left-4.5'}`}></div>
            </button>
          </div>

          <button
            onClick={() => handleRecompile()}
            disabled={isCompiling || !currentFile}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
          >
            {isCompiling ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Recompile
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <FileExplorer
          isOpen={isSidebarOpen}
          activeFileId={currentFile?.id || ''}
          onFileSelect={handleFileSelect}
          onAssetSelect={handleAssetSelect}
          onFilesLoaded={handleFilesLoaded}
        />

        <div className="flex-1 flex relative overflow-hidden" ref={containerRef}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white absolute top-1/4 -left-1 z-30 w-6 h-6 bg-blue-400 border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-600 transition-all z-50 hover:scale-150 active:scale-95"
          >
            {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Editor Area - Removed transition-all while resizing */}
          <div
            className={`flex flex-col border-r border-slate-200 bg-white min-w-0 ${isPreviewExpanded ? 'w-0 hidden' : ''}`}
            style={{
              width: isPreviewExpanded ? '0%' : (isPdfVisible ? `${splitRatio}%` : '100%'),
              transition: isResizing ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Code2 size={12} className="text-slate-400" />
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
                  {currentFile?.name || 'No file selected'}
                </span>
              </div>
              <button
                onClick={() => setIsPdfVisible(!isPdfVisible)}
                className={`p-1 rounded transition-colors ${!isPdfVisible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {isPdfVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative bg-white">
			{currentFile ? (
			<CMEditor />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                  <FileText size={32} className="opacity-20" />
                  Select a file to start editing
                </div>
              )}
            </div>
          </div>

          {/* Resizer */}
          {isPdfVisible && !isPreviewExpanded && (
            <div
              onMouseDown={handleMouseDown}
              className={`w-1 z-40 relative cursor-col-resize group transition-colors ${isResizing ? 'bg-blue-500' : 'bg-slate-100 hover:bg-blue-400'}`}
            >
              <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
            </div>
          )}

          {/* Preview Area - Flex 1 handles the remaining width */}
          {isPdfVisible && (
            <div
              className={`flex flex-col bg-slate-100 relative min-w-0 ${isPreviewExpanded ? 'flex-1' : ''}`}
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
                  >
                    {isPreviewExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button onClick={() => alert('Download')} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <Download size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center bg-slate-200/50">
                {currentFile ? (
                  <div className={`bg-white w-[595px] min-h-[842px] paper-shadow rounded-sm p-16 relative transition-opacity duration-300 ${isCompiling ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="text-center mb-12">
                      <h1 className="text-3xl font-serif mb-3 text-slate-900 leading-tight">{parsedDoc.title}</h1>
                      <p className="text-base font-serif italic text-slate-700">{parsedDoc.author}</p>
                      <p className="text-xs font-serif text-slate-400 mt-1">{new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="prose prose-slate max-w-none font-serif text-slate-800">
                      {parsedDoc.sections.map((section, idx) => (
                        <div key={idx} className="mb-8">
                          <h2 className="text-xl font-bold mb-3 border-b border-slate-100 pb-1 text-slate-900">{section.title}</h2>
                          <p className="mb-4 leading-relaxed text-justify">{section.content}</p>
                        </div>
                      ))}
                      {currentFile.content.includes('\\begin{equation}') && (
                        <div className="bg-slate-50 p-6 rounded-lg text-center my-10 border border-slate-100">
                          <span className="font-serif italic text-2xl text-slate-900">
                            {currentFile.content.match(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/)?.[1]?.trim() || 'E = mc^2'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-8 right-12 text-slate-300 text-[10px] font-mono">
                      Page 1 of 1
                    </div>
                  </div>
                ) : (
                  <div className="bg-white w-[595px] min-h-[842px] paper-shadow rounded-sm flex items-center justify-center text-slate-300">
                    No preview available
                  </div>
                )}
                <div className="h-16 w-full shrink-0"></div>
              </div>

              {isCompiling && (
                <div className="absolute bottom-8 right-8 z-50">
                  <div className="bg-white px-4 py-2 rounded-full shadow-xl border border-slate-200 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span className="text-xs font-semibold text-slate-600">Compiling...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showLogs && (
        <div className="h-40 bg-slate-900 border-t border-slate-800 p-3 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
              <Terminal size={12} /> Compilation Logs
            </div>
            <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white transition-colors">
              <Minimize2 size={12} />
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-400 space-y-1 px-2">
            {logs.map((log, i) => (
              <div key={i} className={log.includes('Built') || log.includes('Saved') ? 'text-emerald-400' : log.includes('error') ? 'text-red-400' : ''}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="h-7 bg-slate-900 text-slate-400 text-[10px] px-3 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected</span>
          <span>LaTeX 2e (pdfTeX)</span>
          <button onClick={() => setShowLogs(!showLogs)} className="hover:text-white transition-colors">View Logs</button>
        </div>
        <div className="flex items-center gap-4">
          <span>{autoSave ? '💾 Auto-save: ON' : '📝 Auto-save: OFF'}</span>
          {hasUnsavedChanges && <span className="text-amber-400">● Unsaved Changes</span>}
          <span>UTF-8</span>
          <button className="flex items-center gap-1 hover:text-white transition-colors"><MessageSquare size={10} /> Chat</button>
        </div>
      </footer>
    </div>
  );
};

export default Editor;
