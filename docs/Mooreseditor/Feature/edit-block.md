---
sidebar_position: 2
title: ブロック編集機能
---

# ブロック編集機能
ブロック編集は左バーのBlockを選択することで利用できます。

## できること
- ブロックの追加
- ブロックの種類、ブロックのアイテムの編集
- ブロックの削除

## できないこと
- ブロック名の変更

**※現状変更できてしまいますがしないでください!!**

- ブロックの各種パラメーターの変更

# ブロック名の変更について
現在(私が面倒という理由で)ブロック名を変更することができますが、変更しないでください。

ブロック名を変更してはいけない理由はmodとセーブの仕組みにあります。

詳しくは[アイテムとブロックのロードの仕組み](../Architecture/item-block-load-structure.md)で解説しています。

## ブロックの各種パラメーターの変更
ブロックには各種パラメーターを持ちます。ベルトコンベアであれば輸送量、電柱であれば通電範囲、機械であれば消費電力量などです。

これらの値はblock.jsonのparamに格納されています。

そのため、ブロックの各種パラメーターを編集するには直接jsonを編集する必要があります。修正予定ではあります。

ブロックタイプごとのパラメーターのフォーマットは以下の通りとなります。

### 機械
フォーマット
```json
"param": {
    "inputSlot": 処理前アイテムが入るスロット数,
    "outputSlot": 処理後アイテムが入るスロット数,
    "requiredPower": 稼働中に消費する電力
}
```
例
```json
"param": {
    "inputSlot": 1,
    "outputSlot": 1,
    "requiredPower": 100
}
```


### ベルトコンベア
フォーマット
```json
"param": {
    "slot": スロット数,
    "time": アイテムが入ってから出るまでの時間
}
```
例
```json
"param": {
    "slot": 4,
    "time": 2000
}
```


### 発電機
フォーマット
```json
"param": {
    "fuelSlot": 燃料スロット数,
    "fuel": [
        {
            "id": アイテムID(item.jsonの何番目か 修正予定),
            "time": アイテム一個で発電する時間,
            "power": 発電中の発電量
        }
    ]
},
```
例
```json
"param": {
    "fuelSlot": 3,
    "fuel": [
        {
            "id": 18,
            "time": 10000,
            "power": 500
        }
    ]
},
```

### 採掘機
フォーマット
```json
"param": {
    "requiredPower": 消費電力量,
    "outputSlot": 採掘機のスロット,
    "oreSetting": [
        {
            "oreId": 採掘できる鉱石のID(ore.jsonの何番目か),
            "time": 1個採掘するのにかかる時間
        }
    ]
},
```
例
```json
"param": {
    "requiredPower": 10,
    "outputSlot": 3,
    "oreSetting": [
        {
            "oreId": 1,
            "time": 1000
        },
        {
            "oreId": 2,
            "time": 1000
        },
        {
            "oreId": 3,
            "time": 1000
        },
        {
            "oreId": 4,
            "time": 1000
        },
        {
            "oreId": 5,
            "time": 1000
        }
    ]
},
```


### チェスト
フォーマット
```json
"param": {
    "slot": チェストのスロット数
},
```
例
```json
"param": {
    "slot": 5
},
```

### 電柱
フォーマット
```json
"param": {
    "poleConnectionRange": 電柱同士が接続する範囲,
    "machineConnectionRange": 機械と接続できる範囲
},
```
例
```json
"param": {
    "poleConnectionRange": 11,
    "machineConnectionRange": 11
},
```