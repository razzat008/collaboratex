
export interface Project {
  id: string;
  name: string;
  owner: string;
  lastEdited: string;
  collaborators: string[];
  template?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  image: string;
  tag: string;
  boilerplate: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}
