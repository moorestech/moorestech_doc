/**
 * GitHub関連のユーティリティ関数
 */

import { EditorConfig } from '../../../config/editor.config';

/**
 * ドキュメントパスを正規化してファイルパスに変換
 * @param documentPath - Docusaurusのドキュメントパス (e.g., "/docs/intro")
 * @returns 正規化されたファイルパス (e.g., "docs/intro.md")
 */
export function normalizeDocPath(documentPath: string): string {
  // 先頭と末尾のスラッシュを削除
  const cleanPath = documentPath.replace(/^\//, '').replace(/\/$/, '');
  return cleanPath.endsWith('.md') ? cleanPath : `${cleanPath}.md`;
}

/**
 * GitHub Raw URLを構築（デフォルトリポジトリ）
 * @param filePath - ファイルパス
 * @param branch - ブランチ名（オプション）
 * @returns GitHub Raw URL
 */
export function buildGitHubRawUrl(filePath: string, branch?: string): string {
  const config = EditorConfig.getInstance();
  return `${config.getRawContentUrl(branch)}/${filePath}`;
}

/**
 * カスタムリポジトリのGitHub Raw URLを構築
 * @param owner - リポジトリオーナー
 * @param repo - リポジトリ名
 * @param branch - ブランチ名
 * @param filePath - ファイルパス
 * @returns GitHub Raw URL
 */
export function buildCustomGitHubRawUrl(owner: string, repo: string, branch: string, filePath: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

/**
 * GitHubからコンテンツをフェッチ
 * @param rawUrl - GitHub Raw URL
 * @returns フェッチしたテキスト内容、エラー時は空文字列
 */
export async function fetchGitHubContent(rawUrl: string): Promise<string> {
  try {
    const response = await fetch(rawUrl);
    
    if (response.ok) {
      return await response.text();
    }
    
    if (response.status !== 404) {
      console.warn(`Failed to fetch content: ${response.statusText}`);
    }
    
    return '';
  } catch (err) {
    console.error('Error fetching GitHub content:', err);
    return '';
  }
}

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
 * 指定したGitHubリポジトリへの書き込み権限をチェック
 * @param owner - リポジトリのオーナー名
 * @param repo - リポジトリ名
 * @param token - GitHubアクセストークン
 * @returns 書き込み権限がある場合はtrue、ない場合はfalse
 */
export async function checkWritePermissionForRepo(
  owner: string,
  repo: string,
  token: string
): Promise<boolean> {
  const config = EditorConfig.getInstance();
  
  try {
    const response = await fetch(
      config.getCustomRepoApiUrl(owner, repo),
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!response.ok) {
      // リポジトリが見つからない、または認証エラー
      console.warn(`Failed to check repository permissions: ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    
    // permissions フィールドで権限を確認
    // push権限またはadmin権限がある場合は書き込み可能
    if (data.permissions) {
      return data.permissions.push === true || 
             data.permissions.admin === true ||
             data.permissions.maintain === true;
    }
    
    // permissionsフィールドがない場合は書き込み権限なしと判断
    return false;
  } catch (err) {
    console.error('Error checking write permissions:', err);
    return false;
  }
}

/**
 * 現在のユーザー情報を取得
 * @param token - GitHubアクセストークン
 * @returns ユーザー名 または null
 */
export async function getCurrentUsername(token: string): Promise<string | null> {
  const config = EditorConfig.getInstance();
  
  try {
    const response = await fetch(config.getApiUserUrl(), {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch current user: ${response.statusText}`);
      return null;
    }
    
    const user = await response.json();
    return user.login;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return null;
  }
}

/**
 * ユーザーがforkしたリポジトリを検索
 * @param originalOwner - 元のリポジトリのオーナー
 * @param originalRepo - 元のリポジトリ名
 * @param token - GitHubアクセストークン
 * @returns forkリポジトリ情報 {owner, repo} または null
 */
export async function findUserForkRepository(
  originalOwner: string,
  originalRepo: string,
  token: string
): Promise<{ owner: string; repo: string } | null> {
  const config = EditorConfig.getInstance();
  
  try {
    // まず現在のユーザー名を取得
    const username = await getCurrentUsername(token);
    if (!username) {
      console.warn('Could not get current username');
      return null;
    }
    
    // ユーザー名を使って直接forkの存在を確認
    const response = await fetch(
      `${config.getApiBaseUrl()}/repos/${username}/${originalRepo}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!response.ok) {
      // 404の場合はforkが存在しない
      if (response.status === 404) {
        console.log(`No fork found for ${username}/${originalRepo}`);
        return null;
      }
      console.warn(`Failed to check fork repository: ${response.statusText}`);
      return null;
    }
    
    const repo = await response.json();
    
    // forkかつ元のリポジトリが一致するか確認
    if (repo.fork && repo.parent && repo.parent.full_name === `${originalOwner}/${originalRepo}`) {
      console.log(`Found fork repository: ${username}/${repo.name}`);
      return {
        owner: username,
        repo: repo.name
      };
    }
    
    // forkではない、または別のリポジトリのforkだった場合
    console.log(`Repository ${username}/${originalRepo} exists but is not a fork of ${originalOwner}/${originalRepo}`);
    return null;
  } catch (err) {
    console.error('Error searching for fork repository:', err);
    return null;
  }
}

/**
 * 権限に応じて適切なリポジトリを決定
 * @param originalOwner - 元のリポジトリのオーナー
 * @param originalRepo - 元のリポジトリ名
 * @param token - GitHubアクセストークン
 * @returns 使用するリポジトリ情報 {owner, repo}
 */
export async function determineRepository(
  originalOwner: string,
  originalRepo: string,
  token: string | null
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
  
  // 書き込み権限がない場合はforkを探す
  const fork = await findUserForkRepository(originalOwner, originalRepo, token);
  
  if (fork) {
    // forkが見つかった場合はforkを使用
    console.log(`Using fork repository: ${fork.owner}/${fork.repo}`);
    return fork;
  }
  
  // TODO: forkリポジトリを作成する機能は後で実装
  // 現時点では元のリポジトリを読み取り専用で使用
  console.warn('No fork found and no write permission. Using original repository in read-only mode.');
  return { owner: originalOwner, repo: originalRepo };
}