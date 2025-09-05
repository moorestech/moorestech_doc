/**
 * 高レベルのGitHubサービスロジック
 */

import { EditorConfig } from '../../config/editor.config';
import {
  checkWritePermissionForRepo,
  findUserForkRepository,
  createFork,
  getRefSha,
  createBranch,
  getFileSha,
  putFile,
  createPullRequest,
  mergePullRequest,
} from './api';
import {
  normalizeDocPath,
  sanitizeBranchSegment,
} from './utils';

/**
 * GitHubリポジトリへの書き込み権限をチェック（デフォルトリポジトリ）
 * @param token - GitHubアクセストークン
 * @returns 書き込み権限がある場合はtrue、ない場合はfalse
 */
export async function checkWritePermission(token: string): Promise<boolean> {
  const config = EditorConfig.getInstance();
  return checkWritePermissionForRepo(
    config.getOwner(),
    config.getRepo(),
    token
  );
}

/**
 * Forkが利用可能になるまで待機
 * @param owner - Forkのオーナー
 * @param repo - Forkのリポジトリ名
 * @param token - GitHubアクセストークン
 * @param maxAttempts - 最大試行回数
 * @param delayMs - 各試行間の遅延（ミリ秒）
 * @returns 成功した場合はtrue、タイムアウトの場合はfalse
 */
export async function waitForForkAvailability(
  owner: string,
  repo: string,
  token: string,
  maxAttempts: number = 10,
  delayMs: number = 3000
): Promise<boolean> {
  const config = EditorConfig.getInstance();
  
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    try {
      const response = await fetch(
        `${config.getApiBaseUrl()}/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (response.ok) {
        console.log(`Fork is ready: ${owner}/${repo}`);
        return true;
      }
    } catch (err) {
      // エラーは無視してリトライ
    }
  }
  
  console.warn(`Fork availability check timed out for ${owner}/${repo}`);
  return false;
}

/**
 * 既存のForkを取得するか、新しく作成する
 * @param originalOwner - 元のリポジトリのオーナー
 * @param originalRepo - 元のリポジトリ名
 * @param token - GitHubアクセストークン
 * @param onProgress - 進捗コールバック
 * @returns Forkリポジトリ情報、作成できない場合はnull
 */
export async function getOrCreateFork(
  originalOwner: string,
  originalRepo: string,
  token: string,
  onProgress?: (message: string) => void
): Promise<{ owner: string; repo: string } | null> {
  // 1. 既存のForkを探す
  onProgress?.('既存のForkを確認しています...');
  const existingFork = await findUserForkRepository(originalOwner, originalRepo, token);
  
  if (existingFork) {
    console.log(`Using existing fork: ${existingFork.owner}/${existingFork.repo}`);
    onProgress?.('既存のForkが見つかりました');
    return existingFork;
  }
  
  // 2. Forkを作成する
  onProgress?.('Forkを作成しています...');
  console.log(`Creating fork of ${originalOwner}/${originalRepo}...`);
  
  try {
    const forkData = await createFork(originalOwner, originalRepo, token);
    const forkOwner = forkData.owner.login;
    const forkRepo = forkData.name;
    
    // 3. Forkが利用可能になるまで待機
    onProgress?.('Forkの準備をしています...');
    const isReady = await waitForForkAvailability(forkOwner, forkRepo, token);
    
    if (isReady) {
      console.log(`Fork created and ready: ${forkOwner}/${forkRepo}`);
      onProgress?.('Forkの準備が完了しました');
      return { owner: forkOwner, repo: forkRepo };
    } else {
      throw new Error('Forkの作成がタイムアウトしました。時間をおいて再度お試しください。');
    }
  } catch (error) {
    console.error('Failed to create or verify fork:', error);
    onProgress?.(`エラー: ${error.message}`);
    throw error;
  }
}

/**
 * 権限に応じて適切なリポジトリを決定
 * @param originalOwner - 元のリポジトリのオーナー
 * @param originalRepo - 元のリポジトリ名
 * @param token - GitHubアクセストークン
 * @param onProgress - 進捗コールバック
 * @returns 使用するリポジトリ情報 {owner, repo}
 */
export async function determineRepository(
  originalOwner: string,
  originalRepo: string,
  token: string | null,
  onProgress?: (message: string) => void
): Promise<{ owner: string; repo: string }> {
  // トークンがない場合は元のリポジトリを使用（読み取り専用）
  if (!token) {
    return { owner: originalOwner, repo: originalRepo };
  }
  
  // 書き込み権限をチェック
  const hasWritePermission = await checkWritePermissionForRepo(
    originalOwner,
    originalRepo,
    token
  );
  
  if (hasWritePermission) {
    // 書き込み権限がある場合は元のリポジトリを使用
    console.log(`Using original repository: ${originalOwner}/${originalRepo}`);
    return { owner: originalOwner, repo: originalRepo };
  }
  
  // 書き込み権限がない場合はForkを取得または作成
  try {
    const fork = await getOrCreateFork(originalOwner, originalRepo, token, onProgress);
    if (fork) {
      return fork;
    }
  } catch (error) {
    console.error('Failed to get or create fork:', error);
    // エラーが発生した場合は元のリポジトリを読み取り専用で使用
  }
  
  // フォールバック: 元のリポジトリを読み取り専用で使用
  console.warn('Using original repository in read-only mode.');
  return { owner: originalOwner, repo: originalRepo };
}

/**
 * ドキュメントの変更を対象リポジトリに保存し、PRを作成。書き込み権限があれば自動マージ。
 */
export async function saveChangesAndOpenPR(params: {
  documentPath: string;
  content: string;
  token: string;
  targetOwner: string;
  targetRepo: string;
  onProgress?: (message: string) => void;
}): Promise<{ prUrl: string; merged: boolean }>
{
  const { documentPath, content, token, targetOwner, targetRepo, onProgress } = params;
  const config = EditorConfig.getInstance();
  const filePath = normalizeDocPath(documentPath);
  const baseBranch = config.getBranch();
  const isOriginal = targetOwner === config.getOwner() && targetRepo === config.getRepo();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const pathSegment = sanitizeBranchSegment(filePath.replace(/\//g, '-'));
  let newBranch = sanitizeBranchSegment(`inline-edit/${pathSegment}/${stamp}`);

  onProgress?.('ベースブランチの取得中...');
  let baseSha: string;
  try {
    baseSha = await getRefSha(targetOwner, targetRepo, baseBranch, token);
  } catch (e) {
    throw new Error(`ベースブランチ(${baseBranch})の取得に失敗しました。フォークが最新か確認してください。`);
  }

  onProgress?.('作業ブランチを作成しています...');
  try {
    await createBranch(targetOwner, targetRepo, newBranch, baseSha, token);
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.includes('Reference already exists')) {
      newBranch = `${newBranch}-${Math.random().toString(36).slice(2, 6)}`;
      await createBranch(targetOwner, targetRepo, newBranch, baseSha, token);
    } else {
      throw e;
    }
  }

  onProgress?.('ファイルを保存しています...');
  const sha = await getFileSha(targetOwner, targetRepo, filePath, newBranch, token).catch(() => null);
  const message = `docs: update ${filePath} via InlineEditor`;
  await putFile(targetOwner, targetRepo, filePath, content, message, newBranch, token, sha);

  const prTitle = `docs: update ${filePath}`;
  const prBody = `This PR was created automatically by InlineEditor.\n\n- Target: ${targetOwner}/${targetRepo}\n- Branch: ${newBranch}`;

  onProgress?.('Pull Requestを作成しています...');
  let pr;
  if (isOriginal) {
    pr = await createPullRequest(targetOwner, targetRepo, prTitle, newBranch, baseBranch, prBody, token);
  } else {
    // フォークリポジトリからオリジナルへPR
    pr = await createPullRequest(
      config.getOwner(),
      config.getRepo(),
      prTitle,
      `${targetOwner}:${newBranch}`,
      baseBranch,
      prBody,
      token,
    );
  }

  let merged = false;
  if (isOriginal) {
    const canMerge = await checkWritePermissionForRepo(targetOwner, targetRepo, token);
    if (canMerge) {
      onProgress?.('PRを自動マージしています...');
      merged = await mergePullRequest(targetOwner, targetRepo, pr.number, token, 'squash');
    }
  }

  return { prUrl: pr.html_url, merged };
}