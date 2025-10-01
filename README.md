# TextDrive - 文字だけドライブゲーム

シンプルなドライブゲームです。文字だけで構成されたコースを車で走り抜けます。

## プロジェクト構成

- **React版** (`textdrive-react/`): React + TypeScript + Tailwind CSSで実装したWeb版（メイン）
- **Python版** (`main.py`): React風のコンポーネント設計でリファクタリングされたpygameゲーム

## ゲームの特徴

- 文字（■）で構成されたコース
- キーボード（矢印キー）またはタッチボタンで車を操作
- 壁にぶつかるとゲームオーバー
- 距離を競うシンプルなゲーム
- モバイル対応（タッチコントロール付き）
- コンポーネントベースの設計

## インストール方法

1. リポジトリをクローン
```bash
git clone https://github.com/yukiharada1228/TextDrive.git
cd TextDrive
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

### Python版の実行

2. 依存関係をインストール
```bash
uv sync
```

3. ゲームを実行
```bash
uv run main.py
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

### Web版（React）
- **キーボード操作**:
  - 左矢印キー: 左に移動
  - 右矢印キー: 右に移動
  - Rキー: ゲームオーバー時にリスタート
- **タッチ操作**:
  - 左ボタン: 左に移動
  - 右ボタン: 右に移動
  - リスタートボタン: ゲームオーバー時にリスタート

### Python版
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
- **ビルドツール**: Vite (rolldown-vite)
- **スタイリング**: Tailwind CSS v4
- **状態管理**: React Hooks (useState, useEffect, useCallback, useRef, useMemo)
- **アーキテクチャ**: コンポーネントベース設計 + メモ化最適化
- **主要コンポーネント**:
  - `App`: メインアプリケーションコンポーネント
  - `GameScreen`: ゲーム画面コンポーネント
  - `CourseRow`: コース行描画コンポーネント（メモ化）
  - `Player`: プレイヤー描画コンポーネント（メモ化）
  - `ScoreDisplay`: スコア表示コンポーネント（メモ化）
  - `GameOverScreen`: ゲームオーバー画面コンポーネント（メモ化）
  - `ControlButtons`: タッチコントロールボタンコンポーネント（メモ化）
- **カスタムフック**:
  - `useKeyboardInput`: キーボード入力管理
  - `useGameLoop`: ゲームループ管理
  - `useTouchControls`: タッチコントロール管理
- **ゲームロジック**: `gameLogic.ts`で分離された純粋関数群
- **パフォーマンス最適化**: React.memo、useMemo、useCallbackを活用
