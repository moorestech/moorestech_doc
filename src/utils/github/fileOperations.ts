import { 
  fetchGitHubContent, 
  putFile, 
  getRefSha,
  getFileSha,
  createBranch,
  createPullRequest as createPRApi,
  deleteFileViaApi
} from './index';
import { buildCustomGitHubRawUrl } from './utils';
import { EditorConfig } from '../../config/editor.config';

/**
 * GitHubからファイルコンテンツを取得
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  token: string | null
): Promise<string> {
  const rawUrl = buildCustomGitHubRawUrl(owner, repo, branch, path);
  const content = await fetchGitHubContent(rawUrl);
  
  if (!content) {
    throw new Error('Failed to fetch file content');
  }
  
  return content;
}

/**
 * 複数のファイル変更からPull Requestを作成
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  baseBranch: string,
  title: string,
  description: string,
  changes: Array<{
    path: string;
    content?: string;
    deleted?: boolean;
  }>,
  token: string
): Promise<string> {
  // 新しいブランチ名を生成
  const timestamp = Date.now();
  const branchName = `update-docs-${timestamp}`;
  
  try {
    // ベースブランチのSHAを取得
    const baseSha = await getRefSha(owner, repo, baseBranch, token);
    
    // 新しいブランチを作成
    await createBranch(owner, repo, branchName, baseSha, token);
    
    // 各変更をコミット
    for (const change of changes) {
      if (change.deleted) {
        // ファイル削除
        const sha = await getFileSha(owner, repo, change.path, branchName, token);
        if (sha) {
          await deleteFileViaApi(
            owner,
            repo,
            change.path,
            sha,
            `Delete ${change.path}`,
            branchName,
            token
          );
        }
      } else if (change.content !== undefined) {
        // ファイル作成/更新
        // 既存ファイルの場合はSHAを取得
        const sha = await getFileSha(owner, repo, change.path, branchName, token);
        await putFile(
          owner,
          repo,
          change.path,
          change.content,
          `Update ${change.path}`,
          branchName,
          token,
          sha
        );
      }
    }
    
    // Pull Request作成
    const pr = await createPRApi(
      owner,
      repo,
      title,
      description || `This PR updates the following files:\n${changes.map(c => `- ${c.path}${c.deleted ? ' (deleted)' : ''}`).join('\n')}`,
      branchName,
      baseBranch,
      token
    );
    
    return pr.html_url;
  } catch (error) {
    console.error('Failed to create pull request:', error);
    throw error;
  }
}