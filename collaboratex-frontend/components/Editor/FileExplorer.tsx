
import React, { useState } from 'react';
import { Plus, Folder, File, FileText, ChevronDown, ChevronRight, Settings, Trash2 } from 'lucide-react';

interface FileItemProps {
  name: string;
  active?: boolean;
  inset?: boolean;
  isImage?: boolean;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const FileItem: React.FC<FileItemProps> = ({ name, active, inset, isImage, onClick, onDelete }) => (
  <div 
    onClick={onClick}
    className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${inset ? 'ml-4' : ''} ${active ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-200/50'}`}
  >
    {isImage ? <File size={14} className="opacity-70" /> : <FileText size={14} className="opacity-70" />}
    <span className="truncate flex-1">{name}</span>
    {onDelete && (
      <button 
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-all"
        title="Delete file"
      >
        <Trash2 size={12} />
      </button>
    )}
  </div>
);

const FolderItem: React.FC<{name: string, children: React.ReactNode}> = ({ name, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="mb-1">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-slate-600 hover:bg-slate-200/50 text-sm"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Folder size={14} className="text-blue-400" />
        <span className="font-medium">{name}</span>
      </div>
      {isOpen && <div className="mt-1">{children}</div>}
    </div>
  );
};

interface FileExplorerProps {
  isOpen: boolean;
  activeFile: string;
  onFileSelect: (name: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ isOpen, activeFile, onFileSelect }) => {
  const [rootFiles, setRootFiles] = useState(['main.tex', 'references.bib']);
  const [sectionFiles, setSectionFiles] = useState(['01-intro.tex', '02-methods.tex']);
  const [imageFiles, setImageFiles] = useState(['figure1.png']);

  const removeFile = (name: string, category: 'root' | 'section' | 'image') => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      if (category === 'section') {
        setSectionFiles(sectionFiles.filter(f => f !== name));
      } else if (category === 'image') {
        setImageFiles(imageFiles.filter(f => f !== name));
      } else {
        setRootFiles(rootFiles.filter(f => f !== name));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="bg-slate-50 border-r border-slate-200 transition-all duration-300 flex flex-col w-64 shrink-0">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white h-14">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Files</span>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-slate-100 rounded text-slate-500"><Plus size={14} /></button>
          <button className="p-1 hover:bg-slate-100 rounded text-slate-500"><Folder size={14} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {rootFiles.map(f => (
          <FileItem 
            key={f}
            name={f} 
            active={activeFile === f} 
            onClick={() => onFileSelect(f)}
            onDelete={(e) => {
              e.stopPropagation();
              removeFile(f, 'root');
            }}
          />
        ))}
        <FolderItem name="sections">
          {sectionFiles.map(f => (
            <FileItem 
              key={f}
              name={f} 
              active={activeFile === f} 
              onClick={() => onFileSelect(f)} 
              inset 
              onDelete={(e) => {
                e.stopPropagation();
                removeFile(f, 'section');
              }}
            />
          ))}
        </FolderItem>
        <FolderItem name="images">
          {imageFiles.map(f => (
            <FileItem 
              key={f}
              name={f} 
              active={activeFile === f} 
              onClick={() => onFileSelect(f)} 
              inset 
              isImage 
              onDelete={(e) => { 
                e.stopPropagation(); 
                removeFile(f, 'image');
              }} 
            />
          ))}
        </FolderItem>
      </div>
      <div className="p-4 border-t border-slate-200 bg-white">
        <button className="w-full flex items-center gap-3 text-sm text-slate-600 p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <Settings size={16} /> Project Settings
        </button>
      </div>
    </aside>
  );
};

export default FileExplorer;
