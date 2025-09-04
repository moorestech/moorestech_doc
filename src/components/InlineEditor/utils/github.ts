/**
 * GitHub関連のユーティリティ関数
 */

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
 * GitHub Raw URLを構築
 * @param githubBaseUrl - GitHubリポジトリのベースURL
 * @param filePath - ファイルパス
 * @returns GitHub Raw URL
 */
export function buildGitHubRawUrl(githubBaseUrl: string, filePath: string): string {
  return githubBaseUrl
    .replace('github.com', 'raw.githubusercontent.com')
    .replace('/tree/', '/')
    + '/' + filePath;
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