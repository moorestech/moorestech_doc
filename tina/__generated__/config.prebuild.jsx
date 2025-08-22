// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "master";
var config_default = defineConfig({
  branch,
  // TinaCMS認証情報（環境変数として設定）
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  // ビルド設定
  build: {
    outputFolder: "admin",
    publicFolder: "static"
  },
  // メディア（画像など）の保存設定
  media: {
    tina: {
      mediaRoot: "img",
      publicFolder: "static",
      static: false
      // メディアのアップロード・削除を許可
    }
  },
  // コンテンツモデルのスキーマ定義
  schema: {
    collections: [
      {
        name: "doc",
        label: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8",
        path: "docs",
        format: "md",
        // サブフォルダも含めて拾う
        match: {
          include: "**/*",
          exclude: "_category_"
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "\u30BF\u30A4\u30C8\u30EB",
            isTitle: true,
            required: true
          },
          {
            type: "number",
            name: "sidebar_position",
            label: "\u30B5\u30A4\u30C9\u30D0\u30FC\u4F4D\u7F6E"
          },
          {
            type: "rich-text",
            name: "body",
            label: "\u672C\u6587",
            isBody: true
          }
        ],
        // Docusaurusのフォルダ階層に対応
        ui: {
          // ファイルの作成・削除・フォルダ作成を許可
          allowedActions: {
            create: true,
            delete: true,
            createNestedFolder: true
          },
          router: ({ document }) => {
            if (document._sys.filename === "intro") {
              return `/docs/intro`;
            }
            return `/docs/${document._sys.breadcrumbs.join("/")}`;
          }
        }
      },
      {
        name: "category",
        label: "\u30AB\u30C6\u30B4\u30EA\u8A2D\u5B9A",
        path: "docs",
        format: "json",
        match: {
          include: "**/_category_"
        },
        fields: [
          {
            type: "string",
            name: "label",
            label: "\u30AB\u30C6\u30B4\u30EA\u30E9\u30D9\u30EB",
            isTitle: true,
            required: true
          },
          {
            type: "number",
            name: "position",
            label: "\u8868\u793A\u9806",
            description: "\u6570\u5024\u304C\u5C0F\u3055\u3044\u307B\u3069\u4E0A\u306B\u8868\u793A\u3055\u308C\u307E\u3059"
          },
          {
            type: "object",
            name: "link",
            label: "\u30AB\u30C6\u30B4\u30EA\u30EA\u30F3\u30AF",
            fields: [
              {
                type: "string",
                name: "type",
                label: "\u30EA\u30F3\u30AF\u30BF\u30A4\u30D7",
                options: ["generated-index", "doc"]
              },
              {
                type: "string",
                name: "id",
                label: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8ID",
                description: "type\u304Cdoc\u306E\u5834\u5408\u3001\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8ID\u3092\u6307\u5B9A"
              }
            ]
          },
          {
            type: "boolean",
            name: "collapsed",
            label: "\u30C7\u30D5\u30A9\u30EB\u30C8\u3067\u6298\u308A\u305F\u305F\u3080",
            description: "\u30B5\u30A4\u30C9\u30D0\u30FC\u3067\u3053\u306E\u30AB\u30C6\u30B4\u30EA\u3092\u30C7\u30D5\u30A9\u30EB\u30C8\u3067\u6298\u308A\u305F\u305F\u3080\u304B\u3069\u3046\u304B"
          }
        ],
        ui: {
          // カテゴリファイルの作成・削除を許可
          allowedActions: {
            create: true,
            delete: true,
            createNestedFolder: false
          }
        }
      }
    ]
  }
});
export {
  config_default as default
};
