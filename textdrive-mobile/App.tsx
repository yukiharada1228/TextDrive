import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { 
  StatusBar, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions,
  Alert
} from 'react-native';
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
} from './src/gameLogic';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// コース行コンポーネント
const CourseRow = memo(({ row, rowIndex }: { row: string[], rowIndex: number }) => {
  return (
    <View 
      style={[
        styles.courseRow,
        {
          top: rowIndex * CELL_SIZE,
        }
      ]}
    >
      {row.map((char, colIndex) => (
        <View
          key={`${rowIndex}-${colIndex}`}
          style={[
            styles.cell,
            {
              backgroundColor: char === "■" ? '#000' : '#fff',
            }
          ]}
        >
          {char === "■" ? (
            <View style={styles.wallBlock} />
          ) : (
            <Text style={styles.cellText}>　</Text>
          )}
        </View>
      ))}
    </View>
  );
});

export default function App() {
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

  // 初期化とゲームループ開始
  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

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
      <View
        style={[
          styles.player,
          {
            left: gameState.playerX * CELL_SIZE,
            top: gameState.playerRow * CELL_SIZE,
          }
        ]}
      >
        <View style={styles.playerBlock}>
          <Text style={styles.playerText}>車</Text>
        </View>
      </View>
    );
  };

  // UI描画
  const renderUI = () => {
    return (
      <View style={styles.ui}>
        <Text style={styles.uiText}>距離: {gameState.scrollOffset}</Text>
      </View>
    );
  };

  // タッチ操作
  const handleLeftPress = () => {
    keysRef.current['left'] = true;
    setTimeout(() => {
      keysRef.current['left'] = false;
    }, 100);
  };

  const handleRightPress = () => {
    keysRef.current['right'] = true;
    setTimeout(() => {
      keysRef.current['right'] = false;
    }, 100);
  };

  // リスタート
  const handleRestart = () => {
    const newState = createInitialGameState();
    // pygameの実装に合わせて、リスタート時も空のコースから開始
    newState.courseRows = [];
    setGameState(newState);
  };

  // ゲームオーバー時のアラート
  useEffect(() => {
    if (gameState.gameOver) {
      Alert.alert(
        'ゲームオーバー',
        `最終距離: ${gameState.scrollOffset}`,
        [
          {
            text: 'リスタート',
            onPress: handleRestart,
          },
        ]
      );
    }
  }, [gameState.gameOver]);

  return (
    <View style={styles.container}>
      <StatusBar />
      
      <View style={styles.gameContainer}>
        {!gameState.gameOver && (
          <>
            <View style={styles.gameArea}>
              {renderCourse()}
            </View>
            {renderPlayer()}
            {renderUI()}
          </>
        )}
        
      </View>

      {/* コントロールボタン */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleLeftPress}>
          <Text style={styles.controlButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleRightPress}>
          <Text style={styles.controlButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  gameArea: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  courseRow: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: CELL_SIZE,
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 32,
    fontFamily: 'monospace',
  },
  wallBlock: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  player: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playerBlock: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerText: {
    fontSize: 24,
    color: '#000',
  },
  ui: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 4,
    paddingVertical: 2,
    zIndex: 20,
  },
  uiText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'monospace',
  },
  gameOverContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    alignItems: 'center',
    zIndex: 30,
  },
  gameOverText: {
    fontSize: 20,
    color: '#000',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  finalScoreText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  restartButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: '#000',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'monospace',
  },
});
