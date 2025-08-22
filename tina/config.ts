import { defineConfig } from "tinacms";

// ブランチ名は環境変数から取得するか、デフォルトで "master" を使用
const branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "master";

export default defineConfig({
  branch,

  // TinaCMS認証情報（環境変数として設定）
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  // ビルド設定
  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },

  // メディア（画像など）の保存設定
  media: {
    tina: {
      mediaRoot: "img",
      publicFolder: "static",
      static: false, // メディアのアップロード・削除を許可
    },
  },

  // コンテンツモデルのスキーマ定義
  schema: {
    collections: [
      {
        name: "doc",
        label: "ドキュメント",
        path: "docs",
        format: "md",
        // サブフォルダも含めて拾う
        match: {
          include: "**/*",
          exclude: "_category_",
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "タイトル",
            isTitle: true,
            required: true,
          },
          {
            type: "number",
            name: "sidebar_position",
            label: "サイドバー位置",
          },
          {
            type: "rich-text",
            name: "body",
            label: "本文",
            isBody: true,
          },
        ],
        // Docusaurusのフォルダ階層に対応
        ui: {
          // ファイルの作成・削除・フォルダ作成を許可
          allowedActions: {
            create: true,
            delete: true,
            createNestedFolder: true,
          },
          router: ({ document }) => {
            if (document._sys.filename === 'intro') {
              return `/docs/intro`;
            }
            return `/docs/${document._sys.breadcrumbs.join('/')}`;
          },
        },
      },
      {
        name: "category",
        label: "カテゴリ設定",
        path: "docs",
        format: "json",
        match: {
          include: "**/_category_",
        },
        fields: [
          {
            type: "string",
            name: "label",
            label: "カテゴリラベル",
            isTitle: true,
            required: true,
          },
          {
            type: "number",
            name: "position",
            label: "表示順",
            description: "数値が小さいほど上に表示されます",
          },
          {
            type: "object",
            name: "link",
            label: "カテゴリリンク",
            fields: [
              {
                type: "string",
                name: "type",
                label: "リンクタイプ",
                options: ["generated-index", "doc"],
              },
              {
                type: "string",
                name: "id",
                label: "ドキュメントID",
                description: "typeがdocの場合、ドキュメントIDを指定",
              },
            ],
          },
          {
            type: "boolean",
            name: "collapsed",
            label: "デフォルトで折りたたむ",
            description: "サイドバーでこのカテゴリをデフォルトで折りたたむかどうか",
          },
        ],
        ui: {
          // カテゴリファイルの作成・削除を許可
          allowedActions: {
            create: true,
            delete: true,
            createNestedFolder: false,
          },
        },
      },
    ],
  },
});