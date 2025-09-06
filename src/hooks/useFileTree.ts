import { useState, useCallback } from 'react';
import { listDirectory as listDirectoryApi } from '../utils/github';
import type { TreeNode, Repository } from '../theme/DocSidebar/Desktop/EditableSidebar/types';
import { DOCS_ROOT } from '../theme/DocSidebar/Desktop/EditableSidebar/types';

function createEmptyRoot(): TreeNode {
  return {
    type: 'dir',
    name: DOCS_ROOT,
    path: DOCS_ROOT,
    children: [],
    loaded: false,
  };
}

export function useFileTree(repo: Repository | null, branch: string, token: string | null) {
  const [root, setRoot] = useState<TreeNode>(createEmptyRoot);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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

  const findNode = useCallback((path: string, current: TreeNode = root): TreeNode | null => {
    if (current.path === path) return current;
    if (current.type !== 'dir' || !current.children) return null;
    for (const child of current.children) {
      const found = findNode(path, child);
      if (found) return found;
    }
    return null;
  }, [root]);

  const updateNodeChildren = useCallback((dirPath: string, children: TreeNode[]) => {
    const rec = (node: TreeNode): TreeNode => {
      if (node.path === dirPath) {
        return { ...node, children, loaded: true };
      }
      if (node.type === 'dir' && node.children) {
        return { ...node, children: node.children.map(rec) };
      }
      return node;
    };
    setRoot(prev => rec(prev));
  }, []);

  const loadChildren = useCallback(async (node: TreeNode) => {
    if (!repo || node.type !== 'dir') return;
    const children = await listDirectory(repo.owner, repo.repo, node.path);
    updateNodeChildren(node.path, children);
  }, [repo, listDirectory, updateNodeChildren]);

  const isDirEmpty = useCallback((node: TreeNode) => {
    if (node.type !== 'dir') return false;
    return !node.children || node.children.length === 0;
  }, []);

  const selectFile = useCallback((path: string | null) => {
    if (path == null) {
      setSelectedFile(null);
      return;
    }
    const node = findNode(path);
    if (node && node.type === 'file') {
      setSelectedFile(path);
    } else {
      // If node not in tree yet, allow selecting if it likely represents a file (has extension)
      const looksLikeFile = /\.[a-z0-9]+$/i.test(path);
      if (!node && looksLikeFile) {
        setSelectedFile(path);
      } else {
        // ignore directory selections
        setSelectedFile(null);
      }
    }
  }, [findNode]);

  // Reset root when repo changes
  const resetRoot = useCallback(() => {
    setRoot(createEmptyRoot());
  }, []);

  return {
    root,
    setRoot,
    selectedFile,
    setSelectedFile,
    listDirectory,
    loadChildren,
    isDirEmpty,
    selectFile,
    findNode,
    updateNodeChildren,
    resetRoot
  };
}