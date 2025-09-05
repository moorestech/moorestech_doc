/**
 * GitHub関連のユーティリティ関数
 */

import { EditorConfig } from '../../../../config/editor.config';

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
 * 文字列をUTF-8 Base64にエンコード
 */
export function toBase64Utf8(input: string): string {
  // btoaはUTF-8非対応のため、UTF-8へ変換してからエンコード
  // eslint-disable-next-line no-undef
  if (typeof window !== 'undefined' && (window as any).btoa) {
    return (window as any).btoa(unescape(encodeURIComponent(input)));
  }
  // Node/SSR環境のフォールバック
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Buffer } = require('buffer');
  return Buffer.from(input, 'utf-8').toString('base64');
}

/**
 * ブランチ名のセグメントをサニタイズ
 */
export function sanitizeBranchSegment(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\-\/_.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}