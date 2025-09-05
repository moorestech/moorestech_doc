import { EditorConfig } from '../../config/editor.config';

export interface GitHubItem {
  type: 'dir' | 'file';
  name: string;
  path: string;
  sha: string;
}

/**
 * GitHubのcontents APIを使用してディレクトリの内容を取得
 * @param owner - リポジトリのオーナー名
 * @param repoName - リポジトリ名
 * @param dirPath - ディレクトリパス
 * @param branch - ブランチ名
 * @param token - GitHubアクセストークン（オプショナル）
 * @returns ディレクトリ内のアイテムの配列
 */
export async function listDirectory(
  owner: string,
  repoName: string,
  dirPath: string,
  branch: string,
  token?: string | null
): Promise<GitHubItem[]> {
  const apiBase = EditorConfig.getInstance().getApiBaseUrl();
  const url = `${apiBase}/repos/${owner}/${repoName}/contents/${encodeURIComponent(dirPath)}?ref=${encodeURIComponent(branch)}`;
  
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      ...(token ? { Authorization: `token ${token}` } : {}),
    },
  });
  
  if (!res.ok) {
    throw new Error(`ディレクトリ取得に失敗しました: ${res.status} ${res.statusText}`);
  }
  
  const data: any[] = await res.json();
  
  return data
    .filter((item) => item.type === 'dir' || item.type === 'file')
    .map<GitHubItem>((item) => ({
      type: item.type,
      name: item.name,
      path: item.path,
      sha: item.sha,
    }))
    // ディレクトリを先に、その後ファイル、それぞれアルファベット順
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
}