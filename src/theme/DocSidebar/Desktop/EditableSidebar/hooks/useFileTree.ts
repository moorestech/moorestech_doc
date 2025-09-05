import { useState, useCallback, useEffect } from 'react';
import { useAuthToken } from '../../../../../auth/contexts/AuthContext';
import { listDirectory as listDirectoryApi, GitHubItem } from '../../../../../utils/github';
import { TreeNode, Repository, DOCS_ROOT } from '../types';

interface UseFileTreeReturn {
  root: TreeNode;
  expanded: Set<string>;
  toggleExpand: (path: string) => void;
  loadChildren: (node: TreeNode) => Promise<void>;
  listDirectory: (owner: string, repoName: string, dirPath: string) => Promise<TreeNode[]>;
  isDirEmpty: (node: TreeNode) => boolean;
}

export const useFileTree = (repo: Repository | null, branch: string): UseFileTreeReturn => {
  const token = useAuthToken();
  const [root, setRoot] = useState<TreeNode>({ 
    type: 'dir', 
    name: DOCS_ROOT, 
    path: DOCS_ROOT, 
    children: [], 
    loaded: false 
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set([DOCS_ROOT]));

  const toggleExpand = useCallback((p: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(p)) n.delete(p); else n.add(p);
      return n;
    });
  }, []);

  // GitHub contents APIのラッパー
  const listDirectory = useCallback(async (owner: string, repoName: string, dirPath: string): Promise<TreeNode[]> => {
    const items = await listDirectoryApi(owner, repoName, dirPath, branch, token);
    return items.map<TreeNode>((item) => ({
      type: item.type,
      name: item.name,
      path: item.path,
      sha: item.sha,
      children: item.type === 'dir' ? [] : undefined,
      loaded: item.type === 'dir' ? false : undefined,
    }));
  }, [branch, token]);

  const loadChildren = useCallback(async (node: TreeNode) => {
    if (!repo || node.type !== 'dir') return;
    if (node.loaded) return;
    const children = await listDirectory(repo.owner, repo.repo, node.path);
    setRoot((prev) => {
      const update = (n: TreeNode): TreeNode => {
        if (n.path === node.path) return { ...n, children, loaded: true };
        if (n.type === 'dir' && n.children) {
          return { ...n, children: n.children.map(update) };
        }
        return n;
      };
      return update(prev);
    });
  }, [repo, listDirectory]);

  // Load initial tree
  useEffect(() => {
    let aborted = false;
    (async () => {
      if (!repo) return;
      try {
        const children = await listDirectory(repo.owner, repo.repo, DOCS_ROOT);
        if (aborted) return;
        setRoot({ type: 'dir', name: DOCS_ROOT, path: DOCS_ROOT, children, loaded: true });
      } catch (e: any) {
        if (aborted) return;
        // Error handling is done in parent component
        console.error('Failed to load initial tree:', e);
      }
    })();
    return () => { aborted = true; };
  }, [repo, listDirectory]);

  const isDirEmpty = useCallback((node: TreeNode): boolean => {
    if (node.type !== 'dir') return true;
    const stack: TreeNode[] = [...(node.children || [])];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.type === 'file') return false;
      if (n.children) stack.push(...n.children);
    }
    return true;
  }, []);

  return {
    root,
    expanded,
    toggleExpand,
    loadChildren,
    listDirectory,
    isDirEmpty,
  };
};