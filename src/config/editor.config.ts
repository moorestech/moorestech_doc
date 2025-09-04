/**
 * エディタとGitHub関連の設定を管理するクラス
 */
export class EditorConfig {
  private static instance: EditorConfig;
  
  // デフォルトのリポジトリ設定
  private readonly defaultOwner = 'moorestech';
  private readonly defaultRepo = 'moorestech_doc';
  private readonly defaultBranch = 'master';
  
  // GitHub APIのベースURL
  private readonly apiBaseUrl = 'https://api.github.com';
  private readonly rawContentBaseUrl = 'https://raw.githubusercontent.com';
  
  private constructor() {}
  
  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): EditorConfig {
    if (!EditorConfig.instance) {
      EditorConfig.instance = new EditorConfig();
    }
    return EditorConfig.instance;
  }
  
  /**
   * リポジトリのオーナー名を取得
   */
  public getOwner(): string {
    return this.defaultOwner;
  }
  
  /**
   * リポジトリ名を取得
   */
  public getRepo(): string {
    return this.defaultRepo;
  }
  
  /**
   * デフォルトブランチ名を取得
   */
  public getBranch(): string {
    return this.defaultBranch;
  }
  
  /**
   * リポジトリのフルパスを取得 (owner/repo形式)
   */
  public getFullRepoPath(): string {
    return `${this.defaultOwner}/${this.defaultRepo}`;
  }
  
  /**
   * GitHubリポジトリのURLを取得
   */
  public getRepoUrl(): string {
    return `https://github.com/${this.getFullRepoPath()}`;
  }
  
  /**
   * GitHub API用のリポジトリURLを取得
   */
  public getApiRepoUrl(): string {
    return `${this.apiBaseUrl}/repos/${this.getFullRepoPath()}`;
  }
  
  /**
   * Raw コンテンツのベースURLを取得
   */
  public getRawContentUrl(branch?: string): string {
    const targetBranch = branch || this.defaultBranch;
    return `${this.rawContentBaseUrl}/${this.getFullRepoPath()}/${targetBranch}`;
  }
  
  /**
   * ファイル編集用のGitHub URLを構築
   */
  public getEditUrl(filePath: string, branch?: string): string {
    const targetBranch = branch || this.defaultBranch;
    return `${this.getRepoUrl()}/edit/${targetBranch}/${filePath}`;
  }
  
  /**
   * ファイル閲覧用のGitHub URLを構築
   */
  public getViewUrl(filePath: string, branch?: string): string {
    const targetBranch = branch || this.defaultBranch;
    return `${this.getRepoUrl()}/blob/${targetBranch}/${filePath}`;
  }
  
  /**
   * GitHub API用のコンテンツURLを構築
   */
  public getApiContentUrl(filePath: string): string {
    return `${this.getApiRepoUrl()}/contents/${filePath}`;
  }
  
  /**
   * カスタムリポジトリ設定を使用する場合のヘルパーメソッド
   * @param owner - リポジトリオーナー
   * @param repo - リポジトリ名
   */
  public getCustomRepoApiUrl(owner: string, repo: string): string {
    return `${this.apiBaseUrl}/repos/${owner}/${repo}`;
  }
  
  /**
   * GitHub API のベースURLを取得
   */
  public getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }
  
  /**
   * GitHub API のユーザーエンドポイントURLを取得
   */
  public getApiUserUrl(): string {
    return `${this.apiBaseUrl}/user`;
  }
  
  /**
   * GitHub API のユーザーリポジトリエンドポイントURLを取得
   */
  public getApiUserReposUrl(): string {
    return `${this.apiBaseUrl}/user/repos`;
  }
}

// デフォルトエクスポート
export default EditorConfig.getInstance();