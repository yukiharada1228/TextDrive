# TextDrive - 文字だけドライブゲーム

pygameを使用したシンプルなドライブゲームです。文字だけで構成されたコースを車で走り抜けます。

## プロジェクト構成

- **Python版** (`main.py`): React風のコンポーネント設計でリファクタリングされたpygameゲーム
- **React版** (`textdrive-react/`): 同じゲームロジックをReact + TypeScriptで実装したWeb版
- **React Native版** (`textdrive-mobile/`): モバイルアプリ版（iOS/Android対応）
- **共通ライブラリ** (`shared/gameLogic.ts`): Web版とモバイル版で共有するゲームロジック

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

### React Native版の実行

2. React Nativeアプリの依存関係をインストール
```bash
cd textdrive-mobile
npm install
```

3. 開発サーバーを起動
```bash
npx expo start
```

4. モバイルデバイスでExpo Goアプリを開き、QRコードをスキャンしてアプリを実行

## 操作方法

### Web版・Python版
- 左矢印キー: 左に移動
- 右矢印キー: 右に移動
- Rキー: ゲームオーバー時にリスタート

### モバイル版
- 左ボタン: 左に移動
- 右ボタン: 右に移動
- ゲームオーバー時にアラートでリスタート

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
- **フレームワーク**: React 18 + TypeScript
- **スタイリング**: CSS Modules
- **状態管理**: React Hooks (useState, useEffect)
- **アーキテクチャ**: コンポーネントベース設計

### React Native版 (textdrive-mobile/)
- **フレームワーク**: React Native + Expo + TypeScript
- **プラットフォーム**: iOS/Android対応
- **操作**: タッチボタンによる操作
- **状態管理**: React Hooks (useState, useEffect)
- **アーキテクチャ**: コンポーネントベース設計

### 共通ライブラリ (shared/)
- **ファイル**: `gameLogic.ts`
- **内容**: ゲームロジック、定数、型定義
- **共有**: Web版とモバイル版で共通使用

## 開発履歴

- シンプルなpygame実装
- React風のコンポーネント設計にリファクタリング
- React + TypeScript版のWeb実装を追加
- pygame実装との完全統一
  - コース生成ロジックをpygameの固定パターン方式に統一
  - ゲーム開始時は空のコースから開始（pygameと同じ動作）
  - 前のパターンから-1, 0, +1のいずれかをランダム選択するロジックを実装
  - 全プラットフォーム（Python/React/React Native）で同一のゲーム体験を実現
