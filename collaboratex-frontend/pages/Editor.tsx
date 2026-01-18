import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Play, Download, Share2, Code2, Search, MessageSquare, FileText, Maximize2, Minimize2, ChevronRight, Loader2, Terminal, Activity, Eye, EyeOff, Save } from 'lucide-react';
import CMEditor from "../components/Editor/Codemirror"
import FileExplorer from '../components/Editor/FileExplorer';
import { useUpdateWorkingFile } from '@/src/graphql/generated';

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

  // Use refs to always have the latest values
  const currentFileRef = useRef<CurrentFile | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastCompiledContentRef = useRef<string | null>(null);

  const [logs, setLogs] = useState([
    '[system] Workspace initialized.',
    '[system] LaTeX 2.0e engine ready.',
    '[system] Collaborative session: ACTIVE'
  ]);

  const [parsedDoc, setParsedDoc] = useState({
    title: 'Untitled Document',
    author: 'Anonymous',
    sections: [] as { title: string, content: string }[]
  });

  const [updateWorkingFile] = useUpdateWorkingFile();

  // Update ref whenever currentFile changes
  useEffect(() => {
    currentFileRef.current = currentFile;
  }, [currentFile]);

  const handleFileSelect = (
    fileId: string,
    fileName: string,
    content: string
  ) => {
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const file = { id: fileId, name: fileName, content };

    // Reset compilation ref when switching files
    lastCompiledContentRef.current = null;

    setCurrentFile(file);
    setHasUnsavedChanges(false);
    setIsInitialLoad(false);
    setLogs(prev => [...prev, `[file] Opened ${fileName}`]);

    // Compile the new file content
    setTimeout(() => handleRecompile(false, content), 100);
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

  const saveFile = useCallback(async (contentToSave?: string) => {
    const file = currentFileRef.current;
    if (!file) return;

    const content = contentToSave ?? file.content;

    try {
      setIsSaving(true);
      await updateWorkingFile({
        variables: {
          input: {
            fileId: file.id,
            content: content
          }
        }
      });
      setHasUnsavedChanges(false);
      setLogs(prev => [...prev, `[save] Saved ${file.name}`]);
    } catch (error) {
      console.error('Failed to save:', error);
      setLogs(prev => [...prev, `[error] Failed to save ${file.name}`]);
    } finally {
      setIsSaving(false);
    }
  }, [updateWorkingFile]);

  const saveFileRef = useRef(autoSave);
  useEffect(() => {
    saveFileRef.current = autoSave;
  }, [autoSave]);


  const handleContentChange = useCallback((value: string) => {
    if (!currentFileRef.current) return;

    // Update local state immediately
    // setCurrentFile(prev => prev ? { ...prev, content: value } : null);
    setHasUnsavedChanges(true);

    // Handle Auto-Save with debouncing
    if (autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        // Pass the current value to ensure we save the latest content
        saveFileRef.current(value)
      }, 2000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleRecompile = useCallback((silent = false, contentOverride?: string) => {
    const content = contentOverride ?? currentFile?.content;
    if (!content) return;

    if (content === lastCompiledContentRef.current) return;
    lastCompiledContentRef.current = content;

    if (!silent) setIsCompiling(true);

    setTimeout(() => {
      const titleMatch = content.match(/\\title\{([^}]+)\}/);
      const authorMatch = content.match(/\\author\{([^}]+)\}/);
      const sections: { title: string, content: string }[] = [];
      const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/g;
      let match;
      let count = 1;

      while ((match = sectionRegex.exec(content)) !== null) {
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

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
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Resizing Overlay */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}

      {/* Header */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/projects" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{projectName}</h1>
            <p className="text-xs text-slate-500">ID: {id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </div>
          )}
          {!isSaving && hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
              Unsaved changes
            </div>
          )}

          <button
            onClick={() => saveFile()}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-lg transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            Save
          </button>

          <button
            onClick={() => alert("PDF Export...")}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-lg transition-colors border border-slate-200"
          >
            <Download size={16} />
            PDF
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 border border-slate-200 rounded-lg">
            <span>Auto Save</span>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoSave ? 'bg-green-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoSave ? 'translate-x-4' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 border border-slate-200 rounded-lg">
            <span>Auto Compile</span>
            <button
              onClick={() => setAutoCompile(!autoCompile)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoCompile ? 'bg-green-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoCompile ? 'translate-x-4' : ''}`} />
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
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`bg-white border-r border-slate-200 transition-all duration-300 relative ${isSidebarOpen ? 'w-64' : 'w-0'
            }`}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white absolute top-1/4 -right-3 z-30 w-6 h-6 bg-blue-400 border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
          >
            {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          {isSidebarOpen && (
            <FileExplorer
              isOpen={isSidebarOpen}
              activeFileId={currentFile?.id || ''}
              onFileSelect={handleFileSelect}
              onAssetSelect={handleAssetSelect}
              onFilesLoaded={handleFilesLoaded}
            />
          )}
        </div>

        {/* Editor Area */}
        <div
          className={`flex flex-col bg-white border-r border-slate-200 ${isResizing ? '' : 'transition-all duration-150'}`}
          style={{
            width: isPdfVisible && !isPreviewExpanded ? `${splitRatio}%` : '100%'
          }}
        >
          <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                {currentFile?.name || 'No file selected'}
              </span>
            </div>
            <button
              onClick={() => setIsPdfVisible(!isPdfVisible)}
              className={`p-1 rounded transition-colors ${!isPdfVisible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {isPdfVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {currentFile ? (
              <CMEditor
                key={currentFile.id}
                fileId={currentFile.id}
                initialContent={currentFile.content}
                onContentChange={handleContentChange}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Select a file to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        {isPdfVisible && !isPreviewExpanded && (
          <div
            onMouseDown={handleMouseDown}
            className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors z-10 relative group"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        {/* Preview Area */}
        {isPdfVisible && (
          <div className={`flex flex-col bg-slate-50 ${isPreviewExpanded ? 'flex-1' : ''}`}>
            <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4">
              <span className="text-sm font-medium text-slate-700">PDF Viewer</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                  className={`text-slate-400 hover:text-slate-600 transition-colors ${isPreviewExpanded ? 'text-blue-600 bg-blue-50 rounded p-0.5' : ''}`}
                >
                  {isPreviewExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={() => alert('Download')} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Download size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {currentFile ? (
                <div className="max-w-3xl mx-auto bg-white shadow-lg p-12 min-h-full">
                  <h1 className="text-3xl font-bold text-center mb-2">{parsedDoc.title}</h1>
                  <p className="text-center text-slate-600 mb-1">{parsedDoc.author}</p>
                  <p className="text-center text-sm text-slate-500 mb-8">{new Date().toLocaleDateString()}</p>

                  {parsedDoc.sections.map((section, idx) => (
                    <div key={idx} className="mb-6">
                      <h2 className="text-xl font-semibold mb-3 text-slate-800">{section.title}</h2>
                      <p className="text-slate-700 leading-relaxed">{section.content}</p>
                    </div>
                  ))}

                  {currentFile.content.includes('\\begin{equation}') && (
                    <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded text-center">
                      <code className="text-lg">
                        {currentFile.content.match(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/)?.[1]?.trim() || 'E = mc^2'}
                      </code>
                    </div>
                  )}

                  <div className="mt-12 pt-4 border-t border-slate-200 text-center text-sm text-slate-500">
                    Page 1 of 1
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No preview available
                </div>
              )}

              {isCompiling && (
                <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Compiling...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logs Panel */}
      {showLogs && (
        <div className="h-48 bg-slate-900 text-slate-300 border-t border-slate-700 flex flex-col">
          <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
            <span className="text-sm font-medium text-slate-200">Compilation Logs</span>
            <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white transition-colors">
              <Minimize2 size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-slate-400">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="h-8 bg-slate-800 text-slate-400 text-xs flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Activity size={12} className="text-green-500" />
            Connected
          </span>
          <span>LaTeX 2e (pdfTeX)</span>
          <button onClick={() => setShowLogs(!showLogs)} className="hover:text-white transition-colors">
            View Logs
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span>{autoSave ? '💾 Auto-save: ON' : '📝 Auto-save: OFF'}</span>
          {hasUnsavedChanges && <span className="text-amber-500">● Unsaved Changes</span>}
          <span>UTF-8</span>
          <button className="hover:text-white transition-colors flex items-center gap-1">
            <MessageSquare size={12} />
            Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
