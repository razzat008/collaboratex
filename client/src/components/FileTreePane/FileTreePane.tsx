import React from "react";

type FileNode = {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
};

const mockFiles: FileNode[] = [
  { name: "main.tex", type: "file" },
  {
    name: "sections",
    type: "folder",
    children: [
      { name: "introduction.tex", type: "file" },
      { name: "methods.tex", type: "file" },
      { name: "results.tex", type: "file" },
    ],
  },
  { name: "references.bib", type: "file" },
];

const FileTree: React.FC<{ files: FileNode[] }> = ({ files }) => (
  <ul style={{ listStyle: "none", paddingLeft: "1em" }}>
    {files.map((file, idx) => (
      <li key={idx}>
        {file.type === "folder" ? (
          <details open>
            <summary style={{ fontWeight: "bold", cursor: "pointer" }}>
              {file.name}
            </summary>
            {file.children && <FileTree files={file.children} />}
          </details>
        ) : (
          <span style={{ cursor: "pointer" }}>{file.name}</span>
        )}
      </li>
    ))}
  </ul>
);

const FileTreePane: React.FC = () => {
  return (
    <div style={{ padding: "1em" }}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: "1em",
          color: "var(--primary, #4B9CD3)",
        }}
      >
        Project Files
      </h3>
      <FileTree files={mockFiles} />
    </div>
  );
};

export default FileTreePane;
