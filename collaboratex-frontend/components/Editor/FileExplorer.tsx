import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Folder, FileText, ChevronDown, ChevronRight, Settings, Trash2, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useGetProjectWithoutContent, useGetFile, useDeleteFile } from '@/src/graphql/generated';

interface FileItemProps {
  id: string;
  name: string;
  type?: string;
  active?: boolean;
  inset?: boolean;
  isAsset?: boolean;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const FileItem: React.FC<FileItemProps> = ({ id, name, type, active, inset, isAsset, onClick, onDelete }) => {
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText size={14} className="opacity-70" />;

    const typeMap: Record<string, React.ReactNode> = {
      TEX: <FileText size={14} className="opacity-70 text-blue-500" />,
      BIB: <FileText size={14} className="opacity-70 text-yellow-500" />,
      CLS: <FileText size={14} className="opacity-70 text-purple-500" />,
      STY: <FileText size={14} className="opacity-70 text-green-500" />,
      OTHER: <FileText size={14} className="opacity-70" />,
    };
    return typeMap[fileType] || <FileText size={14} className="opacity-70" />;
  };

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${inset ? 'ml-4' : ''} ${active ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-200/50'
        }`}
      title={name}
    >
      {getFileIcon(type)}
      <span className="truncate flex-1">{name}</span>
      {type && <span className="text-xs opacity-60 ml-1">{type}</span>}
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
};

const FolderItem: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => {
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
  activeFileId: string;
  onFileSelect: (fileId: string, fileName: string, content: string) => void;
  onAssetSelect: (assetPath: string) => void;
  onFilesLoaded?: (files: Array<{ id: string; name: string }>, rootFileId?: string) => string | undefined;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ isOpen, activeFileId, onFileSelect, onAssetSelect, onFilesLoaded }) => {
  const { id: projectId } = useParams();
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const hasLoadedDefault = useRef(false);

  // Fetch project with files & assets
  const { data, loading, error, refetch } = useGetProjectWithoutContent({
    variables: { id: projectId as string },
    skip: !projectId,
  });

  // Fetch the selected file's content
  const { data: fileData, loading: fileLoading } = useGetFile({
    variables: { id: selectedFileId as string },
    skip: !selectedFileId,
  });

  // When file content is loaded, pass it to parent
  useEffect(() => {
    if (fileData?.file && !fileLoading) {
      const file = fileData.file;
      const content = file.workingFile?.content || '';
      onFileSelect(file.id, file.name, content);
    }
  }, [fileData, fileLoading]);

  // Auto-select default file on initial load
  useEffect(() => {
    if (!data?.project || hasLoadedDefault.current || !onFilesLoaded) return;

    const files = data.project.files || [];
    if (files.length === 0) return;

    const defaultFileId = onFilesLoaded(
      files.map(f => ({ id: f.id, name: f.name })),
      data.project.rootFileId
    );

    if (defaultFileId) {
      hasLoadedDefault.current = true;
      setSelectedFileId(defaultFileId);
    }
  }, [data, onFilesLoaded]);

  const handleFileClick = (fileId: string) => {
    setSelectedFileId(fileId);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    const token = await getToken();
    setIsUploading(true);

    const isZip = file.name.toLowerCase().endsWith(".zip");
    const url = isZip
      ? `http://localhost:8080/api/uploads/zip`
      : `http://localhost:8080/api/uploads/file`;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      refetch();
    } catch (err) {
      console.error(err);
      alert('File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [deleteFile] = useDeleteFile();
  const handleDeleteFile = async (
    fileId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const confirmed = confirm("Are you sure you want to delete this file?");
    if (!confirmed) return;

    try {
      await deleteFile({
        variables: { fileId },

        update(cache) {
          cache.modify({
            id: cache.identify({
              __typename: "Project",
              id: projectId,
            }),
            fields: {
              files(existingRefs = [], { readField }) {
                return existingRefs.filter(
                  ref => readField("id", ref) !== fileId
                );
              },
            },
          });
        },
      });

      // optional: reset selected file if deleted
      if (selectedFileId === fileId) {
        setSelectedFileId(null);
      }

    } catch (err) {
      console.error("Delete file failed", err);
      alert("Failed to delete file");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;
  if (loading) return <div className="p-4 text-slate-500">Loading files...</div>;
  if (error) return <div className="p-4 text-red-600">Failed to load files</div>;

  const project = data?.project;
  if (!project) return <div className="p-4 text-slate-500">No project found</div>;

  const files = project.files || [];
  const assets = project.assets || [];

  return (
    <aside className="bg-slate-50 border-r border-slate-200 transition-all duration-300 flex flex-col w-64 shrink-0 h-screen">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white h-14 shrink-0">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Files</span>
        <div className="flex gap-1 items-center">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept="*/*"
          />
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors disabled:opacity-50"
            title="Upload File"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          </button>
          <button
            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
            title="New File"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 && assets.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            No files yet. Upload or create one to get started.
          </div>
        ) : (
          <>
            {/* Files Section */}
            {files.length > 0 && (
              <div className="mb-4">
                {files.map(file => (
                  <FileItem
                    key={file.id}
                    id={file.id}
                    name={file.name}
                    type={file.type}
                    active={activeFileId === file.id}
                    onClick={() => handleFileClick(file.id)}
                    onDelete={(e) => handleDeleteFile(file.id, e)}
                  />
                ))}
              </div>
            )}

            {/* Assets Section */}
            {assets.length > 0 && (
              <FolderItem name={`Assets (${assets.length})`}>
                {assets.map(asset => {
                  const fileName = asset.path.split('/').pop() || asset.path;
                  return (
                    <FileItem
                      key={asset.id}
                      id={asset.id}
                      name={fileName}
                      inset
                      isAsset
                      onClick={() => onAssetSelect(asset.path)}
                    />
                  );
                })}
              </FolderItem>
            )}
          </>
        )}
      </div>

      {/* Loading indicator when fetching file content */}
      {fileLoading && (
        <div className="px-4 py-2 border-t border-slate-200 bg-blue-50 text-blue-600 text-xs flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" />
          Loading file content...
        </div>
      )}

      <div className="p-4 border-t border-slate-200 bg-white h-14 shrink-0">
        <button className="w-full flex items-center gap-3 text-sm text-slate-600 p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <Settings size={16} /> Project Settings
        </button>
      </div>
    </aside>
  );
};

export default FileExplorer;
