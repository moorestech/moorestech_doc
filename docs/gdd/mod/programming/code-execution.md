---
sidebar_position: 1
title: コードの実行機能
---

この機能は現在実装されていません。

## 将来的な計画

コードの実行機能は、ゲーム内でプログラムファイルを実行する機能です。コードを実行することができれば、mod開発の自由度を飛躍的に向上できます。

## 実行する言語

言語はC#を採用することとしました。

理由としては以下の通りです。

- moorestech自体がC#で開発されており、親和性が高いこと
- 比較的習得難易度が低く、一般に使われている言語であること
- 言語機能が充実しており、小規模な開発から大規模な開発まで対応できること
- ライブラリが充実しており、コード資産を活用できること

などがあります。

C#を動的に実行する必要があるため、Microsoftが提供している「Roslyn」というライブラリを利用する予定です。

