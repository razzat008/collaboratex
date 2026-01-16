import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Copy, Download, Edit, Trash2, ExternalLink, Clock, User as UserIcon } from "lucide-react";

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
  isLoading?: boolean;
}

export default function ProjectTable({
  projects,
  onDelete,
  onCopy,
  onDownload,
  isLoading = false
}: ProjectTableProps) {

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
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {project.id}</p>
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
          const count = value ? value.split(',').filter(Boolean).length : 0;

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
        }
      },
      {
        header: "Owner",
        accessorKey: "ownerId",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <UserIcon size={12} />
            </div>
            {/* Fix: getValue is a function but does not accept type arguments. Casting to string instead. */}
            {getValue() as string}
          </div>
        ),
      },
      {
        header: "Last Modified",
        accessorKey: "lastEditedAt",
        cell: ({ getValue }) => {
          // Fix: getValue is a function but does not accept type arguments. Casting to string instead.
          const value = getValue() as string;
          return (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock size={14} />
              {new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
                to={`/project/${project.id}?name=${encodeURIComponent(project.projectName)}`}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Open Editor"
              >
                <ExternalLink size={18} />
              </Link>
              <button
                onClick={() => onCopy(project.id)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Copy Project"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={() => onDownload(project.id)}
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
    [onDelete, onCopy, onDownload, isLoading]
  );

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-50/50 border-b border-slate-200">
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
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap"
                    >
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
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

