/**
 * 低レベルのGitHub APIラッパー関数群
 */

import { EditorConfig } from '../../config/editor.config';
import { toBase64Utf8 } from './utils';

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
 * リポジトリをforkする
 * @param owner - 元のリポジトリのオーナー
 * @param repo - 元のリポジトリ名
 * @param token - GitHubアクセストークン
 * @returns forkされたリポジトリの情報
 */
export async function createFork(
  owner: string,
  repo: string,
  token: string
): Promise<any> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/forks`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Failed to create fork: ${response.status} ${response.statusText}`, errorData);
      
      if (response.status === 401) {
        throw new Error('認証に失敗しました。トークンを確認してください。');
      } else if (response.status === 403) {
        throw new Error('Forkを作成する権限がありません。');
      } else if (response.status === 404) {
        throw new Error('リポジトリが見つかりません。');
      } else if (response.status === 422) {
        throw new Error('既に同じ名前のリポジトリが存在します。');
      }
      
      throw new Error(`Fork作成に失敗しました: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating fork:', error);
    throw error;
  }
}

/**
 * Git refのSHAを取得
 */
export async function getRefSha(owner: string, repo: string, branch: string, token: string): Promise<string> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) {
    const err = new Error(`リファレンスの取得に失敗しました: ${res.status} ${res.statusText}`) as any;
    (err.status = res.status), (err.statusText = res.statusText);
    try { (err.body = await res.text()); } catch {}
    throw err;
  }
  const data = await res.json();
  return data.object?.sha;
}

/**
 * 新しいブランチを作成
 */
export async function createBranch(owner: string, repo: string, newBranch: string, fromSha: string, token: string): Promise<void> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/git/refs`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: fromSha }),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`ブランチ作成に失敗しました: ${res.status} ${res.statusText} ${text}`) as any;
    (err.status = res.status), (err.statusText = res.statusText), (err.body = text);
    throw err;
  }
}

/**
 * ファイルのSHAを取得
 */
export async function getFileSha(owner: string, repo: string, path: string, branch: string, token: string): Promise<string | null> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = new Error(`ファイル情報の取得に失敗しました: ${res.status} ${res.statusText}`) as any;
    (err.status = res.status), (err.statusText = res.statusText);
    try { (err.body = await res.text()); } catch {}
    throw err;
  }
  const data = await res.json();
  return data.sha || null;
}

/**
 * ファイルを保存
 */
export async function putFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  token: string,
  sha?: string | null,
): Promise<{ content: any; commit: any }> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body: any = {
    message,
    content: toBase64Utf8(content),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`ファイル保存に失敗しました: ${res.status} ${res.statusText} ${text}`) as any;
    (err.status = res.status), (err.statusText = res.statusText), (err.body = text);
    throw err;
  }
  return res.json();
}

/**
 * バイナリ（Base64文字列）をそのまま保存
 * すでにBase64化されたコンテンツをGitHub APIへ送る
 */
export async function putFileBase64(
  owner: string,
  repo: string,
  path: string,
  base64Content: string,
  message: string,
  branch: string,
  token: string,
  sha?: string | null,
): Promise<{ content: any; commit: any }> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body: any = {
    message,
    content: base64Content,
    branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`ファイル保存に失敗しました(バイナリ): ${res.status} ${res.statusText} ${text}`) as any;
    (err.status = res.status), (err.statusText = res.statusText), (err.body = text);
    throw err;
  }
  return res.json();
}

/**
 * プルリクエストを作成
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body: string,
  token: string
): Promise<{ number: number; html_url: string }> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/pulls`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, head, base, body }),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`PR作成に失敗しました: ${res.status} ${res.statusText} ${text}`) as any;
    (err.status = res.status), (err.statusText = res.statusText), (err.body = text);
    throw err;
  }
  return res.json();
}

/**
 * プルリクエストをマージ
 */
export async function mergePullRequest(
  owner: string,
  repo: string,
  number: number,
  token: string,
  method: 'merge' | 'squash' | 'rebase' = 'squash'
): Promise<boolean> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/pulls/${number}/merge`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ merge_method: method }),
  });
  if (res.status === 405) return false; // すでにマージ済みなど
  if (!res.ok) return false;
  const data = await res.json();
  return !!data.merged;
}

/**
 * フォークを upstream と同期（デフォルト: upstream のデフォルトブランチ -> 指定ブランチ）
 * GitHub REST API: POST /repos/{owner}/{repo}/merge-upstream
 */
export async function syncForkWithUpstream(
  owner: string,
  repo: string,
  branch: string,
  token: string
): Promise<{ merged: boolean; message?: string }> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/merge-upstream`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ branch }),
  });

  // 204/200: 正常。API 仕様差異を吸収して扱う
  if (res.ok) {
    try {
      const data = await res.json();
      // data = { merged: boolean, message?: string }
      return { merged: !!data.merged, message: data.message };
    } catch {
      // 一部実装では No Content を返すことがある
      return { merged: true };
    }
  }

  // 409: コンフリクト等で同期できないが致命的ではない
  if (res.status === 409) {
    const msg = await res.text().catch(() => '');
    return { merged: false, message: msg || 'Conflict while syncing fork with upstream' };
  }

  const text = await res.text().catch(() => '');
  const err = new Error(`フォーク同期に失敗しました: ${res.status} ${res.statusText} ${text}`) as any;
  (err.status = res.status), (err.statusText = res.statusText), (err.body = text);
  throw err;
}

/**
 * ブランチを削除
 * GitHub REST API: DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}
 */
export async function deleteBranch(
  owner: string,
  repo: string,
  branch: string,
  token: string
): Promise<boolean> {
  const config = EditorConfig.getInstance();
  const url = `${config.getApiBaseUrl()}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`;
  
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    // 204 No Content = 成功
    if (res.status === 204) {
      return true;
    }
    
    // 404 = ブランチが既に存在しない（削除済みとみなす）
    if (res.status === 404) {
      return true;
    }
    
    // 422 = 保護されたブランチなど削除できない
    if (res.status === 422) {
      console.warn(`ブランチ ${branch} は削除できません（保護されている可能性があります）`);
      return false;
    }
    
    console.warn(`ブランチ削除に失敗: ${res.status} ${res.statusText}`);
    return false;
  } catch (err) {
    console.error('ブランチ削除中にエラーが発生:', err);
    return false;
  }
}
