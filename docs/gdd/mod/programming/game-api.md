---
sidebar_position: 2
title: ゲームAPI
---

この機能は現在実装されていません。

ゲームAPIは、moorestechのゲームを改変することができるAPIのことです。
このAPIの提供によって、mod開発者は簡単にmoorestechの要素を改変したり、新たな要素を追加することができます。

APIというと、HTTPを使用するWebAPIのことをのことを指しますが、APIはあくまでアプリケーションを操作するためのインタフェースのことです。
そのため、ここではC#上から直接メソッド呼び出しで呼ぶことができる仕組みのことをAPIと読んでいます。

## 具体的な機能
ゲームAPIを利用することで、ゲーム内の様々な機能を呼び出すことができます。例えば、以下のようなことです。

- ブロックを設置、削除する
- ブロックの中にアイテムを入れる
- キャラクターのインベントリを操作する
- ブロック設置など何らかのイベントの発生を検知する

また、より高度なAPIの提供も計画しています。たとえば、以下のようなものです。

- メソッドの前後に処理を挟むことができる
- リフレクションAPIを提供し、ゲーム内のメソッドや変数を操作することができる
- modからネットワーク通信を行うことができる
