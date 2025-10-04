---
sidebar_position: 10
title: 環境構築
---


# 前提

この環境構築手順は2つのプライベートリポジトリへのアクセス権限を持っていることが前提です。この手順でmoorestechの完全版を実行することができます。

# リポジトリ構成

### 使用するリポジトリ

moorestechの実行には3つのリポジトリを用いています。

[moorestech](https://github.com/moorestech/moorestech) : コード、アセットが入っているメインリポジトリ

[moorestech-client-private](https://github.com/moorestech/moorestech-client-private) : クライアント側で使用する有料アセット等を格納するリポジトリ

[moorestech_master](https://github.com/moorestech/moorestech_master) : マスターデータ、一部のアセットを格納するリポジトリ

### ディレクトリ構造

```
./[任意のディレクトリ名]
  L * moorestech *
    L moorestech_client
      L Assets
        L PersonalAssets
          L * moorestech-client-private *
  L * moorestech_master *
```

# 構築手順

### 1. プロジェクトを置きたい場所に任意のディレクトリを作る

moorestechとmoorestech_masterは同じディレクトリ配下におく必要があるため、一つのディレクトリにまとめておくことを推奨します。
この手順は必須ではありません。

### 2. 自分がプロジェクト置きたいディレクトリでcloneする。

moorestechとmoorestech_masterを上記ディレクトリや自分で決めたディレクトリにcloneしてください。

### 3. PersonalAssetsディレクトリを作成する。

cloneしたmoorestechリポジトリの中にある、moorestech_client/Assetsディレクトリに移動し、そこに `PersonalAssets` というディレクトリを作成してください。
これは個人用の有料アセット（Console Pro）等を格納しておくディレクトリです。

### 4. moorestech-client-privateをcloneする。

先程作成したPersonalAssetsディレクトリに移動し、moorestech-client-privateをcloneする。

### 5. Unityで開く。

moorestech/moorestech_clinet をUnityで開く。バージョンはUnity Hubに表示されているものを入れてください。

### 6. MainGameシーンで再生する。

Projectビューから「MainGame」と検索し、開き、再生する。
正しくゲームがプレイできれば環境構築完了