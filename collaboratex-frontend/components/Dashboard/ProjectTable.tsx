import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Copy, Download, Edit, Trash2, ExternalLink, Clock, User as UserIcon, UserPlus, X, Loader2 } from "lucide-react";
import { useAddCollaborator } from "@/src/graphql/generated";

// Local definition for alignment with user's GraphQL structure
export interface DashboardProject {
  id: string;
  projectName: string;
  createdAt: string;
  lastEditedAt: string;
  ownerId: string;
  collaboratorIds: string; // Sticking to user's snippet structure
  rootFileId: string;
}

interface ProjectTableProps {
  projects: DashboardProject[];
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
  onDownload: (projectName: string, id: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

// Collaborator Modal Component
function AddCollaboratorModal({
  projectId,
  projectName,
  onClose,
}: {
  projectId: string;
  projectName: string;
  onClose: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [addCollaborator, { loading, error }] = useAddCollaborator();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    try {
      console.log("Adding collaborator with:", { projectId, userID: userId.trim() });
      const result = await addCollaborator({
        variables: {
          projectId,
          userId: userId.trim(),
        },
      });
      console.log("Collaborator added successfully:", result);
      setUserId("");
      onClose();
      // Refresh the projects list after successful add
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to add collaborator:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Add Collaborator to "{projectName}"
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g., 507f1f77bcf86cd799439011"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-2">
              Enter the MongoDB User ID (24 character hex string). You can find this in your user's profile or database.
            </p>
            {error && (
              <p className="text-xs text-red-500 mt-2">
                Error: {error.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-900 font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!userId.trim() || loading}
              className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Collaborator"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectTable({
  projects,
  onDelete,
  onCopy,
  onDownload,
  onRefresh,
  isLoading = false,
}: ProjectTableProps) {
  const [collaboratorModal, setCollaboratorModal] = useState<{
    isOpen: boolean;
    projectId: string;
    projectName: string;
  }>({
    isOpen: false,
    projectId: "",
    projectName: "",
  });

  const columns = useMemo<ColumnDef<DashboardProject>[]>(
    () => [
      {
        header: "Project Name",
        accessorKey: "projectName",
        cell: ({ row }) => {
          const project = row.original;
          return (
            <Link
              to={`/project/${project.id}?name=${encodeURIComponent(project.projectName)}`}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center font-bold text-blue-600 shrink-0">
                {project.projectName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {project.projectName}
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ID: {project.id}
                </p>
              </div>
            </Link>
          );
        },
      },
      {
        header: "Collaborators",
        accessorKey: "collaboratorIds",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const count = value ? value.split(",").filter(Boolean).length : 0;

          return (
            <div className="flex -space-x-1.5">
              {count > 0 ? (
                Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white bg-slate-100
                       flex items-center justify-center text-[10px] font-bold text-slate-500"
                  >
                    C
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Private</span>
              )}
              {count > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-50
                        flex items-center justify-center text-[10px] font-bold text-slate-400">
                  +{count - 3}
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Owner",
        accessorKey: "ownerId",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <UserIcon size={12} />
            </div>
            {getValue() as string}
          </div>
        ),
      },
      {
        header: "Last Modified",
        accessorKey: "lastEditedAt",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock size={14} />
              {new Date(value).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          );
        },
      },
      {
        header: () => <div className="text-right">Actions</div>,
        id: "actions",
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Link
                to={`/project/${project.id}`}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Open Editor"
              >
                <ExternalLink size={18} />
              </Link>
              <button
                onClick={() =>
                  setCollaboratorModal({
                    isOpen: true,
                    projectId: project.id,
                    projectName: project.projectName,
                  })
                }
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                title="Add Collaborator"
              >
                <UserPlus size={18} />
              </button>
              <button
                onClick={() => onCopy(project.id)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Copy Project"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={() => onDownload(project.projectName, project.id)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Download"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => onDelete(project.id)}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        },
      },
    ],
    [isLoading]
  );

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-slate-50/50 border-b border-slate-200"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collaborator Modal */}
      {collaboratorModal.isOpen && (
        <AddCollaboratorModal
          projectId={collaboratorModal.projectId}
          projectName={collaboratorModal.projectName}
          onClose={() =>
            setCollaboratorModal({ isOpen: false, projectId: "", projectName: "" })
          }
        />
      )}
    </>
  );
}
