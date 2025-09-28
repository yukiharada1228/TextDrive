# TextDrive - 文字だけドライブゲーム

pygameを使用したシンプルなドライブゲームです。文字だけで構成されたコースを車で走り抜けます。

## プロジェクト構成

- **Python版** (`main.py`): React風のコンポーネント設計でリファクタリングされたpygameゲーム
- **React版** (`textdrive-react/`): 同じゲームロジックをReact + TypeScriptで実装したWeb版

## ゲームの特徴

- 文字（■）で構成されたコース
- 左右の矢印キーで車を操作
- 壁にぶつかるとゲームオーバー
- 距離を競うシンプルなゲーム
- コンポーネントベースの設計（React風）

## インストール方法

1. リポジトリをクローン
```bash
git clone https://github.com/your-username/TextDrive.git
cd TextDrive
```

### Python版の実行

2. 依存関係をインストール
```bash
uv sync
```

3. ゲームを実行
```bash
uv run main.py
```

### React版の実行

2. Reactアプリの依存関係をインストール
```bash
cd textdrive-react
npm install
```

3. 開発サーバーを起動
```bash
npm start
```

ブラウザで `http://localhost:3000` を開いてゲームをプレイできます。

## 操作方法

- 左矢印キー: 左に移動
- 右矢印キー: 右に移動
- Rキー: ゲームオーバー時にリスタート

## ゲームのルール

- 黒い四角（■）は壁で、ぶつかるとゲームオーバー
- 空白部分を通って進みます
- できるだけ長い距離を走り抜けましょう

## 技術仕様

### Python版 (main.py)
- **フレームワーク**: pygame
- **アーキテクチャ**: React風のコンポーネント設計
- **主要クラス**:
  - `GameState`: ゲーム状態管理（Reactのstateに相当）
  - `GameRenderer`: 描画コンポーネント
  - `GameLogic`: ゲームロジック（純粋関数）
  - `Game`: メインゲームクラス

### React版 (textdrive-react/)
- **フレームワーク**: React 18 + TypeScript
- **スタイリング**: CSS Modules
- **状態管理**: React Hooks (useState, useEffect)
- **アーキテクチャ**: コンポーネントベース設計

## 開発履歴

- シンプルなpygame実装
- React風のコンポーネント設計にリファクタリング
- React + TypeScript版のWeb実装を追加
