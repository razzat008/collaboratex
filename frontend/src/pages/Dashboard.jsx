import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Copy, Download, Archive, Trash2, MoreHorizontal, X, Github } from 'lucide-react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

import { useAuth } from '../context/AuthContext';

// Generic Modal Component with different forms based on type
const CreateProjectModal = ({ isOpen, onClose, onSubmit, type }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    githubUrl: '',
    file: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (type === "upload" && formData.file) {
      const fileData = new FormData();
      fileData.append("file", formData.file);

      try {
        const response = await fetch("http://localhost:5000/api/templates/upload", {
          method: "POST",
          body: fileData,
        });

        if (!response.ok) throw new Error("Failed to upload file");

        alert("File uploaded successfully!");
      } catch (error) {
        console.error("Upload error:", error);
        alert("File upload failed.");
      }
    }

    onSubmit({ type, ...formData });
    setFormData({ projectName: "", githubUrl: "", file: null });
    onClose();
  };

  const renderModalContent = () => {
    switch (type) {
      case 'blank':
        return (
          <>
            <h2 className="text-xl font-semibold">Create Blank Project</h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter project name"
                required
              />
            </div>
          </>
        );

      case 'example':
        return (
          <>
            <h2 className="text-xl font-semibold">Create Example Project</h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter project name"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                We'll create a copy of the example project with this name.
              </p>
            </div>
          </>
        );

      case 'upload':
        return (
          <>
            <h2 className="text-xl font-semibold">Upload Project</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File
                </label>
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  className="w-full"
                  required
                />
              </div>
            </div>
          </>
        );

      case 'github':
        return (
          <>
            <h2 className="text-xl font-semibold">Import from GitHub</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Repository URL
                </label>
                <div className="flex items-center gap-2">
                  <Github className="w-5 h-5 text-gray-500" />
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://github.com/username/repository"
                    required
                  />
                </div>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          {renderModalContent()}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Updated NewProjectDropdown component
const NewProjectDropdown = ({ isOpen, setIsOpen, onSelectOption }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  const projectOptions = [
    { name: 'Blank Project', type: 'blank' },
    { name: 'Example Project', type: 'example' },
    { name: 'Upload Project', type: 'upload' },
    { name: 'Import from GitHub', type: 'github' }
  ];

  const templateOptions = [
    'Journal articles',
    'Books',
    'Formal letters',
    'Assignments',
    'Posters',
    'Presentations',
    'Reports',
    'CVs and résumés',
    'Theses'
  ];

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200"
    >
      {/* Project Options */}
      <div className="py-1">
        {projectOptions.map((option) => (
          <button
            key={option.name}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              onSelectOption(option.type);
              setIsOpen(false);
            }}
          >
            {option.name}
          </button>
        ))}
      </div>

      {/* Templates Section */}
      <div className="border-t border-gray-200 pt-1">
        <div className="px-4 py-2 text-sm text-gray-500">Templates</div>
        {templateOptions.map((option) => (
          <button
            key={option}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              console.log(`Selected template: ${option}`);
              setIsOpen(false);
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* View All Option */}
      <div className="border-t border-gray-200">
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => {
            console.log('View All');
            setIsOpen(false);
          }}
        >
          View All
        </button>
      </div>
    </div>
  );
};

const ProjectDashboard = () => {
  const { isAuthenticated, token } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [data, setData] = useState([
    // { 
    //   title: 'collaboratex', 
    //   owner: 'Suraj Thapa', 
    //   lastModified: 'a month ago by Dragon Law',
    //   id: 1 
    // },
    // // ... other data
  ]);

  const handleCreateProject = (projectData) => {
    const newProject = {
      id: data.length + 1,
      title: projectData.projectName,
      owner: 'You',
      lastModified: 'Just now by You'
    };
    setData([newProject, ...data]);

    // Handle different project types
    switch (projectData.type) {
      case 'github':
        console.log('Creating project from GitHub:', projectData.githubUrl);
        break;
      case 'upload':
        console.log('Creating project from upload:', projectData.file);
        break;
      default:
        console.log('Creating project:', projectData.type);
    }
  };

  const handleDeleteProject = (projectId) => {
    setData(data.filter(project => project.id !== projectId));
  };

  const handleCopyProject = (project) => {
    console.log('Copy project:', project);
    // Implement copy functionality here
  };

  const handleDownloadProject = (project) => {
    console.log('Download project:', project);
    // Implement download functionality here
  };

  const handleArchiveProject = (project) => {
    console.log('Archive project:', project);
    // Implement archive functionality here
  };

  const handleMoreOptions = (project) => {
    console.log('More options for project:', project);
    // Implement more options functionality here
  };

  const columns = useMemo(
    () => [
      { header: 'Title', accessorKey: 'title' },
      { header: 'Owner', accessorKey: 'owner' },
      { header: 'Last Modified', accessorKey: 'lastModified' },
      {
        header: 'Actions',
        accessorKey: 'actions',
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <button className="text-blue-500 hover:text-blue-700" onClick={() => handleCopyProject(row.original)}>
              <Copy className="w-5 h-5" />
            </button>
            <button className="text-green-500 hover:text-green-700" onClick={() => handleDownloadProject(row.original)}>
              <Download className="w-5 h-5" />
            </button>
            <button className="text-yellow-500 hover:text-yellow-700" onClick={() => handleArchiveProject(row.original)}>
              <Archive className="w-5 h-5" />
            </button>
            <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteProject(row.original.id)}>
              <Trash2 className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => handleMoreOptions(row.original)}>
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        )
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">All Projects</h1>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            New Project
          </button>
          <NewProjectDropdown
            isOpen={isDropdownOpen}
            setIsOpen={setIsDropdownOpen}
            onSelectOption={(type) => setModalType(type)}
          />
        </div>
      </div>

      <CreateProjectModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        onSubmit={handleCreateProject}
        type={modalType}
      />

      <div className="table-container mt-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {data.length} projects.
      </div>
    </div>
  );
};

export default ProjectDashboard;

