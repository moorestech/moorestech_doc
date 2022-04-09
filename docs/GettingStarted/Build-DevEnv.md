---
sidebar_position: 1
---

# moorestechクライアントの開発環境の整え方

このチュートリアルではどのようにして、Githubからmoorestechのプロジェクトをダウンロードして、unityで開く方法を紹介します。

＊このチュートリアルはWindows搭載のPCを対象にしております。

# 前提の環境

- Windows10 or 11
- [Git for windows](https://gitforwindows.org/)
- [unity(2021.2.17f1)](https://unity3d.com/get-unity/download/archive)
- unityで利用できるIDE

# Githubからリポジトリをクローンする
https://github.com/moorestech/moorestech_client

ダウンロードしたいディレクトリーで以下の以下のコマンドを実行してください。

`git clone https://github.com/moorestech/moorestech_client`

ダウンロードはすぐに終わるはずです。

# submodule updateをする
moorestechではgit submoduleを使用しているため、submodule updateをする必要があります。では、先程ダウンロードしてリポジトリ内で以下のコマンドを実行してください。

`git submodule update --init`

# unityからプロジェクトを開く
unity hubにて、`project -> open右のプルダウン -> add project from disk からリポジトリを指定してください`

# 終わり！
これでこのチュートリアルは終わりです。お疲れ様でした！
