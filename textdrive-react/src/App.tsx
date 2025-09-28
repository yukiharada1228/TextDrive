import React, { useState, useEffect, useCallback, useRef, memo } from 'react';

// ゲーム定数
const SCREEN_WIDTH = 360;
const SCREEN_HEIGHT = 600;
const CELL_SIZE = 40;
const ROWS = Math.floor(SCREEN_HEIGHT / CELL_SIZE); // 15
const COLS = 9;
const FPS = 60;
const SCROLL_SPEED = 10;
const KEY_REPEAT_DELAY = 5;

// コースパターン
const COURSE_PATTERNS = [
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
interface GameState {
  playerX: number;
  playerRow: number;
  scrollOffset: number;
  currentPattern: number;
  scrollTimer: number;
  keyTimer: number;
  courseRows: string[][];
  gameOver: boolean;
}

// コース行コンポーネント
const CourseRow = memo(({ row, rowIndex }: { row: string[], rowIndex: number }) => {
  return (
    <div 
      style={{
        position: 'absolute',
        top: `${rowIndex * CELL_SIZE}px`,
        left: 0,
        width: '100%',
        height: `${CELL_SIZE}px`,
        display: 'flex',
      }}
    >
      {row.map((char, colIndex) => (
        <div
          key={`${rowIndex}-${colIndex}`}
          style={{
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            backgroundColor: '#fff', // 白背景（Pygameと同じ）
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px', // Pygameのフォントサイズ32に合わせる
            color: char === "■" ? '#000' : '#fff', // 壁は黒、空白は白（Pygameと同じ）
            fontFamily: 'monospace', // 等幅フォント
          }}
        >
          {char === "■" ? "■" : "　"}
        </div>
      ))}
    </div>
  );
});

// 初期ゲーム状態（Pygameと同じ）
const createInitialGameState = (): GameState => ({
  playerX: Math.floor(COLS / 2), // 中央からスタート
  playerRow: ROWS - 2, // 下から2行目
  scrollOffset: 0,
  currentPattern: 0,
  scrollTimer: 0,
  keyTimer: 0,
  courseRows: [],
  gameOver: false,
});

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>(gameState);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // gameStateRefを常に最新状態に同期
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 新しいコース行を生成（Pygameと完全同一のアルゴリズム）
  const generateNewRow = (currentPattern: number): { row: string[], newPattern: number } => {
    // Pygameと同じ: random.choice([-1, 0, 1])
    const randomChoice = [-1, 0, 1][Math.floor(Math.random() * 3)];
    const newPattern = (currentPattern + randomChoice + COURSE_PATTERNS.length) % COURSE_PATTERNS.length;
    
    // 現在のパターンを取得
    let pattern = COURSE_PATTERNS[newPattern];
    
    // パターンを9文字に調整（Pygameと同じ）
    if (pattern.length < COLS) {
      pattern += " ".repeat(COLS - pattern.length);
    } else if (pattern.length > COLS) {
      pattern = pattern.substring(0, COLS);
    }
    
    return { row: pattern.split(''), newPattern };
  };

  // 初期コースを生成（Pygameと完全同一のアルゴリズム）
  const initializeCourse = (): string[][] => {
    const courseRows: string[][] = [];
    
    // 最初に適当なパターンで埋める（ROWS - 1行）
    let tempPattern = 0;
    for (let i = 0; i < ROWS - 1; i++) {
      const result = generateNewRow(tempPattern);
      courseRows.push(result.row);
      tempPattern = result.newPattern;
    }
    
    // 最後の行（一番下）を真ん中が空いているパターンに設定
    // Pygameと同じ: COURSE_PATTERNS[0] = "■■■   ■■■"
    let pattern = COURSE_PATTERNS[0];
    if (pattern.length < COLS) {
      pattern += " ".repeat(COLS - pattern.length);
    } else if (pattern.length > COLS) {
      pattern = pattern.substring(0, COLS);
    }
    courseRows.push(pattern.split(''));
    
    return courseRows;
  };

  // 当たり判定（Pygameと完全同一）
  const checkCollision = (x?: number, row?: number): boolean => {
    const checkX = x !== undefined ? x : gameStateRef.current.playerX;
    const checkRow = row !== undefined ? row : gameStateRef.current.playerRow;
    
    // 指定した位置のコースデータを取得
    if (checkRow < gameStateRef.current.courseRows.length) {
      const courseRow = gameStateRef.current.courseRows[checkRow];
      
      // 指定した位置に壁があるかチェック
      if (0 <= checkX && checkX < courseRow.length) {
        return courseRow[checkX] === "■";
      }
    }
    return false;
  };

  // 移動可能かチェック（Pygameと完全同一）
  const canMoveTo = (newX: number): boolean => {
    if (newX < 0 || newX >= COLS) {
      return false;
    }
    return !checkCollision(newX, gameStateRef.current.playerRow);
  };

  // キー入力イベント処理
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    keysRef.current[event.key] = true;
    
    // リスタート処理
    if (event.key === 'r' || event.key === 'R') {
      if (gameStateRef.current.gameOver) {
        const newState = createInitialGameState();
        newState.courseRows = initializeCourse();
        setGameState(newState);
      }
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    keysRef.current[event.key] = false;
  }, []);

  // ゲームループ（Pygameと完全同一のアルゴリズム）
  const gameLoop = useCallback((currentTime: number) => {
    // FPS制御
    if (currentTime - lastTimeRef.current < 1000 / FPS) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    lastTimeRef.current = currentTime;
    const currentState = gameStateRef.current;

    if (!currentState.gameOver) {
      setGameState(prevState => {
        let newState = { ...prevState };

        // キー入力処理（横移動時の当たり判定を含む）
        if (newState.keyTimer <= 0) {
          let moved = false;

          // 左移動
          if (keysRef.current['ArrowLeft']) {
            const newX = newState.playerX - 1;
            if (newX >= 0) { // 画面外チェックのみ
              newState.playerX = newX;
              moved = true;
              // 移動後に壁に当たったかチェック
              if (checkCollision(newX, newState.playerRow)) {
                newState.gameOver = true;
              }
            }
          }
          // 右移動
          else if (keysRef.current['ArrowRight']) {
            const newX = newState.playerX + 1;
            if (newX < COLS) { // 画面外チェックのみ
              newState.playerX = newX;
              moved = true;
              // 移動後に壁に当たったかチェック
              if (checkCollision(newX, newState.playerRow)) {
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

        // スクロール処理（Pygameと完全同一）
        newState.scrollTimer += 1;
        if (newState.scrollTimer >= SCROLL_SPEED) {
          newState.scrollTimer = 0;

          // Pygameと同じ: 上に新しい行を追加、下の行を削除
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
          if (checkCollision()) {
            newState.gameOver = true;
          }
        }

        return newState;
      });
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // 初期化とイベントリスナー設定
  useEffect(() => {
    // 初期コース設定
    setGameState(prevState => ({
      ...prevState,
      courseRows: initializeCourse(),
    }));

    // イベントリスナー設定
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // ゲームループ開始
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    // クリーンアップ
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []); // 空の依存配列

  // コース描画（Pygameと同じ順序）
  const renderCourse = () => {
    const rows = [];
    // Pygameと同じ: screen_row in range(ROWS)
    for (let screenRow = 0; screenRow < ROWS; screenRow++) {
      // 保持している行を描画
      if (screenRow < gameState.courseRows.length) {
        const courseRow = gameState.courseRows[screenRow];
        rows.push(
          <CourseRow 
            key={screenRow} 
            row={courseRow} 
            rowIndex={screenRow} 
          />
        );
      }
    }
    return rows;
  };

  // プレイヤー描画（Pygameと同じ）
  const renderPlayer = () => {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${gameState.playerX * CELL_SIZE}px`,
          top: `${gameState.playerRow * CELL_SIZE}px`,
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px', // Pygameのフォントサイズ32に合わせる
          color: '#000', // 黒文字（Pygameと同じ）
          fontFamily: 'monospace', // 等幅フォント
          zIndex: 10,
        }}
      >
        車
      </div>
    );
  };

  // UI描画（Pygameと同じ）
  const renderUI = () => {
    return (
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        backgroundColor: '#fff', // 白背景（Pygameと同じ）
        border: '1px solid #000', // 黒枠線（Pygameと同じ）
        padding: '2px 4px',
        fontSize: '16px',
        color: '#000', // 黒文字（Pygameと同じ）
        fontFamily: 'monospace', // 等幅フォント
        zIndex: 20
      }}>
        距離: {gameState.scrollOffset}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#fff', // 白背景（Pygameと同じ）
      fontFamily: 'monospace' // 等幅フォント
    }}>
      <div style={{
        width: `${SCREEN_WIDTH}px`,
        height: `${SCREEN_HEIGHT}px`,
        backgroundColor: '#fff', // 白背景（Pygameと同じ）
        border: '1px solid #000', // 黒枠線
        position: 'relative',
        overflow: 'hidden'
      }}>
        {!gameState.gameOver && (
          <>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {renderCourse()}
            </div>
            {renderPlayer()}
            {renderUI()}
          </>
        )}
        
        {gameState.gameOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#000', // 黒文字（Pygameと同じ）
            fontFamily: 'monospace', // 等幅フォント
            zIndex: 30
          }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>ゲームオーバー</div>
            <div style={{ fontSize: '16px', marginBottom: '20px' }}>最終距離: {gameState.scrollOffset}</div>
            <div style={{ fontSize: '14px' }}>Rキーでリスタート</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;