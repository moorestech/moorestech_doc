import type { TreeNode, Repository, Change } from '../theme/DocSidebar/Desktop/EditableSidebar/types';

export type FileMap = Map<string, string>;

export interface FileSystemContextValue {
  // Repo
  repo: Repository | null;
  branch: string;
  loading: boolean;
  error: string | null;

  // Tree & selection
  root: TreeNode;
  listDirectory: (owner: string, repo: string, dirPath: string) => Promise<TreeNode[]>;
  loadChildren: (node: TreeNode) => Promise<void>;
  isDirEmpty: (node: TreeNode) => boolean;

  selectedFile: string | null;
  selectFile: (path: string | null) => void;

  // Content access
  getFileContent: (path: string) => Promise<string>;
  setFileContent: (path: string, content: string) => void;

  // Structure operations (staged to in-memory)
  addFile: (path: string, content?: string) => void;
  addFolder: (path: string) => void;
  deleteFile: (path: string) => void;
  deleteFolder: (path: string) => void;
  moveFile: (from: string, to: string) => void;

  // Changes management
  changes: Change[];
  clearChanges: () => void;

  // Persist
  isSaving: boolean;
  status: string | null;
  resultUrl: string | null;
  saveAllChanges: () => Promise<void>;
}