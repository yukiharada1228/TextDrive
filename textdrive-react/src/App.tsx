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
    // pygameの実装に合わせて、初期状態は空のコースから開始
    initialState.courseRows = [];
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
        // pygameの実装に合わせて、リスタート時も空のコースから開始
        newState.courseRows = [];
        setGameState(newState);
      }
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    keysRef.current[event.key] = false;
  }, []);

  // タッチ操作
  const handleLeftPress = useCallback(() => {
    keysRef.current['left'] = true;
    setTimeout(() => {
      keysRef.current['left'] = false;
    }, 100);
  }, []);

  const handleRightPress = useCallback(() => {
    keysRef.current['right'] = true;
    setTimeout(() => {
      keysRef.current['right'] = false;
    }, 100);
  }, []);

  // リスタート
  const handleRestart = useCallback(() => {
    const newState = createInitialGameState();
    // pygameの実装に合わせて、リスタート時も空のコースから開始
    newState.courseRows = [];
    setGameState(newState);
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
          fontSize: '28px',
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
      flexDirection: 'column',
      justifyContent: 'flex-start', 
      alignItems: 'center', 
      minHeight: '100vh',
      height: '100vh',
      padding: '10px',
      backgroundColor: '#fff', // 白背景（Pygameと同じ）
      fontFamily: 'monospace', // 等幅フォント
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: `${SCREEN_WIDTH}px`,
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
            <div style={{ fontSize: '14px', marginBottom: '20px' }}>Rキーでリスタート</div>
            <button
              onClick={handleRestart}
              style={{
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                fontSize: '16px',
                fontFamily: 'monospace',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              リスタート
            </button>
          </div>
        )}
      </div>

      {/* コントロールボタン */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: `${SCREEN_WIDTH}px`,
        marginTop: '20px',
        padding: '0 20px',
        marginBottom: '20px'
      }}>
        <button
          onClick={handleLeftPress}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            fontSize: '20px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          ←
        </button>
        <button
          onClick={handleRightPress}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            fontSize: '20px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}

export default App;