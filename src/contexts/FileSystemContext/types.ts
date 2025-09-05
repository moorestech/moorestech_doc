// ファイルシステムのノード型
export interface FileNode {
  type: 'file';
  name: string;
  path: string;
  content: string;
  originalContent?: string; // 元のコンテンツ（変更検出用）
  sha?: string; // GitHubのSHA
  isNew?: boolean; // 新規作成されたファイル
  isDeleted?: boolean; // 削除予定のファイル
  isModified?: boolean; // 変更されたファイル
}

export interface DirectoryNode {
  type: 'directory';
  name: string;
  path: string;
  children: Map<string, FileSystemNode>;
  sha?: string;
  isNew?: boolean;
  isDeleted?: boolean;
  isExpanded?: boolean;
}

export type FileSystemNode = FileNode | DirectoryNode;

// 変更の種類
export type FileChange = 
  | { type: 'create'; path: string; content: string; isDirectory: boolean }
  | { type: 'modify'; path: string; content: string; originalContent: string }
  | { type: 'delete'; path: string; isDirectory: boolean }
  | { type: 'rename'; oldPath: string; newPath: string; isDirectory: boolean };

// ファイルシステムの状態
export interface FileSystemState {
  root: DirectoryNode;
  selectedFile: string | null;
  changes: FileChange[];
  isLoading: boolean;
  error: string | null;
}

// リポジトリ情報
export interface RepositoryInfo {
  owner: string;
  repo: string;
  branch: string;
  isFork?: boolean;
}

// ファイルシステムコンテキストの型
export interface FileSystemContextType {
  // State
  fileSystem: FileSystemState;
  repository: RepositoryInfo | null;
  
  // File Operations
  createFile: (parentPath: string, name: string, content?: string) => void;
  createDirectory: (parentPath: string, name: string) => void;
  deleteNode: (path: string) => void;
  renameNode: (oldPath: string, newPath: string) => void;
  moveNodes: (sourcePaths: string[], targetPath: string) => void;
  updateFileContent: (path: string, content: string) => void;
  
  // Selection
  selectFile: (path: string | null) => void;
  
  // Directory Operations
  toggleDirectory: (path: string) => void;
  loadDirectoryContents: (path: string) => Promise<void>;
  
  // Load & Save
  loadFromGitHub: (path: string) => Promise<void>;
  createPullRequest: (title?: string, description?: string) => Promise<string>;
  
  // Utils
  getNode: (path: string) => FileSystemNode | undefined;
  hasUnsavedChanges: () => boolean;
  clearChanges: () => void;
}