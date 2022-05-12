---
sidebar_position: 2
---

# Protocol List

ここでは、moorestechで使用されているプロトコルの一覧と、その応答について書きます。

## クライアント側から送信するパケット
全ての通信の起点はクライアント側が送るパケットです。
クライアントからのパケットを受け取ったサーバーはそれに対応したパケットを返答します。

|  ID  |  パケット名  |  サーバーレスポンス  |
| ---- | ---- | ---- |
|  0  |  無し  |  無し  |
|  1  |  [ブロック設置プロトコル](./From-Client/Block-Place-Protocol)  |  無し  |
|  2  |  [プレイヤー現在位置送信](./From-Client/Player-Position-Protocol)  |  [チャンクデータプロトコル](./From-Server/Chunk-Data-Protocol)  |
|  3  |  [プレイヤーインベントリ要求プロトコル](./From-Client/Player-Inventory-Protocol)  | [プレイヤーインベントリ応答プロトコル](./From-Server/Playerinventory-Response-Protocol) |
|  4  |  [イベント要求プロトコル](./From-Client/Event-Request-Protocol)  |  [イベント返答プロトコル](./From-Server/Event-Response-Protocol)  |
|  5  |  [インベントリアイテム移動プロトコル](./From-Client/Inventoryitem-Movement-Protocol)  |  無し  |
|  6  |  無し  |  無し  |
|  7  |  無し  |  無し  |
|  8  |  [ホットバーブロックの設置プロトコル](./From-Client/Hotbarblock-Place-Protocol)  |  無し  |
|  9  |  [ブロックインベントリ要求プロトコル](./From-Client/Blockinventory-Request-Protocol) |  [ブロックインベントリ応答プロトコル（要修正）](./From-Server/Blockinventory-Response-Protocol)  |
|  10  |  [ブロック削除プロトコル](./From-Client/Block-Deletion-Protocol)  |  無し  |
|  11  |  [コマンド送信プロトコル](./From-Client/Command-Transmission-Protocol)  |  無し  |
|  12  |  無し  |  無し  |
|  13  |  無し  |  無し  |
|  14  |  [クラフト実行プロトコル](./From-Client/Craft-Execution-Protocol)  |  無し  |
|  15  |  [採掘実行プロトコル](./From-Client/Mining-Execution-Protocol)  |  無し  |
|  16  |  [ブロックインベントリ開閉プロトコル](./From-Client/Blockinventory-Open-Shut-Protocol)  |  無し  |
|  17  |  [セーブ実行プロトコル](./From-Client/Save-Execution-Protocol)  |  無し  |

## サーバー側から送信するパケット
クライアントからのリクエストに対してレスポンスするパケットです。  

|  ID  |  パケット名  |
| ---- | ---- |
|  0  |  無し  |
|  1  |  無し  |
|  2  |  [チャンクデータプロトコル](./From-Server/Chunk-Data-Protocol)  |
|  3  |  [プレイヤーインベントリ応答プロトコル](./From-Server/Playerinventory-Response-Protocol)  |
|  4  |  [イベント応答プロトコル](./From-Server/Event-Response-Protocol)  |
|  5  |  無し  |
|  6  |  無し  |
|  7  |  無し  |
|  8  |  無し  |
|  9  |  [ブロックインベントリ応答プロトコル（要修正）](./From-Server/Blockinventory-Response-Protocol)  |
|  10  |  無し  |
|  11  |  無し  |
|  12  |  無し  |
|  13  |  無し  |
|  14  |  無し  |
|  15  |  無し  |
|  16  |  無し  |
|  17  |  無し  |

