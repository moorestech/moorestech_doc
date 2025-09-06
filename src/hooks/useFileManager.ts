import { useState, useCallback, useRef } from 'react';
import { buildCustomGitHubRawUrl } from '../utils/github';
import { getFileContentViaApi } from '../utils/github/getFileContent';
import type { TreeNode, Repository, Change } from '../theme/DocSidebar/Desktop/EditableSidebar/types';
import type { FileMap } from './types';

interface UseFileManagerProps {
  repo: Repository | null;
  branch: string;
  token: string | null;
  selectedFile: string | null;
  setSelectedFile: (path: string | null) => void;
  setRoot: React.Dispatch<React.SetStateAction<TreeNode>>;
}

export function useFileManager({
  repo,
  branch,
  token,
  selectedFile,
  setSelectedFile,
  setRoot
}: UseFileManagerProps) {
  const contentsRef = useRef<FileMap>(new Map());
  const [changes, setChanges] = useState<Change[]>([]);

  const upsertChange = useCallback((newChange: Change) => {
    setChanges(prev => {
      // For updateFile/addFile, dedupe by path
      if (newChange.kind === 'updateFile' || newChange.kind === 'addFile') {
        const idx = prev.findIndex(c => 
          (c.kind === newChange.kind || c.kind === 'updateFile' || c.kind === 'addFile') && 
          'path' in c && (c as any).path === (newChange as any).path
        );
        if (idx >= 0) {
          const copy = prev.slice();
          copy[idx] = newChange;
          return copy;
        }
      }
      return [...prev, newChange];
    });
  }, []);

  const getFileContent = useCallback(async (path: string) => {
    const cached = contentsRef.current.get(path);
    if (cached !== undefined) return cached;
    if (!repo) return '';
    
    console.log('[getFileContent] Fetching content for:', path);
    console.log('[getFileContent] Repo:', repo.owner, repo.repo);
    console.log('[getFileContent] Branch:', branch);
    console.log('[getFileContent] Using token:', !!token);
    
    try {
      // GitHub APIを使用してコンテンツを取得
      const text = await getFileContentViaApi(
        repo.owner,
        repo.repo,
        path,
        branch,
        token
      );
      
      console.log('[getFileContent] Content fetched successfully, length:', text.length);
      contentsRef.current.set(path, text);
      return text;
    } catch (error) {
      console.error('[getFileContent] Error fetching content:', error);
      
      // フォールバック: GitHub Raw URLを試す（パブリックリポジトリの場合）
      if (!token) {
        console.log('[getFileContent] Attempting fallback to raw.githubusercontent.com');
        try {
          const raw = buildCustomGitHubRawUrl(repo.owner, repo.repo, branch, path);
          const res = await fetch(raw);
          
          if (res.ok) {
            const text = await res.text();
            contentsRef.current.set(path, text);
            return text;
          }
        } catch (fallbackError) {
          console.error('[getFileContent] Fallback also failed:', fallbackError);
        }
      }
      
      throw error;
    }
  }, [repo, branch, token]);

  const setFileContent = useCallback((path: string, content: string) => {
    contentsRef.current.set(path, content);
    // Stage update or add
    setChanges(prev => {
      // If this file was added in-session, update its addFile content
      const idxAdd = prev.findIndex(c => c.kind === 'addFile' && c.path === path);
      if (idxAdd >= 0) {
        const copy = prev.slice();
        (copy[idxAdd] as any).content = content;
        return copy;
      }
      // Otherwise stage updateFile (dedupe)
      const idxUpd = prev.findIndex(c => c.kind === 'updateFile' && c.path === path);
      if (idxUpd >= 0) {
        const copy = prev.slice();
        (copy[idxUpd] as any).content = content;
        return copy;
      }
      return [...prev, { kind: 'updateFile', path, content } as Change];
    });
  }, []);

  const addFile = useCallback((path: string, content: string = `# ${path.split('/').pop()?.replace(/\.[^/.]+$/, '') || ''}`) => {
    // update tree
    const parentDir = path.split('/').slice(0, -1).join('/');
    const name = path.split('/').pop()!;
    const rec = (node: TreeNode): TreeNode => {
      if (node.path === parentDir) {
        const nextChildren = (node.children || [])
          .concat([{ type: 'file', name, path } as TreeNode])
          .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
        return { ...node, children: nextChildren, loaded: true };
      }
      if (node.type === 'dir' && node.children) {
        return { ...node, children: node.children.map(rec) };
      }
      return node;
    };
    setRoot(prev => rec(prev));
    // set content & stage change
    contentsRef.current.set(path, content);
    upsertChange({ kind: 'addFile', path, content });
  }, [setRoot, upsertChange]);

  const addFolder = useCallback((path: string) => {
    const parentDir = path.split('/').slice(0, -1).join('/');
    const name = path.split('/').pop()!;
    const rec = (node: TreeNode): TreeNode => {
      if (node.path === parentDir) {
        const nextChildren = (node.children || [])
          .concat([{ type: 'dir', name, path, children: [], loaded: true } as TreeNode])
          .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
        return { ...node, children: nextChildren, loaded: true };
      }
      if (node.type === 'dir' && node.children) {
        return { ...node, children: node.children.map(rec) };
      }
      return node;
    };
    setRoot(prev => rec(prev));
    upsertChange({ kind: 'addFolder', path });
  }, [setRoot, upsertChange]);

  const deleteFile = useCallback((path: string) => {
    const rec = (node: TreeNode): TreeNode => {
      if (node.type === 'dir' && node.children) {
        const filtered = node.children.filter(c => c.path !== path).map(rec);
        return { ...node, children: filtered };
      }
      return node;
    };
    setRoot(prev => rec(prev));
    contentsRef.current.delete(path);
    // If this file was newly added, removing it cancels the change
    setChanges(prev => {
      const withoutAdd = prev.filter(c => !(c.kind === 'addFile' && c.path === path));
      // remove any previous update for it
      const withoutUpdates = withoutAdd.filter(c => !(c.kind === 'updateFile' && c.path === path));
      // If it was not added in-session, stage delete
      const originallyAdded = prev.some(c => c.kind === 'addFile' && c.path === path);
      return originallyAdded ? withoutUpdates : [...withoutUpdates, { kind: 'deleteFile', path } as Change];
    });
    if (selectedFile === path) setSelectedFile(null);
  }, [selectedFile, setSelectedFile, setRoot]);

  const deleteFolder = useCallback((path: string) => {
    const rec = (node: TreeNode): TreeNode => {
      if (node.type === 'dir' && node.children) {
        const filtered = node.children.filter(c => c.path !== path).map(rec);
        return { ...node, children: filtered };
      }
      return node;
    };
    setRoot(prev => rec(prev));
    upsertChange({ kind: 'deleteFolder', path });
  }, [setRoot, upsertChange]);

  const moveFile = useCallback((from: string, to: string) => {
    // Update tree
    let name = to.split('/').pop()!;
    const rec = (node: TreeNode): TreeNode => {
      if (node.type === 'dir' && node.children) {
        // remove from
        let kids = node.children.filter(c => c.path !== from).map(rec);
        // add into target parent
        const parent = to.split('/').slice(0, -1).join('/');
        if (node.path === parent) {
          kids = kids.concat([{ type: 'file', name, path: to } as TreeNode]);
          kids.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
        }
        return { ...node, children: kids };
      }
      return node;
    };
    setRoot(prev => rec(prev));

    // Move content if in memory
    const contents = contentsRef.current;
    if (contents.has(from)) {
      const val = contents.get(from)!;
      contents.delete(from);
      contents.set(to, val);
    }

    // Stage move; if it was an addFile, just retarget it
    setChanges(prev => {
      const copy = prev.map(c => 
        (c.kind === 'addFile' && c.path === from ? { ...c, path: to } : 
         c.kind === 'updateFile' && c.path === from ? { ...c, path: to } : c)
      );
      // If file was originally added in-session, we don't need an explicit move
      const added = prev.some(c => c.kind === 'addFile' && c.path === from);
      if (added) return copy;
      return [...copy, { kind: 'moveFile', from, to } as Change];
    });

    if (selectedFile === from) setSelectedFile(to);
  }, [selectedFile, setSelectedFile, setRoot]);

  const clearChanges = useCallback(() => setChanges([]), []);

  return {
    changes,
    contentsRef,
    getFileContent,
    setFileContent,
    addFile,
    addFolder,
    deleteFile,
    deleteFolder,
    moveFile,
    clearChanges,
    setChanges
  };
}