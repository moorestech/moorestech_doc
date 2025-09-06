import { EditorConfig } from '../../config/editor.config';

/**
 * GitHub APIを使用してファイルの内容を取得
 * @param owner - リポジトリオーナー
 * @param repo - リポジトリ名
 * @param path - ファイルパス
 * @param branch - ブランチ名
 * @param token - GitHubアクセストークン（オプション）
 * @returns ファイルの内容
 */
export async function getFileContentViaApi(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  token: string | null
): Promise<string> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  
  console.log('[getFileContentViaApi] Fetching from URL:', url);
  
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  
  const res = await fetch(url, { headers });
  
  console.log('[getFileContentViaApi] Response status:', res.status);
  
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`ファイルが見つかりません: ${path}`);
    }
    throw new Error(`ファイル取得失敗: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json();
  
  // ファイルの場合、contentフィールドにBase64エンコードされた内容が含まれる
  if (data.type === 'file' && data.content) {
    // Base64デコード
    const content = atob(data.content.replace(/\n/g, ''));
    // UTF-8デコード
    const decoder = new TextDecoder();
    const bytes = new Uint8Array(content.split('').map(c => c.charCodeAt(0)));
    return decoder.decode(bytes);
  }
  
  throw new Error('ファイルの内容を取得できませんでした');
}