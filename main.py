import random
import sys
from dataclasses import dataclass, field
from typing import List, Tuple, Optional
import pygame

# 初期化
pygame.init()

# 定数 (Reactのpropに相当)
SCREEN_WIDTH, SCREEN_HEIGHT = 360, 600
CELL_SIZE = 40
ROWS = SCREEN_HEIGHT // CELL_SIZE
COLS = 9
FPS = 60

# コースパターン (静的データ)
COURSE_PATTERNS = [
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
]

@dataclass
class GameState:
    """ゲーム状態 (Reactのstateに相当)"""
    player_x: int = COLS // 2
    player_row: int = ROWS - 2
    scroll_offset: int = 0
    current_pattern: int = 0
    scroll_timer: int = 0
    key_timer: int = 0
    course_rows: List[List[str]] = field(default_factory=list)
    game_over: bool = False
    
    # 設定値
    scroll_speed: int = 10
    key_repeat_delay: int = 5

class GameRenderer:
    """描画コンポーネント (Reactのコンポーネントに相当)"""
    
    def __init__(self, screen, font):
        self.screen = screen
        self.font = font
    
    def render_text(self, char: str, x: int, y: int, color: Tuple[int, int, int] = (0, 0, 0)):
        """単一文字描画 (純粋関数)"""
        text = self.font.render(char, True, color)
        self.screen.blit(text, (x * CELL_SIZE, y * CELL_SIZE))
    
    def render_course(self, course_rows: List[List[str]]):
        """コース描画コンポーネント"""
        for screen_row in range(ROWS):
            if screen_row < len(course_rows):
                course_row = course_rows[screen_row]
                
                for col in range(COLS):
                    if col < len(course_row):
                        char = course_row[col]
                        if char == "■":
                            self.render_text("■", col, screen_row, (0, 0, 0))
                        else:
                            self.render_text("　", col, screen_row, (255, 255, 255))
    
    def render_player(self, player_x: int, player_row: int):
        """プレイヤー描画コンポーネント"""
        self.render_text("車", player_x, player_row, (0, 0, 0))
    
    def render_ui(self, scroll_offset: int):
        """UI描画コンポーネント"""
        score_text = self.font.render(f"距離: {scroll_offset}", True, (0, 0, 0))
        text_rect = score_text.get_rect()
        
        # 背景描画
        pygame.draw.rect(self.screen, (255, 255, 255), 
                        (8, 8, text_rect.width + 4, text_rect.height + 4))
        pygame.draw.rect(self.screen, (0, 0, 0), 
                        (8, 8, text_rect.width + 4, text_rect.height + 4), 1)
        
        self.screen.blit(score_text, (10, 10))
    
    def render_game_over(self, scroll_offset: int):
        """ゲームオーバー画面コンポーネント"""
        texts = [
            ("ゲームオーバー", SCREEN_WIDTH // 2 - 80, SCREEN_HEIGHT // 2 - 40),
            (f"最終距離: {scroll_offset}", SCREEN_WIDTH // 2 - 70, SCREEN_HEIGHT // 2 - 10),
            ("Rキーでリスタート", SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2 + 20)
        ]
        
        for text, x, y in texts:
            rendered_text = self.font.render(text, True, (0, 0, 0))
            self.screen.blit(rendered_text, (x, y))

class GameLogic:
    """ゲームロジック (ReactのuseEffectやカスタムフックに相当)"""
    
    @staticmethod
    def generate_new_row(current_pattern: int) -> Tuple[List[str], int]:
        """新しいコース行生成 (純粋関数) - 元のコードと同じ処理"""
        # 元のコードと同じパターン変更ロジック
        new_pattern = (current_pattern + random.choice([-1, 0, 1])) % len(COURSE_PATTERNS)
        pattern = COURSE_PATTERNS[new_pattern]
        
        # パターンを9文字に調整 - 元のコードと同じ
        if len(pattern) < COLS:
            pattern += " " * (COLS - len(pattern))
        elif len(pattern) > COLS:
            pattern = pattern[:COLS]
        
        return list(pattern), new_pattern
    
    @staticmethod
    def initialize_course() -> Tuple[List[List[str]], int]:
        """初期コース生成 - 元のコードと同じ処理順序"""
        course_rows = []
        current_pattern = 0
        
        # 元のコードと同じ：最初に適当なパターンで埋める
        for _ in range(ROWS - 1):
            new_row, current_pattern = GameLogic.generate_new_row(current_pattern)
            course_rows.append(new_row)
        
        # 元のコードと同じ：最後の行（一番下）を真ん中が空いているパターンに設定
        current_pattern = 0  # 最初のパターン（真ん中が空いている）を使用
        pattern = COURSE_PATTERNS[0]  # "■■■   ■■■"
        if len(pattern) < COLS:
            pattern += " " * (COLS - len(pattern))
        elif len(pattern) > COLS:
            pattern = pattern[:COLS]
        course_rows.append(list(pattern))
        
        return course_rows, current_pattern
    
    @staticmethod
    def check_collision(course_rows: List[List[str]], x: int, row: int) -> bool:
        """当たり判定 (純粋関数)"""
        if row < len(course_rows) and 0 <= x < len(course_rows[row]):
            return course_rows[row][x] == "■"
        return False
    
    @staticmethod
    def can_move_to(course_rows: List[List[str]], new_x: int, player_row: int) -> bool:
        """移動可能判定 (純粋関数)"""
        if new_x < 0 or new_x >= COLS:
            return False
        return not GameLogic.check_collision(course_rows, new_x, player_row)
    
    @staticmethod
    def update_scroll(state: GameState) -> GameState:
        """スクロール更新 (状態更新関数)"""
        new_state = GameState(**state.__dict__)
        new_state.scroll_timer += 1
        
        if new_state.scroll_timer >= new_state.scroll_speed:
            new_state.scroll_timer = 0
            
            # 元のコードと同じ方法でスクロール処理
            # 上に新しい行を追加、下の行を削除
            new_row, new_pattern = GameLogic.generate_new_row(new_state.current_pattern)
            new_state.current_pattern = new_pattern
            
            # 元のコードと同じ処理順序で実装
            new_course_rows = new_state.course_rows.copy()
            new_course_rows.insert(0, new_row)  # 一番上に新しい行を追加
            if len(new_course_rows) > ROWS:
                new_course_rows.pop()  # 一番下の行を削除
            
            new_state.course_rows = new_course_rows
            new_state.scroll_offset += 1
            
            # スクロール後の当たり判定（プレイヤーが壁に押し込まれた場合）
            if GameLogic.check_collision(new_state.course_rows, new_state.player_x, new_state.player_row):
                new_state.game_over = True
        
        return new_state
    
    @staticmethod
    def handle_input(state: GameState, keys) -> GameState:
        """入力処理 - React版と同じ動作に修正"""
        new_state = GameState(**state.__dict__)
        
        if new_state.key_timer > 0:
            new_state.key_timer -= 1
            return new_state
        
        moved = False
        
        # 左移動 - React版と同じ処理：画面外チェックのみして移動、その後当たり判定
        if keys[pygame.K_LEFT]:
            new_x = new_state.player_x - 1
            if new_x >= 0:  # 画面外チェックのみ
                new_state.player_x = new_x
                moved = True
                # 移動後に壁に当たったかチェック
                if GameLogic.check_collision(new_state.course_rows, new_x, new_state.player_row):
                    new_state.game_over = True
        
        # 右移動 - React版と同じ処理：画面外チェックのみして移動、その後当たり判定
        elif keys[pygame.K_RIGHT]:
            new_x = new_state.player_x + 1
            if new_x < COLS:  # 画面外チェックのみ
                new_state.player_x = new_x
                moved = True
                # 移動後に壁に当たったかチェック
                if GameLogic.check_collision(new_state.course_rows, new_x, new_state.player_row):
                    new_state.game_over = True
        
        if moved:
            new_state.key_timer = new_state.key_repeat_delay
        
        return new_state

class Game:
    """メインゲームクラス (Reactのコンポーネントのようなもの)"""
    
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("文字だけドライブゲーム")
        
        # フォント設定
        try:
            font_path = "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"
            self.font = pygame.font.Font(font_path, 32)
        except:
            self.font = pygame.font.Font(None, 32)
        
        self.renderer = GameRenderer(self.screen, self.font)
        self.clock = pygame.time.Clock()
        
        # 初期状態 - 元のコードと同じ方法で初期化
        course_rows, current_pattern = GameLogic.initialize_course()
        self.state = GameState(
            course_rows=course_rows,
            current_pattern=current_pattern
        )
    
    def reset_game(self):
        """ゲームリセット - 元のコードと同じ処理"""
        course_rows, current_pattern = GameLogic.initialize_course()
        self.state = GameState(
            course_rows=course_rows,
            current_pattern=current_pattern
        )
    
    def update(self, keys):
        """状態更新 (ReactのuseEffectに相当)"""
        if not self.state.game_over:
            # 入力処理
            self.state = GameLogic.handle_input(self.state, keys)
            # スクロール処理
            self.state = GameLogic.update_scroll(self.state)
    
    def render(self):
        """描画 (Reactのrenderに相当)"""
        self.screen.fill((255, 255, 255))
        
        if not self.state.game_over:
            self.renderer.render_course(self.state.course_rows)
            self.renderer.render_player(self.state.player_x, self.state.player_row)
            self.renderer.render_ui(self.state.scroll_offset)
        else:
            self.renderer.render_game_over(self.state.scroll_offset)
        
        pygame.display.flip()
    
    def run(self):
        """メインループ"""
        while True:
            # イベント処理
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_r and self.state.game_over:
                        self.reset_game()
            
            # 状態更新
            keys = pygame.key.get_pressed()
            self.update(keys)
            
            # 描画
            self.render()
            
            self.clock.tick(FPS)

# ゲーム実行
if __name__ == "__main__":
    game = Game()
    game.run()