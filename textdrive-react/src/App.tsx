import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { createInitialGameState, updateGameState, CONFIG} from './gameLogic';
import type { GameState } from './gameLogic';

// ========================================
// カスタムフック
// ========================================

// キーボード入力管理
const useKeyboardInput = (onRestart: () => void, isGameOver: boolean) => {
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.key] = true;
      
      if ((event.key === 'r' || event.key === 'R') && isGameOver) {
        onRestart();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onRestart, isGameOver]);

  return keysRef;
};

// ゲームループ管理
const useGameLoop = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  keysRef: React.RefObject<{ [key: string]: boolean }>
) => {
  const gameStateRef = useRef<GameState>(gameState);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      if (currentTime - lastTimeRef.current < 1000 / CONFIG.FPS) {
        requestAnimationFrame(gameLoop);
        return;
      }
      
      lastTimeRef.current = currentTime;
      const currentState = gameStateRef.current;

      if (!currentState.gameOver) {
        const newState = updateGameState(currentState, keysRef.current);
        setGameState(newState);
      }

      requestAnimationFrame(gameLoop);
    };

    const animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [setGameState, keysRef]);
};

// タッチコントロール管理
const useTouchControls = () => {
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const pressLeft = useCallback(() => {
    keysRef.current['left'] = true;
    setTimeout(() => {
      keysRef.current['left'] = false;
    }, 100);
  }, []);

  const pressRight = useCallback(() => {
    keysRef.current['right'] = true;
    setTimeout(() => {
      keysRef.current['right'] = false;
    }, 100);
  }, []);

  return { keysRef, pressLeft, pressRight };
};

// ========================================
// コンポーネント
// ========================================

// コース行コンポーネント
const CourseRow = memo(({ row, rowIndex }: { row: string[], rowIndex: number }) => {
  // セル要素をメモ化
  const cells = useMemo(() => 
    row.map((char, colIndex) => (
      <div
        key={`${rowIndex}-${colIndex}`}
        className="bg-white flex items-center justify-center text-5xl font-mono"
        style={{
          width: `${CONFIG.CELL_SIZE}px`,
          height: `${CONFIG.CELL_SIZE}px`,
          color: char === "■" ? '#000' : '#fff',
        }}
      >
        {char === "■" ? "■" : "　"}
      </div>
    )), [row, rowIndex]
  );

  // 行のスタイルをメモ化
  const rowStyle = useMemo(() => ({
    top: `${rowIndex * CONFIG.CELL_SIZE}px`,
    height: `${CONFIG.CELL_SIZE}px`,
  }), [rowIndex]);

  return (
    <div 
      className="absolute left-0 w-full flex"
      style={rowStyle}
    >
      {cells}
    </div>
  );
});

// プレイヤーコンポーネント
const Player = memo(({ x, row }: { x: number, row: number }) => {
  // プレイヤーのスタイルをメモ化
  const playerStyle = useMemo(() => ({
    left: `${x * CONFIG.CELL_SIZE}px`,
    top: `${row * CONFIG.CELL_SIZE}px`,
    width: `${CONFIG.CELL_SIZE}px`,
    height: `${CONFIG.CELL_SIZE}px`,
  }), [x, row]);

  return (
    <div
      className="absolute flex items-center justify-center text-2xl font-mono text-black z-10"
      style={playerStyle}
    >
      車
    </div>
  );
});

// スコア表示コンポーネント
const ScoreDisplay = memo(({ distance }: { distance: number }) => {
  return (
    <div className="absolute top-2 left-2 bg-white border border-black px-1 py-0.5 text-base text-black font-mono z-20">
      距離: {distance}
    </div>
  );
});

// ゲームオーバー画面コンポーネント
const GameOverScreen = memo(({ 
  distance, 
  onRestart 
}: { 
  distance: number, 
  onRestart: () => void 
}) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-black font-mono z-30">
      <div className="text-xl mb-2.5">ゲームオーバー</div>
      <div className="text-base mb-5">最終距離: {distance}</div>
      <div className="text-sm mb-5">Rキーでリスタート</div>
      <button
        onClick={onRestart}
        className="bg-black text-white border-none px-5 py-2.5 text-base font-mono rounded cursor-pointer hover:bg-gray-800 transition-colors"
      >
        リスタート
      </button>
    </div>
  );
});

// コントロールボタンコンポーネント
const ControlButtons = memo(({ 
  onLeftPress, 
  onRightPress 
}: { 
  onLeftPress: () => void, 
  onRightPress: () => void 
}) => {
  return (
    <div 
      className="flex justify-between items-center w-full mt-5 px-5 mb-5"
      style={{ maxWidth: `${CONFIG.SCREEN_WIDTH}px` }}
    >
      <button
        onClick={onLeftPress}
        className="bg-black text-white border-none w-20 h-20 sm:w-24 sm:h-24 rounded-full text-2xl sm:text-3xl font-mono cursor-pointer flex items-center justify-center flex-shrink-0 hover:bg-gray-800 transition-colors active:scale-95 touch-manipulation"
        style={{ minWidth: '80px', minHeight: '80px' }}
      >
        ←
      </button>
      <button
        onClick={onRightPress}
        className="bg-black text-white border-none w-20 h-20 sm:w-24 sm:h-24 rounded-full text-2xl sm:text-3xl font-mono cursor-pointer flex items-center justify-center flex-shrink-0 hover:bg-gray-800 transition-colors active:scale-95 touch-manipulation"
        style={{ minWidth: '80px', minHeight: '80px' }}
      >
        →
      </button>
    </div>
  );
});

// ゲーム画面コンポーネント
const GameScreen = memo(({ 
  courseRows, 
  playerX, 
  playerRow, 
  distance 
}: { 
  courseRows: string[][], 
  playerX: number, 
  playerRow: number, 
  distance: number 
}) => {

  const memoizedCourseRows = useMemo(() => 
    courseRows.map((row, index) => (
      <CourseRow 
        key={index} 
        row={row} 
        rowIndex={index} 
      />
    )), [courseRows]
  );

  return (
    <>
      <div className="relative w-full h-full">
        {memoizedCourseRows}
      </div>
      <Player x={playerX} row={playerRow} />
      <ScoreDisplay distance={distance} />
    </>
  );
});

// ========================================
// メインアプリコンポーネント
// ========================================

function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState = createInitialGameState();
    initialState.courseRows = [];
    return initialState;
  });

  const handleRestart = useCallback(() => {
    const newState = createInitialGameState();
    newState.courseRows = [];
    setGameState(newState);
  }, []);

  // キーボード入力管理
  const keyboardKeysRef = useKeyboardInput(handleRestart, gameState.gameOver);

  // タッチコントロール管理
  const { keysRef: touchKeysRef, pressLeft, pressRight } = useTouchControls();

  // 両方の入力を統合
  const combinedKeysRef = useRef<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    Object.assign(combinedKeysRef.current, keyboardKeysRef.current, touchKeysRef.current);
  });

  // ゲームループ
  useGameLoop(gameState, setGameState, combinedKeysRef);

  return (
    <div className="flex flex-col justify-start items-center min-h-screen h-screen p-2.5 bg-white font-mono box-border">
      <div 
        className="w-full bg-white border border-black relative overflow-hidden"
        style={{
          maxWidth: `${CONFIG.SCREEN_WIDTH}px`,
          height: `${CONFIG.SCREEN_HEIGHT}px`,
        }}
      >
        {!gameState.gameOver ? (
          <GameScreen
            courseRows={gameState.courseRows}
            playerX={gameState.playerX}
            playerRow={gameState.playerRow}
            distance={gameState.scrollOffset}
          />
        ) : (
          <GameOverScreen
            distance={gameState.scrollOffset}
            onRestart={handleRestart}
          />
        )}
      </div>

      <ControlButtons
        onLeftPress={pressLeft}
        onRightPress={pressRight}
      />
    </div>
  );
}

export default App;