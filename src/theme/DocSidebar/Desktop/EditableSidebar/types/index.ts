export type TreeNode = {
  type: 'dir' | 'file';
  name: string;
  path: string; // path from repo root
  sha?: string;
  children?: TreeNode[]; // for dirs
  loaded?: boolean; // whether children loaded
};

export type Change =
  | { kind: 'addFile'; path: string; content: string }
  | { kind: 'deleteFile'; path: string }
  | { kind: 'moveFile'; from: string; to: string }
  | { kind: 'addFolder'; path: string }
  | { kind: 'deleteFolder'; path: string };

export interface Repository {
  owner: string;
  repo: string;
}

export interface EditableSidebarProps {
  items: any[];
  path: string;
}

export const DOCS_ROOT = 'docs';