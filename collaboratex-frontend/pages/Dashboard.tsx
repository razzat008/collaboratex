import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  X
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import ProjectTable, { DashboardProject } from '../components/Dashboard/ProjectTable';
import { useUser, useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { useCreateProject, useDeleteProject, useGetProjects } from "@/src/graphql/generated";
import LoadingScreen from '@/components/Dashboard/LoadingScreen';
import { useApolloClient } from '@apollo/client/react';

const Dashboard: React.FC = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [projects, setProjects] = useState<DashboardProject[]>([]);

  const { user, isLoaded } = useUser();
  const { data, loading, error, refetch } = useGetProjects();
  const [deleteProject] = useDeleteProject();
  const [createProject] = useCreateProject();
  const apolloClient = useApolloClient();

  useEffect(() => {
    if (!data?.projects) {
      return;
    }
    const mapped: DashboardProject[] = data.projects.map(proj => ({
      id: proj.id,
      projectName: proj.projectName,
      createdAt: proj.createdAt,
      lastEditedAt: proj.lastEditedAt,
      ownerId: proj.ownerId,
      collaboratorIds: proj.collaboratorIds.map((c: any) => c.id).join(','),
      rootFileId: proj.rootFileId
    }));
    setProjects(mapped);
  }, [data]);

  // Local state for projects, mapping to the new structure
  const filteredProjects = useMemo(() => {
    return projects.filter((p: { projectName: string; }) =>
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  if (!isLoaded || loading) return <LoadingScreen />;
  if (error) return <div>Error: {error.message}</div>;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject({
        variables: {
          input: {
            projectName: newProjectName,
          },
        },
        update(cache, { data }) {
          if (!data?.createProject) return;

          cache.modify({
            fields: {
              projects(existingRefs = []) {
                return [data.createProject, ...existingRefs];
              },
            },
          });
        },
      });

      // UI cleanup
      setNewProjectName("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("CreateProject failed", err);
      alert("Failed to create project");
    }
  };

  const handleDeleteProject = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteProject({
        variables: { projectId: id },

        update(cache) {
          // Remove the deleted project from the cache
          cache.modify({
            fields: {
              projects(existingRefs = [], { readField }) {
                return existingRefs.filter(
                  ref => readField("id", ref) !== id
                );
              },
            },
          });
        },
      });
    } catch (err) {
      console.error("DeleteProject failed", err);
      alert("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyProject = (id: string) => {
    const projectToCopy = projects.find(p => p.id === id);
    if (projectToCopy) {
      const newProject = {
        ...projectToCopy,
        id: Math.random().toString(36).substr(2, 9),
        projectName: `${projectToCopy.projectName} (Copy)`,
        lastEditedAt: new Date().toISOString()
      };
      setProjects([newProject, ...projects]);
    }
  };

  const handleDownloadProject = async (projectName: string, id: string) => {
    const token = await getToken();
    try {
      const response = await fetch(
        `http://localhost:8080/api/downloads/project/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download project");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Project download failed");
    }
  };

  // Refetch projects when needed (e.g., after adding collaborator)
  const handleRefreshProjects = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Header - Standardized h-14 to match Editor and Templates */}
      <nav className="h-14 bg-white border-b border-slate-200 sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/">
            <BrandLogo size="sm" />
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          <div className="hidden md:flex items-center gap-4">
            <button className="text-sm font-semibold text-slate-900 border-b-2 border-slate-900 h-14 flex items-center px-2">Projects</button>
            <Link to="/templates" className="text-sm font-medium text-slate-500 hover:text-slate-900 h-14 flex items-center px-2 transition-colors">Templates</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm w-64 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center cursor-pointer border border-slate-300">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
            <p className="text-sm text-slate-500">Manage and edit your research documents.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={18} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        {/* Modular Project Table Component */}
        <ProjectTable
          projects={filteredProjects}
          onDelete={handleDeleteProject}
          onCopy={handleCopyProject}
          onDownload={handleDownloadProject}
          onRefresh={handleRefreshProjects}
          isLoading={isDeleting}
        />
      </main>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create New Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. My Thesis, Resume 2024"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                <button type="submit" className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <div className="w-8 h-8 bg-white border border-slate-100 rounded flex items-center justify-center mb-2 shadow-sm">
                    <Plus size={16} className="text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <span className="text-sm font-bold block text-slate-900">Blank Project</span>
                  <span className="text-xs text-slate-500">Start from scratch</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/templates')}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-8 h-8 bg-white border border-slate-100 rounded flex items-center justify-center mb-2 shadow-sm">
                    <Filter size={16} className="text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <span className="text-sm font-bold block text-slate-900">From Template</span>
                  <span className="text-xs text-slate-500">Pick a starting point</span>
                </button>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
                disabled={!newProjectName.trim()}
              >
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
