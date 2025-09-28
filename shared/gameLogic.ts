// ゲーム定数
export const SCREEN_WIDTH = 360;
export const SCREEN_HEIGHT = 600;
export const CELL_SIZE = 40;
export const ROWS = Math.floor(SCREEN_HEIGHT / CELL_SIZE); // 15
export const COLS = 9;
export const FPS = 60;
export const SCROLL_SPEED = 10;
export const KEY_REPEAT_DELAY = 5;

// コースパターン
export const COURSE_PATTERNS = [
  "■■■   ■■■",
  "■■■■   ■■",
  "■■■■■   ■",
  "■■■■■■   ",
  "■■■■■   ■",
  "■■■■   ■■",
  "■■■   ■■■",
  "■■   ■■■■",
  "■   ■■■■■",
  "   ■■■■■■",
  "■   ■■■■■",
  "■■   ■■■■",
];

// ゲーム状態の型定義
export interface GameState {
  playerX: number;
  playerRow: number;
  scrollOffset: number;
  currentPattern: number;
  scrollTimer: number;
  keyTimer: number;
  courseRows: string[][];
  gameOver: boolean;
}

// 初期ゲーム状態
export const createInitialGameState = (): GameState => ({
  playerX: Math.floor(COLS / 2), // 中央からスタート
  playerRow: ROWS - 2, // 下から2行目
  scrollOffset: 0,
  currentPattern: 0,
  scrollTimer: 0,
  keyTimer: 0,
  courseRows: [],
  gameOver: false,
});

// 新しいコース行を生成
export const generateNewRow = (currentPattern: number): { row: string[], newPattern: number } => {
  // random.choice([-1, 0, 1])
  const randomChoice = [-1, 0, 1][Math.floor(Math.random() * 3)];
  const newPattern = (currentPattern + randomChoice + COURSE_PATTERNS.length) % COURSE_PATTERNS.length;
  
  // 現在のパターンを取得
  let pattern = COURSE_PATTERNS[newPattern];
  
  // パターンを9文字に調整
  if (pattern.length < COLS) {
    pattern += " ".repeat(COLS - pattern.length);
  } else if (pattern.length > COLS) {
    pattern = pattern.substring(0, COLS);
  }
  
  return { row: pattern.split(''), newPattern };
};

// 初期コースを生成
export const initializeCourse = (): string[][] => {
  const courseRows: string[][] = [];
  
  // 最初に適当なパターンで埋める（ROWS - 1行）
  let tempPattern = 0;
  for (let i = 0; i < ROWS - 1; i++) {
    const result = generateNewRow(tempPattern);
    courseRows.push(result.row);
    tempPattern = result.newPattern;
  }
  
  // 最後の行（一番下）を真ん中が空いているパターンに設定
  let pattern = COURSE_PATTERNS[0];
  if (pattern.length < COLS) {
    pattern += " ".repeat(COLS - pattern.length);
  } else if (pattern.length > COLS) {
    pattern = pattern.substring(0, COLS);
  }
  courseRows.push(pattern.split(''));
  
  return courseRows;
};

// 当たり判定
export const checkCollision = (x: number, row: number, courseRows: string[][]): boolean => {
  // 指定した位置のコースデータを取得
  if (row < courseRows.length) {
    const courseRow = courseRows[row];
    
    // 指定した位置に壁があるかチェック
    if (0 <= x && x < courseRow.length) {
      return courseRow[x] === "■";
    }
  }
  return false;
};

// 移動可能かチェック
export const canMoveTo = (newX: number): boolean => {
  if (newX < 0 || newX >= COLS) {
    return false;
  }
  return true; // 壁のチェックは移動後に実行
};

// ゲームループの更新処理
export const updateGameState = (currentState: GameState, keys: { [key: string]: boolean }): GameState => {
  if (currentState.gameOver) {
    return currentState;
  }

  let newState = { ...currentState };

  // キー入力処理（横移動時の当たり判定を含む）
  if (newState.keyTimer <= 0) {
    let moved = false;

    // 左移動
    if (keys['ArrowLeft'] || keys['left']) {
      const newX = newState.playerX - 1;
      if (newX >= 0) { // 画面外チェックのみ
        newState.playerX = newX;
        moved = true;
        // 移動後に壁に当たったかチェック
        if (checkCollision(newX, newState.playerRow, newState.courseRows)) {
          newState.gameOver = true;
        }
      }
    }
    // 右移動
    else if (keys['ArrowRight'] || keys['right']) {
      const newX = newState.playerX + 1;
      if (newX < COLS) { // 画面外チェックのみ
        newState.playerX = newX;
        moved = true;
        // 移動後に壁に当たったかチェック
        if (checkCollision(newX, newState.playerRow, newState.courseRows)) {
          newState.gameOver = true;
        }
      }
    }

    if (moved) {
      newState.keyTimer = KEY_REPEAT_DELAY;
    }
  } else {
    newState.keyTimer -= 1;
  }

  // スクロール処理
  newState.scrollTimer += 1;
  if (newState.scrollTimer >= SCROLL_SPEED) {
    newState.scrollTimer = 0;

    // 上に新しい行を追加、下の行を削除
    const result = generateNewRow(newState.currentPattern);
    const newRow = result.row;
    newState.currentPattern = result.newPattern;
    
    // course_rows.insert(0, new_row) と同じ処理
    newState.courseRows = [newRow, ...newState.courseRows];
    
    // len(course_rows) > ROWS なら course_rows.pop() と同じ処理
    if (newState.courseRows.length > ROWS) {
      newState.courseRows = newState.courseRows.slice(0, ROWS);
    }

    newState.scrollOffset += 1;

    // スクロール後の当たり判定（プレイヤーが壁に押し込まれた場合）
    if (checkCollision(newState.playerX, newState.playerRow, newState.courseRows)) {
      newState.gameOver = true;
    }
  }

  return newState;
};
