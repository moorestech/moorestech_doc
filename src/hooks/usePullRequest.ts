import { useState, useCallback, MutableRefObject } from 'react';
import { EditorConfig } from '../config/editor.config';
import { buildCustomGitHubRawUrl } from '../utils/github';
import {
  getRefSha,
  createBranch,
  getFileSha,
  putFile,
  putFileBase64,
  createPullRequest,
  mergePullRequest,
} from '../utils/github/api';
import { deleteFileViaApi } from '../utils/github/deleteFile';
import type { Repository, Change } from '../theme/DocSidebar/Desktop/EditableSidebar/types';
import type { FileMap } from './types';

interface UsePullRequestProps {
  repo: Repository | null;
  branch: string;
  token: string | null;
  changes: Change[];
  contentsRef: MutableRefObject<FileMap>;
  setChanges: React.Dispatch<React.SetStateAction<Change[]>>;
}

export function usePullRequest({
  repo,
  branch,
  token,
  changes,
  contentsRef,
  setChanges
}: UsePullRequestProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const saveAllChanges = useCallback(async () => {
    if (!repo) {
      setStatus('保存先リポジトリが特定できません');
      return;
    }
    if (!token) {
      setStatus('GitHubにログインしてください');
      return;
    }
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
          if (ch.encoding === 'base64') {
            await putFileBase64(repo.owner, repo.repo, ch.path, ch.content ?? '', `docs: add ${ch.path}`, workBranch, token, existing);
          } else {
            await putFile(repo.owner, repo.repo, ch.path, ch.content ?? '', `docs: add ${ch.path}`, workBranch, token, existing);
          }
        } else if (ch.kind === 'updateFile') {
          setStatus(`更新: ${ch.path}`);
          const sha = await getFileSha(repo.owner, repo.repo, ch.path, workBranch, token).catch(() => null);
          if (ch.encoding === 'base64') {
            await putFileBase64(repo.owner, repo.repo, ch.path, ch.content ?? '', `docs: update ${ch.path}`, workBranch, token, sha);
          } else {
            await putFile(repo.owner, repo.repo, ch.path, ch.content ?? '', `docs: update ${ch.path}`, workBranch, token, sha);
          }
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
      const prBody = `This PR was created automatically by Inline Editor unified FS.\n\nChanges:\n${
        changes.map((c) => `- ${c.kind} ${
          'path' in c ? (c as any).path : 
          'from' in c ? `${(c as any).from} -> ${(c as any).to}` : ''
        }`).join('\n')
      }`;

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
  }, [repo, token, changes, branch, contentsRef, setChanges]);

  return {
    isSaving,
    status,
    resultUrl,
    saveAllChanges
  };
}
