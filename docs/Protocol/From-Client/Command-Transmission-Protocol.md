---
sidebar_position: 11
---

# Command Transmission Protocol

コマンドを送信するプロトコルです。

## 構造

| Type  | 名前                               | デフォルト値 | 備考 | 
| :---: | :--------------------------------: | :----------: | :--: | 
| short | パケットID                         | 11            |      | 
| short | 文字数                             |              |      | 
| string| コマンド                         |              |      | 