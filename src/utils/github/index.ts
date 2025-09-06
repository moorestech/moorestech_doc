/**
 * GitHub関連ユーティリティのエクスポート
 */

// サービス層の関数（外部から主に使用）
export {
  checkWritePermission,
  waitForForkAvailability,
  getOrCreateFork,
  determineRepository,
  saveChangesAndOpenPR,
} from './service';

// ユーティリティ関数
export {
  normalizeDocPath,
  buildGitHubRawUrl,
  buildCustomGitHubRawUrl,
  toBase64Utf8,
  sanitizeBranchSegment,
} from './utils';

// API層の関数（必要に応じて外部から使用）
export {
  fetchGitHubContent,
  checkWritePermissionForRepo,
  getCurrentUsername,
  findUserForkRepository,
  createFork,
  getRefSha,
  createBranch,
  getFileSha,
  putFile,
  createPullRequest,
  mergePullRequest,
  syncForkWithUpstream,
} from './api';

// ディレクトリ操作
export { listDirectory } from './listDirectory';
export type { GitHubItem } from './listDirectory';

// ファイル削除
export { deleteFileViaApi } from './deleteFile';
