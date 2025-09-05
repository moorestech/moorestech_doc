import { useCallback, useRef } from 'react';
import { EditorConfig } from '../../../../../config/editor.config';
import { useAuthToken } from '../../../../../auth/contexts/AuthContext';
import {
  getRefSha,
  createBranch,
  getFileSha,
  putFile,
  createPullRequest,
  mergePullRequest,
  buildCustomGitHubRawUrl,
} from '../../../../../components/InlineEditor/utils/github';
import { Change, TreeNode, Repository, DOCS_ROOT } from '../types';

interface UsePullRequestReturn {
  applyChanges: (
    repo: Repository,
    changes: Change[],
    branch: string,
    listDirectory: (owner: string, repoName: string, dirPath: string) => Promise<TreeNode[]>,
    deleteFileViaApi: (owner: string, repoName: string, filePath: string, sha: string, message: string, onBranch: string) => Promise<void>,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => Promise<void>;
  deleteFileViaApi: (owner: string, repoName: string, filePath: string, sha: string, message: string, onBranch: string) => Promise<void>;
}

export const usePullRequest = (): UsePullRequestReturn => {
  const token = useAuthToken();
  const applyingRef = useRef(false);

  const deleteFileViaApi = useCallback(async (owner: string, repoName: string, filePath: string, sha: string, message: string, onBranch: string) => {
    const apiBase = EditorConfig.getInstance().getApiBaseUrl();
    const url = `${apiBase}/repos/${owner}/${repoName}/contents/${encodeURIComponent(filePath)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
      body: JSON.stringify({ message, sha, branch: onBranch }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`削除に失敗しました: ${res.status} ${res.statusText} ${text}`);
    }
  }, [token]);

  const applyChanges = useCallback(async (
    repo: Repository,
    changes: Change[],
    branch: string,
    listDirectory: (owner: string, repoName: string, dirPath: string) => Promise<TreeNode[]>,
    deleteFileViaApi: (owner: string, repoName: string, filePath: string, sha: string, message: string, onBranch: string) => Promise<void>,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    if (!repo) { onError('保存先リポジトリが特定できません'); return; }
    if (!token) { onError('GitHubにログインしてください'); return; }
    if (changes.length === 0) return;
    if (applyingRef.current) return;
    applyingRef.current = true;

    try {
      const cfg = EditorConfig.getInstance();
      const baseBranch = branch;
      const isOriginal = repo.owner === cfg.getOwner() && repo.repo === cfg.getRepo();

      // Prepare work branch
      const baseSha = await getRefSha(repo.owner, repo.repo, baseBranch, token);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      let workBranch = `sidebar-fs/${stamp}`;
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

      // Execute each change sequentially
      for (const ch of changes) {
        if (ch.kind === 'addFile') {
          const message = `docs: add ${ch.path} via EditableSidebar`;
          const sha = await getFileSha(repo.owner, repo.repo, ch.path, workBranch, token).catch(() => null);
          await putFile(repo.owner, repo.repo, ch.path, ch.content ?? '', message, workBranch, token, sha);
        } else if (ch.kind === 'deleteFile') {
          const sha = await getFileSha(repo.owner, repo.repo, ch.path, workBranch, token);
          if (!sha) throw new Error(`${ch.path} のSHAが取得できませんでした`);
          await deleteFileViaApi(repo.owner, repo.repo, ch.path, sha, `docs: delete ${ch.path} via EditableSidebar`, workBranch);
        } else if (ch.kind === 'moveFile') {
          // Fetch old content
          const rawUrl = buildCustomGitHubRawUrl(repo.owner, repo.repo, workBranch, ch.from);
          const contentRes = await fetch(rawUrl);
          if (!contentRes.ok) throw new Error(`移動元コンテンツの取得に失敗: ${contentRes.statusText}`);
          const content = await contentRes.text();
          // Put new
          const putMsg = `docs: move ${ch.from} -> ${ch.to} (add)`;
          const existingNewSha = await getFileSha(repo.owner, repo.repo, ch.to, workBranch, token).catch(() => null);
          await putFile(repo.owner, repo.repo, ch.to, content, putMsg, workBranch, token, existingNewSha);
          // Delete old
          const oldSha = await getFileSha(repo.owner, repo.repo, ch.from, workBranch, token);
          await deleteFileViaApi(repo.owner, repo.repo, ch.from, oldSha!, `docs: move ${ch.from} -> ${ch.to} (delete)`, workBranch);
        } else if (ch.kind === 'addFolder') {
          const placeholder = `${ch.path.replace(/\/$/, '')}/.gitkeep`;
          const msg = `docs: add folder ${ch.path}`;
          const existingSha = await getFileSha(repo.owner, repo.repo, placeholder, workBranch, token).catch(() => null);
          await putFile(repo.owner, repo.repo, placeholder, '', msg, workBranch, token, existingSha);
        } else if (ch.kind === 'deleteFolder') {
          // Delete folder by deleting its .gitkeep if exists (empty folder only)
          const placeholder = `${ch.path.replace(/\/$/, '')}/.gitkeep`;
          const sha = await getFileSha(repo.owner, repo.repo, placeholder, workBranch, token).catch(() => null);
          if (sha) {
            await deleteFileViaApi(repo.owner, repo.repo, placeholder, sha, `docs: delete folder ${ch.path}`, workBranch);
          }
        }
      }

      // Open PR
      const prTitle = 'docs: sidebar structure changes';
      const prBody = `This PR was created automatically by EditableSidebar.\n\nChanges:\n${changes.map((c) => `- ${c.kind} ${'path' in c ? c.path : 'from' in c ? `${c.from} -> ${c.to}` : ''}`).join('\n')}`;
      let pr;
      if (isOriginal) {
        pr = await createPullRequest(repo.owner, repo.repo, prTitle, workBranch, baseBranch, prBody, token);
      } else {
        pr = await createPullRequest(EditorConfig.getInstance().getOwner(), EditorConfig.getInstance().getRepo(), prTitle, `${repo.owner}:${workBranch}`, baseBranch, prBody, token);
      }
      // Try auto-merge if original and permissions allow
      if (isOriginal) {
        await mergePullRequest(repo.owner, repo.repo, pr.number, token, 'squash').catch(() => false);
      }

      // Reload tree after success
      await listDirectory(repo.owner, repo.repo, DOCS_ROOT);
      window.alert('変更をPRとして提出しました。GitHubでご確認ください。');
      onSuccess();
    } catch (e: any) {
      console.error(e);
      onError(e?.message || '変更の適用に失敗しました');
    } finally {
      applyingRef.current = false;
    }
  }, [token, deleteFileViaApi]);

  return {
    applyChanges,
    deleteFileViaApi,
  };
};