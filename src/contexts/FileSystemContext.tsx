import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { useAuthToken } from '../auth/contexts/AuthContext';
import { EditorConfig } from '../config/editor.config';
import {
  determineRepository,
  listDirectory as listDirectoryApi,
} from '../utils/github';
import {
  getRefSha,
  createBranch,
  getFileSha,
  putFile,
  createPullRequest,
  mergePullRequest,
} from '../utils/github/api';
import { deleteFileViaApi } from '../utils/github/deleteFile';
import { buildCustomGitHubRawUrl } from '../utils/github';
import type { Change, TreeNode, Repository } from '../theme/DocSidebar/Desktop/EditableSidebar/types';
import { DOCS_ROOT } from '../theme/DocSidebar/Desktop/EditableSidebar/types';

type FileMap = Map<string, string>;

interface FileSystemContextValue {
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

const FileSystemContext = createContext<FileSystemContextValue | undefined>(undefined);

function createEmptyRoot(): TreeNode {
  return {
    type: 'dir',
    name: DOCS_ROOT,
    path: DOCS_ROOT,
    children: [],
    loaded: false,
  };
}

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthToken();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [branch] = useState<string>(() => EditorConfig.getInstance().getBranch());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [root, setRoot] = useState<TreeNode>(createEmptyRoot);

  // in-memory file contents; if key missing, content not loaded yet
  const contentsRef = useRef<FileMap>(new Map());

  // staged changes
  const [changes, setChanges] = useState<Change[]>([]);

  // selected file for inline editor
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const selectFile = useCallback((path: string | null) => setSelectedFile(path), []);

  // Resolve repo (original or fork based on permissions)
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const cfg = EditorConfig.getInstance();
        const r = await determineRepository(cfg.getOwner(), cfg.getRepo(), token || null);
        if (!mounted) return;
        setRepo(r);
        setRoot(createEmptyRoot());
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'リポジトリの判定に失敗しました');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

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

  // --- change helpers ---
  const upsertChange = useCallback((newChange: Change) => {
    setChanges(prev => {
      // For updateFile/addFile, dedupe by path
      if (newChange.kind === 'updateFile' || newChange.kind === 'addFile') {
        const idx = prev.findIndex(c => (c.kind === newChange.kind || c.kind === 'updateFile' || c.kind === 'addFile') && 'path' in c && (c as any).path === (newChange as any).path);
        if (idx >= 0) {
          const copy = prev.slice();
          copy[idx] = newChange;
          return copy;
        }
      }
      return [...prev, newChange];
    });
  }, []);

  const removeChangeByPath = useCallback((path: string) => {
    setChanges(prev => prev.filter(c => !('path' in c && (c as any).path === path) && !(c.kind === 'moveFile' && (c.from === path || c.to === path))));
  }, []);

  const addFile = useCallback((path: string, content: string = `# ${path.split('/').pop()?.replace(/\.[^/.]+$/, '') || ''}`) => {
    // update tree
    const parentDir = path.split('/').slice(0, -1).join('/');
    const name = path.split('/').pop()!;
    const rec = (node: TreeNode): TreeNode => {
      if (node.path === parentDir) {
        const nextChildren = (node.children || []).concat([{ type: 'file', name, path } as TreeNode]).sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
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
  }, [upsertChange]);

  const addFolder = useCallback((path: string) => {
    const parentDir = path.split('/').slice(0, -1).join('/');
    const name = path.split('/').pop()!;
    const rec = (node: TreeNode): TreeNode => {
      if (node.path === parentDir) {
        const nextChildren = (node.children || []).concat([{ type: 'dir', name, path, children: [], loaded: true } as TreeNode]).sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
        return { ...node, children: nextChildren, loaded: true };
      }
      if (node.type === 'dir' && node.children) {
        return { ...node, children: node.children.map(rec) };
      }
      return node;
    };
    setRoot(prev => rec(prev));
    upsertChange({ kind: 'addFolder', path });
  }, [upsertChange]);

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
  }, [selectedFile]);

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
  }, [upsertChange]);

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
      const copy = prev.map(c => (c.kind === 'addFile' && c.path === from ? { ...c, path: to } : c.kind === 'updateFile' && c.path === from ? { ...c, path: to } : c));
      // If file was originally added in-session, we don't need an explicit move
      const added = prev.some(c => c.kind === 'addFile' && c.path === from);
      if (added) return copy;
      return [...copy, { kind: 'moveFile', from, to } as Change];
    });

    if (selectedFile === from) setSelectedFile(to);
  }, [selectedFile]);

  const getFileContent = useCallback(async (path: string) => {
    const cached = contentsRef.current.get(path);
    if (cached !== undefined) return cached;
    if (!repo) return '';
    // Fetch from GitHub raw
    const raw = buildCustomGitHubRawUrl(repo.owner, repo.repo, branch, path);
    const res = await fetch(raw);
    if (!res.ok) throw new Error(`コンテンツ取得失敗: ${res.statusText}`);
    const text = await res.text();
    contentsRef.current.set(path, text);
    return text;
  }, [repo, branch]);

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

  const clearChanges = useCallback(() => setChanges([]), []);

  // --- save as PR ---
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const saveAllChanges = useCallback(async () => {
    if (!repo) { setError('保存先リポジトリが特定できません'); return; }
    if (!token) { setError('GitHubにログインしてください'); return; }
    if (changes.length === 0) return;
    if (isSaving) return;
    setIsSaving(true);
    setStatus('ブランチ作成の準備中...');
    setResultUrl(null);

    try {
      const cfg = EditorConfig.getInstance();
      const baseBranch = branch;
      const isOriginal = repo.owner === cfg.getOwner() && repo.repo === cfg.getRepo();

      setStatus('ベースブランチの取得中...');
      const baseSha = await getRefSha(repo.owner, repo.repo, baseBranch, token);

      setStatus('作業ブランチを作成しています...');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      let workBranch = `inline-fs/${stamp}`;
      try {
        await createBranch(repo.owner, repo.repo, workBranch, baseSha, token);
      } catch (e: any) {
        if (String(e?.message || '').includes('Reference already exists')) {
          workBranch = `${workBranch}-${Math.random().toString(36).slice(2,6)}`;
          await createBranch(repo.owner, repo.repo, workBranch, baseSha, token);
        } else {
          throw e;
        }
      }

      // Apply each change
      for (const ch of changes) {
        if (ch.kind === 'addFile') {
          setStatus(`追加: ${ch.path}`);
          const existing = await getFileSha(repo.owner, repo.repo, ch.path, workBranch, token).catch(() => null);
          await putFile(repo.owner, repo.repo, ch.path, ch.content ?? '', `docs: add ${ch.path}`, workBranch, token, existing);
        } else if (ch.kind === 'updateFile') {
          setStatus(`更新: ${ch.path}`);
          const sha = await getFileSha(repo.owner, repo.repo, ch.path, workBranch, token).catch(() => null);
          await putFile(repo.owner, repo.repo, ch.path, ch.content ?? '', `docs: update ${ch.path}`, workBranch, token, sha);
        } else if (ch.kind === 'deleteFile') {
          setStatus(`削除: ${ch.path}`);
          const sha = await getFileSha(repo.owner, repo.repo, ch.path, workBranch, token);
          await deleteFileViaApi(repo.owner, repo.repo, ch.path, sha!, `docs: delete ${ch.path}`, workBranch, token);
        } else if (ch.kind === 'moveFile') {
          setStatus(`移動: ${ch.from} → ${ch.to}`);
          // Prefer in-memory content; fall back to fetch
          const hasNew = contentsRef.current.get(ch.to);
          const hasOld = contentsRef.current.get(ch.from);
          const content = hasNew ?? hasOld ?? (await (async () => {
            const rawUrl = buildCustomGitHubRawUrl(repo.owner, repo.repo, workBranch, ch.from);
            const res = await fetch(rawUrl);
            if (!res.ok) throw new Error(`移動元コンテンツの取得に失敗: ${res.statusText}`);
            return await res.text();
          })());
          const newSha = await getFileSha(repo.owner, repo.repo, ch.to, workBranch, token).catch(() => null);
          await putFile(repo.owner, repo.repo, ch.to, content, `docs: move ${ch.from} -> ${ch.to} (add)`, workBranch, token, newSha);
          const oldSha = await getFileSha(repo.owner, repo.repo, ch.from, workBranch, token);
          await deleteFileViaApi(repo.owner, repo.repo, ch.from, oldSha!, `docs: move ${ch.from} -> ${ch.to} (delete)`, workBranch, token);
        } else if (ch.kind === 'addFolder') {
          setStatus(`フォルダ追加: ${ch.path}`);
          const placeholder = `${ch.path.replace(/\/$/, '')}/.gitkeep`;
          const existing = await getFileSha(repo.owner, repo.repo, placeholder, workBranch, token).catch(() => null);
          await putFile(repo.owner, repo.repo, placeholder, '', `docs: add folder ${ch.path}`, workBranch, token, existing);
        } else if (ch.kind === 'deleteFolder') {
          setStatus(`フォルダ削除: ${ch.path}`);
          const placeholder = `${ch.path.replace(/\/$/, '')}/.gitkeep`;
          const sha = await getFileSha(repo.owner, repo.repo, placeholder, workBranch, token).catch(() => null);
          if (sha) {
            await deleteFileViaApi(repo.owner, repo.repo, placeholder, sha, `docs: delete folder ${ch.path}`, workBranch, token);
          }
        }
      }

      setStatus('Pull Requestを作成しています...');
      const prTitle = 'docs: content and structure updates via editor';
      const prBody = `This PR was created automatically by Inline Editor unified FS.\n\nChanges:\n${changes.map((c) => `- ${c.kind} ${'path' in c ? (c as any).path : 'from' in c ? `${(c as any).from} -> ${(c as any).to}` : ''}`).join('\n')}`;

      let pr;
      if (isOriginal) {
        pr = await createPullRequest(repo.owner, repo.repo, prTitle, workBranch, baseBranch, prBody, token);
      } else {
        pr = await createPullRequest(cfg.getOwner(), cfg.getRepo(), prTitle, `${repo.owner}:${workBranch}`, baseBranch, prBody, token);
      }

      // Try auto-merge if original
      if (isOriginal) {
        await mergePullRequest(repo.owner, repo.repo, pr.number, token, 'squash').catch(() => false);
      }
      setStatus('PRを作成しました');
      setResultUrl(pr.html_url);

      // Clear staged changes
      setChanges([]);
    } catch (e: any) {
      console.error(e);
      setStatus(e?.message || '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [repo, token, changes, branch]);

  const value: FileSystemContextValue = useMemo(() => ({
    repo,
    branch,
    loading,
    error,
    root,
    listDirectory,
    loadChildren,
    isDirEmpty,
    selectedFile,
    selectFile,
    getFileContent,
    setFileContent,
    addFile,
    addFolder,
    deleteFile,
    deleteFolder,
    moveFile,
    changes,
    clearChanges,
    isSaving,
    status,
    resultUrl,
    saveAllChanges,
  }), [repo, branch, loading, error, root, listDirectory, loadChildren, isDirEmpty, selectedFile, selectFile, getFileContent, setFileContent, addFile, addFolder, deleteFile, deleteFolder, moveFile, changes, clearChanges, isSaving, status, resultUrl, saveAllChanges]);

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const ctx = useContext(FileSystemContext);
  if (!ctx) throw new Error('useFileSystem must be used within FileSystemProvider');
  return ctx;
}

