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