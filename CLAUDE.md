## 【MUST GLOBAL】Gemini活用（プロジェクトのCLAUDE.mdより優先）

### 三位一体の開発原則
ユーザーの**意思決定**、Claudeの**分析と実行**、Geminiの**検証と助言**を組み合わせ、開発の質と速度を最大化する：
- **ユーザー**：プロジェクトの目的・要件・最終ゴールを定義し、最終的な意思決定を行う**意思決定者**
  - 反面、具体的なコーディングや詳細な計画を立てる力、タスク管理能力ははありません。
- **Claude**：高度な計画力・高品質な実装・リファクタリング・ファイル操作・タスク管理を担う**実行者**
  - 指示に対して忠実に、順序立てて実行する能力はありますが、意志がなく、思い込みは勘違いも多く、思考力は少し劣ります。
- **Gemini**：深いコード理解・Web検索 (Google検索) による最新情報へのアクセス・多角的な視点からの助言・技術的検証を行う**助言者**
  - プロジェクトのコードと、インターネット上の膨大な情報を整理し、的確な助言を与えてくれますが、実行力はありません。

### 実践ガイド
- **ユーザーの要求を受けたら即座に`gemini -p <質問内容>`で壁打ち**を必ず実施
- Geminiの意見を鵜呑みにせず、1意見として判断。聞き方を変えて多角的な意見を抽出
- Claude Code内蔵のWebSearchツールは使用しない
- Geminiがエラーの場合は、聞き方を工夫してリトライ：
  - ファイル名や実行コマンドを渡す（Geminiがコマンドを実行可能）
  - 複数回に分割して聞く

### 主要な活用場面
1. **実現不可能な依頼**: Claude Codeでは実現できない要求への対処 (例: `今日の天気は？`)
2. **前提確認**: ユーザー、Claude自身に思い込みや勘違い、過信がないかどうか逐一確認 (例: `この前提は正しいか？`）
3. **技術調査**: 最新情報・エラー解決・ドキュメント検索・調査方法の確認（例: `Rails 7.2の新機能を調べて`）
4. **設計検証**: アーキテクチャ・実装方針の妥当性確認（例: `この設計パターンは適切か？`）
5. **コードレビュー**: 品質・保守性・パフォーマンスの評価（例: `このコードの改善点は？`）
6. **計画立案**: タスクの実行計画レビュー・改善提案（例: `この実装計画の問題点は？`）
7. **技術選定**: ライブラリ・手法の比較検討 （例: `このライブラリは他と比べてどうか？`）

# 気をつけること
XY問題に気をつけてください、目先の問題にとらわれず、根本的な解決を常に行ってください

# 後方互換性についての方針
計画を立案する際、後方互換性は考慮する必要はありません。新しい実装や改善において、より良い設計を追求することを優先してください。

同様に、パフォーマンスの最適化や将来的な拡張性についても、現時点では考慮不要です。まずは動作する実装を優先し、必要に応じて後から改善を行います。

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

moorestechのドキュメントサイト。Docusaurus 3.6.3で構築された静的サイトジェネレーター。Notionから移行中で、高度なインライン編集機能とGitHub統合を備えた次世代ドキュメントプラットフォーム。

## 開発コマンド

### 必須コマンド
```bash
# 開発サーバー起動（http://localhost:3000）
yarn start

# ビルド（静的コンテンツ生成）
yarn build

# ビルド後のローカルプレビュー
yarn serve

# TypeScriptの型チェック
yarn typecheck

# Docusaurusキャッシュクリア（問題発生時）
yarn clear
```

## アーキテクチャ構造

### コア構成
- **Docusaurus 3.6.3**: メインフレームワーク
- **React 18 + TypeScript**: UIコンポーネント
- **GitHub OAuth認証**: Netlify経由のOAuth実装
- **インライン編集システム**: リアルタイムドキュメント編集

### ディレクトリ構造
```
docs/              # メインドキュメント（Markdownファイル）
src/
  auth/            # 認証システム
    contexts/      # AuthContext（メモリベースのトークン管理）
    hooks/         # useGitHubAuth, useNetlifyAuth
  components/      
    InlineEditor/  # インライン編集コンポーネント
      components/  # EditorHeader, EditorContent等
    HomepageFeatures/
  contexts/        # グローバルコンテキスト
    EditStateContext.tsx    # 編集モード状態管理
    FileSystemContext.tsx   # GitHub FS操作の抽象化
  hooks/           # カスタムフック
    useFileManager.ts      # ファイル操作とキャッシュ管理
    useFileTree.ts         # ファイルツリー状態管理
    usePullRequest.ts      # PR作成とマージ処理
    useRepository.ts       # リポジトリ情報管理
  theme/           # Docusaurusテーマカスタマイズ
    DocItem/       # ドキュメントレイアウト
    DocSidebar/    # 編集可能なサイドバー
      Desktop/EditableSidebar/  # DnD対応ファイルツリー
    EditThisPage.tsx  # GitHub直接編集リンク
    Root.tsx       # プロバイダー階層のルート
  utils/           
    github/        # GitHub API操作
      api.ts       # 低レベルAPI関数
      service.ts   # 高レベルサービス層
  config/
    editor.config.ts  # エディタ設定シングルトン
static/
  img/             # 静的画像
```

### 重要な設定ファイル
- `docusaurus.config.ts`: カスタムフィールドでGitHub/CMS URL設定
- `sidebars.ts`: 自動サイドバー生成（最大20階層）
- `tsconfig.json`: TypeScript設定
- `/static/admin/config.yml`: Holocron CMS設定

## 高度な機能実装

### 1. インライン編集システム
**アーキテクチャ**：
- **EditStateContext**: グローバル編集状態管理
- **FileSystemContext**: GitHub FS操作の統一インターフェース
- **InlineEditor**: マークダウン編集UI
- **EditableSidebar**: ドラッグ&ドロップ対応ファイルツリー

**編集フロー**：
1. GitHub OAuth認証（トークンはメモリのみ保存）
2. ファイル取得（GitHub API → キャッシュ）
3. リアルタイム編集（メモリ内で変更追跡）
4. PR作成 → 自動マージ（設定可能）

### 2. 認証システム
**セキュリティ重視設計**：
- トークンはメモリのみ保存（localStorage不使用）
- 認証フラグのみ永続化
- 自動ログイン機能（OAuth再実行）

### 3. GitHub統合
**API操作層**：
- `utils/github/api.ts`: 基本API操作
- `utils/github/service.ts`: ビジネスロジック
- `hooks/usePullRequest.ts`: PR作成・マージ自動化

**ファイル操作**：
- 追加、更新、削除、移動
- バッチ変更管理
- 競合回避（タイムスタンプ付きブランチ）

### 4. コンテキストプロバイダー階層
```tsx
<AuthProvider>          // 認証状態
  <EditStateProvider>   // 編集モード
    <FileSystemProvider> // ファイル操作
      <App />
    </FileSystemProvider>
  </EditStateProvider>
</AuthProvider>
```

## 開発時の注意事項

### ドキュメント追加
- 新カテゴリには`_category_.json`作成必須
- frontmatterでID/タイトル設定
- 画像は`/static/img/`配置、`/img/`で参照

### 編集機能開発
- トークンは必ずメモリ管理
- ファイル操作は`FileSystemContext`経由
- 変更は`Change`型で追跡

### パフォーマンス最適化
- ファイル内容はMap型でキャッシュ
- React.lazyで動的インポート
- 編集モード時のみ重い機能ロード

### エラーハンドリング
- GitHub API失敗時のフォールバック実装
- ユーザーフレンドリーなエラーメッセージ
- 自動リトライ機構（PR作成時）