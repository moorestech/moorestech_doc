import { EditorConfig } from '../../config/editor.config';

/**
 * GitHub API経由でファイルを削除
 * @param owner - リポジトリのオーナー名
 * @param repoName - リポジトリ名
 * @param filePath - 削除するファイルのパス
 * @param sha - ファイルのSHA
 * @param message - コミットメッセージ
 * @param branch - ブランチ名
 * @param token - GitHubアクセストークン
 */
export async function deleteFileViaApi(
  owner: string,
  repoName: string,
  filePath: string,
  sha: string,
  message: string,
  branch: string,
  token: string
): Promise<void> {
  const apiBase = EditorConfig.getInstance().getApiBaseUrl();
  const url = `${apiBase}/repos/${owner}/${repoName}/contents/${encodeURIComponent(filePath)}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      Authorization: `token ${token}`,
    },
    body: JSON.stringify({ message, sha, branch }),
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`削除に失敗しました: ${res.status} ${res.statusText} ${text}`);
  }
}