import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Search, Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { 
  useGetPublicTemplates, 
  useGetMyTemplates, 
  useUseTemplate, 
  useDeleteTemplate, 
  useGetTemplateLazyQuery 
} from '@/src/graphql/generated';
import BrandLogo from '../components/BrandLogo';

// --- Interfaces ---
interface TemplateMetadata {
  name: string;
  description: string;
  isPublic: boolean;
  tags: string[];
}

interface TemplateUploadDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (file: File, metadata: TemplateMetadata, previewImage?: File) => Promise<void>;
}

// --- Components ---

const TemplateSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-slate-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-200 rounded w-full" />
      <div className="flex justify-between pt-2">
        <div className="h-3 bg-slate-200 rounded w-12" />
        <div className="h-5 w-5 bg-slate-200 rounded-full" />
      </div>
    </div>
  </div>
);

const TemplateUploadDialog: React.FC<TemplateUploadDialogProps> = ({ isOpen, isLoading, onClose, onSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<TemplateMetadata>({
    name: '',
    description: '',
    isPublic: true,
    tags: [],
  });

  useEffect(() => {
    return () => {
      if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    };
  }, [previewImageUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a ZIP file');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid format. Use JPG, PNG, or WebP');
      return;
    }
    if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    setPreviewImageFile(file);
    setPreviewImageUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    setPreviewImageFile(null);
    setPreviewImageUrl('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !metadata.name.trim()) {
      setError('Name and ZIP file are required');
      return;
    }
    try {
      await onSubmit(selectedFile, metadata, previewImageFile || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Upload New Template</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">ZIP Package *</label>
            <input type="file" ref={fileInputRef} className="hidden" accept=".zip" onChange={handleFileSelect} />
            <div
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`cursor-pointer p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
            >
              <Upload className={selectedFile ? 'text-blue-600' : 'text-slate-400'} size={28} />
              <span className="text-sm font-medium text-slate-600">{selectedFile ? selectedFile.name : 'Select template ZIP file'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Preview Image</label>
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            {previewImageUrl ? (
              <div className="relative rounded-xl overflow-hidden group h-40 border border-slate-200">
                <img src={previewImageUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="px-3 py-1.5 bg-white rounded-md text-sm font-medium">Change</button>
                  <button type="button" onClick={handleRemoveImage} className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium">Remove</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2">
                <ImageIcon size={20} /> <span className="text-sm">Add Preview Screenshot</span>
              </button>
            )}
          </div>

          <div className="grid gap-4">
            <input
              placeholder="Template Name *"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={metadata.name}
              onChange={e => setMetadata({ ...metadata, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={metadata.description}
              onChange={e => setMetadata({ ...metadata, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Visibility</label>
            <div className="flex bg-slate-100 p-1 rounded-lg w-full">
              <button type="button" onClick={() => setMetadata({ ...metadata, isPublic: true })} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${metadata.isPublic ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Public</button>
              <button type="button" onClick={() => setMetadata({ ...metadata, isPublic: false })} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!metadata.isPublic ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Private</button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2 text-slate-600 font-medium">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              {isLoading ? 'Uploading...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TemplateCard: React.FC<{
  template: any;
  onUse: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
}> = ({ template, onUse, onDelete }) => {
  const [prefetchTemplate] = useGetTemplateLazyQuery();

  return (
    <div
      onClick={() => onUse(template.id, template.name)}
      onMouseEnter={() => prefetchTemplate({ variables: { id: template.id } })}
      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-blue-400 transition-all cursor-pointer flex flex-col relative"
    >
      <div className="absolute top-2 left-2 z-10">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
          template.isPublic ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-100'
        }`}>
          {template.isPublic ? 'Public' : 'Private'}
        </span>
      </div>

      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
        {template.previewImage ? (
          <img src={template.previewImage} alt={template.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-4xl bg-gradient-to-br from-slate-50 to-slate-200">
            {template.name.charAt(0)}
          </div>
        )}

        {/* Delete button only renders if parent provides onDelete function */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(template.id);
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-500 hover:text-white z-20"
            title={template.isPublic ? "Remove from Public Gallery" : "Delete Template"}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{template.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mt-1 mb-4">{template.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex gap-1 overflow-hidden">
            {template.tags?.slice(0, 2).map((tag: string) => (
              <span key={tag} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase font-bold tracking-tight">{tag}</span>
            ))}
          </div>
          <ChevronLeft className="rotate-180 text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
        </div>
      </div>
    </div>
  );
};

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: publicData, loading: publicLoading, refetch: refetchPublic } = useGetPublicTemplates();
  const { data: myData, loading: myLoading, refetch: refetchMy } = useGetMyTemplates();
  const [useTemplateMutation] = useUseTemplate();
  const [deleteTemplate] = useDeleteTemplate();

  const refetchAll = () => {
    refetchPublic();
    refetchMy();
  };

  const allTemplates = useMemo(() => {
    const publicList = publicData?.publicTemplates || [];
    const myList = myData?.myTemplates || [];

    // Mark ownership logic
    const combined = publicList.map(t => ({
      ...t,
      isOwner: !!myList.find(myT => myT.id === t.id)
    }));

    myList.forEach(myT => {
      if (!combined.find(t => t.id === myT.id)) {
        combined.push({ ...myT, isOwner: true });
      }
    });

    return combined.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [publicData, myData, searchQuery]);

  const isLoading = publicLoading || myLoading;

  const handleUseTemplate = async (templateId: string, templateName: string) => {
    if (!isSignedIn) return navigate('/sign-in');
    try {
      const { data } = await useTemplateMutation({
        variables: { templateId, projectName: `${templateName} Copy` }
      });
      if (data?.useTemplate.id) navigate(`/project/${data.useTemplate.id}`);
    } catch (err) {
      alert('Error creating project');
    }
  };

  const handleDelete = async (templateId: string) => {
    const template = allTemplates.find(t => t.id === templateId);
    const msg = template?.isPublic
      ? "This is a PUBLIC template. Deleting it removes it for everyone. Continue?"
      : "Delete this template?";

    if (!window.confirm(msg)) return;

    try {
      await deleteTemplate({
        variables: { templateId },
        update: (cache) => {
          // Efficiently remove from local cache without full refetch
          cache.evict({ id: cache.identify({ __typename: 'Template', id: templateId }) });
          cache.gc();
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Delete failed: ${message}`);
    }
  };

  const handleUploadTemplate = async (file: File, metadata: TemplateMetadata, previewImage?: File) => {
    const token = await getToken();
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', metadata.name);
      formData.append('description', metadata.description);
      formData.append('isPublic', String(metadata.isPublic));
      formData.append('tags', metadata.tags.join(','));
      if (previewImage) formData.append('previewImage', previewImage);

      const res = await fetch('http://localhost:8080/api/uploads/zip', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      refetchAll();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="h-16 bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20} /></Link>
          <BrandLogo size="sm" />
        </div>
        {isSignedIn && (
          <button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Upload size={16} /> Share Template
          </button>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Template Gallery</h1>
          <p className="text-slate-500 mt-2">Start your next project with a professionally designed LaTeX layout.</p>
        </header>

        <div className="relative mb-8 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <TemplateSkeleton key={i} />)
          ) : (
            allTemplates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onUse={handleUseTemplate}
                onDelete={t.isOwner ? handleDelete : undefined}
              />
            ))
          )}
        </div>
      </main>

      {showUploadDialog && (
        <TemplateUploadDialog
          isOpen={showUploadDialog}
          isLoading={isUploading}
          onClose={() => setShowUploadDialog(false)}
          onSubmit={handleUploadTemplate}
        />
      )}
    </div>
  );
};

export default Templates;
