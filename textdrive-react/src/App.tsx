import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  createInitialGameState,
  initializeCourse,
  updateGameState,
  GameState,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  CELL_SIZE,
  ROWS,
  COLS,
  FPS
} from './gameLogic';

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

function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState = createInitialGameState();
    initialState.courseRows = initializeCourse();
    return initialState;
  });
  
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>(gameState);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // gameStateRefを常に最新状態に同期
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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

  // ゲームループ
  const gameLoop = useCallback((currentTime: number) => {
    // FPS制御
    if (currentTime - lastTimeRef.current < 1000 / FPS) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    lastTimeRef.current = currentTime;
    const currentState = gameStateRef.current;

    if (!currentState.gameOver) {
      const newState = updateGameState(currentState, keysRef.current);
      setGameState(newState);
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // 初期化とイベントリスナー設定
  useEffect(() => {
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
  }, [gameLoop, handleKeyDown, handleKeyUp]);

  // コース描画
  const renderCourse = () => {
    const rows = [];
    for (let screenRow = 0; screenRow < ROWS; screenRow++) {
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

  // プレイヤー描画
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

  // UI描画
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