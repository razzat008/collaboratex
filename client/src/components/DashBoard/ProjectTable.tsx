import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Copy, Download, Edit, Trash2 } from "lucide-react";

import { useDeleteProject  } from "@/graphql/generated";

type Project = {
  id: string;
  projectName: string;
  createdAt: string;
  lastEditedAt: string;
  ownerId: string;
  collaboratorIds: string;
  rootFileId: string;
};

type Props = {
  projects: Project[];
};

export default function ProjectTable({ projects }: Props) {

  const [deleteProject, { loading, error }] = useDeleteProject();
  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        header: "Title",
        accessorKey: "projectName",
      },
      {
        header: "Collaborators",
        accessorKey: "collaboratorIds",
      },
      {
        header: "Owner",
        accessorKey: "ownerId",
      },
      {
        header: "Last Modified",
        accessorKey: "lastEditedAt",
        cell: ({ getValue }) => {
          const value = getValue<string>();
          return new Date(value).toLocaleDateString();
        },
      },
      {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => {
          const project = row.original;

          return (
            <div className="flex space-x-2">
              <button
                onClick={() => console.log("Copy", project.id)}
              >
                <Copy size={18} />
              </button>

              <button
                onClick={() => console.log("Download", project.id)}
              >
                <Download size={18} />
              </button>

              <button
                onClick={() => console.log("Edit", project.id)}
              >
                <Edit size={18} />
              </button>

              <button
                onClick={() => {
                  deleteProject({
                    variables: { projectId: project.id },
                    refetchQueries: ['GetProjects'],
                  });
                }} disabled={loading}
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
