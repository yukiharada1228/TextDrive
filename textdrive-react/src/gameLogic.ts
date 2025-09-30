// ========================
// ゲーム定数
// ========================
export const CONFIG = {
  SCREEN_WIDTH: 360,
  SCREEN_HEIGHT: 600,
  CELL_SIZE: 40,
  COLS: 9,
  FPS: 60,
  SCROLL_SPEED: 10,
  KEY_REPEAT_DELAY: 5,
};

export const ROWS = Math.floor(CONFIG.SCREEN_HEIGHT / CONFIG.CELL_SIZE);

// ========================
// コースパターン
// ========================
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

// ========================
// 型定義
// ========================
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

// ========================
// ユーティリティ
// ========================
const nextPatternIndex = (current: number): number => {
  const change = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
  return (current + change + COURSE_PATTERNS.length) % COURSE_PATTERNS.length;
};

const rowFromPattern = (patternIndex: number): string[] =>
  COURSE_PATTERNS[patternIndex].split("");

// ========================
// コース生成
// ========================
export const generateNewRow = (currentPattern: number): { row: string[]; newPattern: number } => {
  const newPattern = nextPatternIndex(currentPattern);
  return { row: rowFromPattern(newPattern), newPattern };
};

export const initializeCourse = (): string[][] => {
  let rows: string[][] = [];
  let pattern = 0;
  for (let i = 0; i < ROWS; i++) {
    const { row, newPattern } = generateNewRow(pattern);
    rows.push(row);
    pattern = newPattern;
  }
  return rows;
};

// ========================
// 当たり判定
// ========================
export const checkCollision = (x: number, row: number, courseRows: string[][]): boolean => {
  if (row >= courseRows.length || x < 0 || x >= courseRows[row].length) return false;
  return courseRows[row][x] === "■";
};

// ========================
// 初期状態
// ========================
export const createInitialGameState = (): GameState => ({
  playerX: Math.floor(CONFIG.COLS / 2),
  playerRow: ROWS - 2,
  scrollOffset: 0,
  currentPattern: 0,
  scrollTimer: 0,
  keyTimer: 0,
  courseRows: [],
  gameOver: false,
});

// ========================
// 入力処理
// ========================
const handleInput = (state: GameState, keys: { [key: string]: boolean }): GameState => {
  if (state.keyTimer > 0) return { ...state, keyTimer: state.keyTimer - 1 };

  let dx = 0;
  if (keys["ArrowLeft"] || keys["left"]) dx = -1;
  if (keys["ArrowRight"] || keys["right"]) dx = 1;

  if (dx === 0) return state;

  const newX = state.playerX + dx;
  if (newX < 0 || newX >= CONFIG.COLS) return state; // 画面外

  const newState = { ...state, playerX: newX, keyTimer: CONFIG.KEY_REPEAT_DELAY };
  if (checkCollision(newX, newState.playerRow, newState.courseRows)) {
    newState.gameOver = true;
  }
  return newState;
};

// ========================
// スクロール処理
// ========================
const handleScroll = (state: GameState): GameState => {
  let newState = { ...state, scrollTimer: state.scrollTimer + 1 };

  if (newState.scrollTimer < CONFIG.SCROLL_SPEED) return newState;
  newState.scrollTimer = 0;

  const { row, newPattern } = generateNewRow(newState.currentPattern);
  newState.currentPattern = newPattern;
  newState.courseRows = [row, ...newState.courseRows].slice(0, ROWS);
  newState.scrollOffset++;

  if (checkCollision(newState.playerX, newState.playerRow, newState.courseRows)) {
    newState.gameOver = true;
  }

  return newState;
};

// ========================
// ゲーム更新
// ========================
export const updateGameState = (currentState: GameState, keys: { [key: string]: boolean }): GameState => {
  if (currentState.gameOver) return currentState;

  let newState = handleInput(currentState, keys);
  newState = handleScroll(newState);
  return newState;
};
