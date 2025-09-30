# TextDrive - 文字だけドライブゲーム

シンプルなドライブゲームです。文字だけで構成されたコースを車で走り抜けます。

## プロジェクト構成

- **Python版** (`main.py`): React風のコンポーネント設計でリファクタリングされたpygameゲーム
- **React版** (`textdrive-react/`): React + TypeScript + Tailwind CSSで実装したWeb版（メイン）

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

### React版の実行（推奨）

2. Reactアプリの依存関係をインストール
```bash
cd textdrive-react
npm install
```

3. 開発サーバーを起動
```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてゲームをプレイできます。

4. 本番ビルド
```bash
npm run build
```

## デプロイ

このプロジェクトはVercelでデプロイされています。

- **本番環境**: [https://text-drive.vercel.app/](https://text-drive.vercel.app/)

Web版のゲームは上記のURLから直接プレイできます。

## 開発環境

- **Node.js**: 18.x以上
- **Python**: 3.12以上
- **パッケージマネージャー**: 
  - Python版: `uv`
  - React版: `npm`

## 操作方法

### Web版・Python版
- 左矢印キー: 左に移動
- 右矢印キー: 右に移動
- Rキー: ゲームオーバー時にリスタート

## ゲームのルール

- 黒い四角（■）は壁で、ぶつかるとゲームオーバー
- 空白部分を通って進みます
- ゲーム開始時は空のコースから始まり、徐々にブロックが生成されます
- できるだけ長い距離を走り抜けましょう

## 技術仕様

### Python版 (main.py)
- **フレームワーク**: pygame
- **アーキテクチャ**: React風のコンポーネント設計
- **主要コンポーネント**:
  - `GameState`: ゲーム状態管理（Reactのstateに相当）
  - `CourseComponent`: コース描画コンポーネント
  - `PlayerComponent`: プレイヤー描画コンポーネント
  - `UIComponent`: UI描画コンポーネント
  - `GameOverComponent`: ゲームオーバー画面コンポーネント
  - `App`: メインアプリケーションクラス
- **カスタムフック**:
  - `use_scroll()`: スクロール処理
  - `use_input()`: 入力処理
- **純粋関数**:
  - `generate_course_row()`: コース行生成（固定パターン方式）
  - `check_collision()`: 衝突判定

### React版 (textdrive-react/)
- **フレームワーク**: React 19 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks (useState, useEffect, useCallback, useRef)
- **アーキテクチャ**: コンポーネントベース設計
- **主要コンポーネント**:
  - `App`: メインアプリケーションコンポーネント
  - `GameCanvas`: ゲーム描画エリア
  - `GameUI`: スコア表示UI
  - `GameOverScreen`: ゲームオーバー画面
- **カスタムフック**:
  - `useKeyboardInput`: キーボード入力管理
  - `useGameLoop`: ゲームループ管理
- **ゲームロジック**: `gameLogic.ts`で分離された純粋関数群
