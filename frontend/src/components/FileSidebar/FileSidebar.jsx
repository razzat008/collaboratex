import React from "react";
import { FileText, Plus, Trash2 } from "lucide-react";

export default function FileSidebar({ files, setCurrentFile }) {
    const handleFileClick = (fileName) => {
        setCurrentFile(fileName);
    };

    return (
        <div className="w-full h-full bg-[#1E1E2E] border-r border-[#313244] p-4 flex flex-col text-gray-300">
            {/* Header */}
            <h3 className="font-semibold text-gray-200 mb-4 tracking-wide text-lg">Project Files</h3>

            {/* File List */}
            <ul className="flex-0 overflow-y-auto space-y-2">
                {files.map((file) => (
                    <li
                        key={file.name}
                        className="flex items-center space-x-3 p-2 cursor-pointer rounded-md transition bg-[#1E1E2E] text-gray-300 hover:bg-[#45475A] hover:text-white"
                        onClick={() => handleFileClick(file.name)}
                    >
                        <FileText size={18} className="text-gray-400 group-hover:text-white" />
                        <span className="text-sm font-medium truncate">{file.name}</span>
                    </li>
                ))}
            </ul>

            {/* Buttons */}
            <div className="mt-8 space-y-3">
                <button className="w-full text-sm flex items-center justify-center space-x-2 bg-[#89B4FA] text-[#1E1E2E] py-2 rounded-md shadow-md hover:bg-[#74A2F2] transition font-medium">
                    <Plus size={18} />
                    <span>New File</span>
                </button>
                <button className="w-full text-sm flex items-center justify-center space-x-2 bg-[#F38BA8] text-[#1E1E2E] py-2 rounded-md shadow-md hover:bg-[#E07A92] transition font-medium">
                    <Trash2 size={18} />
                    <span>Delete File</span>
                </button>
            </div>
        </div>
    );
}
