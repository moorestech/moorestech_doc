# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

moorestechのドキュメントサイト。Docusaurus 3.6.3で構築された静的サイトジェネレーター。現在Notionから移行中。

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

### デプロイ
```bash
# GitHub Pagesへのデプロイ（gh-pagesブランチ）
GIT_USER=<username> yarn deploy

# SSHでのデプロイ
USE_SSH=true yarn deploy
```

## アーキテクチャ構造

### コア構成
- **Docusaurus 3.6.3**: メインフレームワーク
- **React 18 + TypeScript**: UIコンポーネント
- **Holocron CMS統合**: `/static/admin/config.yml`でNetlify CMS設定
- **カスタムEditThisPage**: GitHub編集とHolocron CMS編集の両方に対応（`src/theme/EditThisPage.tsx`）

### ディレクトリ構造
```
docs/              # メインドキュメント（Markdownファイル）
  mod-development/ # MOD開発ガイド
  moorestech-dev/  # コア開発ドキュメント
  philosophy/      # プロジェクト理念
src/
  components/      # Reactコンポーネント
  pages/          # 特殊ページ（index.tsx = ホームページ）
  theme/          # Docusaurusテーマのカスタマイズ
static/           # 静的アセット
  admin/          # CMS管理画面
  img/            # 画像ファイル
```

### 重要な設定ファイル
- `docusaurus.config.ts`: メイン設定（URL、ナビゲーション、プラグイン）
- `sidebars.ts`: サイドバー自動生成設定（最大20階層対応）
- `tsconfig.json`: TypeScript設定

### ドキュメント追加時の注意
- 新しいカテゴリには`_category_.json`を作成（ラベルと位置を定義）
- MarkdownファイルにfrontmatterでIDとタイトルを設定
- 画像は`/static/img/`に配置し、`/img/`パスで参照

### CMS編集フロー
1. Holocron CMSエディタ経由で編集
2. GitHubプルリクエストが自動作成
3. マージ後、自動デプロイ

### 特殊な機能
- **デュアル編集システム**: 各ページにGitHub編集とCMS編集の2つのリンク
- **自動サイドバー生成**: フォルダ構造から自動的にサイドバー構築
- **日本語優先**: 現在日本語コンテンツのみ（i18n対応可能な構成）