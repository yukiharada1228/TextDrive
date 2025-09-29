import random
import sys
from dataclasses import dataclass, field
from typing import List, Tuple

import pygame

pygame.init()

# Constants (Props)
SCREEN_WIDTH, SCREEN_HEIGHT = 360, 600
CELL_SIZE = 40
ROWS = SCREEN_HEIGHT // CELL_SIZE
COLS = 9
FPS = 60

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
    """State Management"""

    player_x: int = COLS // 2
    player_row: int = ROWS - 2
    scroll_offset: int = 0
    current_pattern: int = 0
    scroll_timer: int = 0
    key_timer: int = 0
    course_rows: List[List[str]] = field(default_factory=list)
    game_over: bool = False
    scroll_speed: int = 10
    key_repeat_delay: int = 5


# Pure Functions
def generate_course_row(pattern_index: int) -> Tuple[List[str], int]:
    """新しいコース行を生成"""
    new_pattern = (pattern_index + random.choice([-1, 0, 1])) % len(COURSE_PATTERNS)
    pattern = COURSE_PATTERNS[new_pattern]

    if len(pattern) < COLS:
        pattern += " " * (COLS - len(pattern))
    elif len(pattern) > COLS:
        pattern = pattern[:COLS]

    return list(pattern), new_pattern


def check_collision(course_rows: List[List[str]], x: int, row: int) -> bool:
    """衝突判定"""
    if row < len(course_rows) and 0 <= x < len(course_rows[row]):
        return course_rows[row][x] == "■"
    return False


# Custom Hooks (State Update Logic)
def use_scroll(state: GameState) -> GameState:
    """スクロール処理"""
    new_state = GameState(**state.__dict__)
    new_state.scroll_timer += 1

    if new_state.scroll_timer >= new_state.scroll_speed:
        new_state.scroll_timer = 0

        new_row, new_pattern = generate_course_row(new_state.current_pattern)
        new_state.current_pattern = new_pattern

        new_course_rows = new_state.course_rows.copy()
        new_course_rows.insert(0, new_row)

        if len(new_course_rows) > ROWS:
            new_course_rows.pop()

        new_state.course_rows = new_course_rows
        new_state.scroll_offset += 1

        if check_collision(
            new_state.course_rows, new_state.player_x, new_state.player_row
        ):
            new_state.game_over = True

    return new_state


def use_input(state: GameState, keys) -> GameState:
    """入力処理"""
    new_state = GameState(**state.__dict__)

    if new_state.key_timer > 0:
        new_state.key_timer -= 1
        return new_state

    moved = False

    if keys[pygame.K_LEFT]:
        new_x = new_state.player_x - 1
        if new_x >= 0:
            new_state.player_x = new_x
            moved = True
            if check_collision(new_state.course_rows, new_x, new_state.player_row):
                new_state.game_over = True

    elif keys[pygame.K_RIGHT]:
        new_x = new_state.player_x + 1
        if new_x < COLS:
            new_state.player_x = new_x
            moved = True
            if check_collision(new_state.course_rows, new_x, new_state.player_row):
                new_state.game_over = True

    if moved:
        new_state.key_timer = new_state.key_repeat_delay

    return new_state


# Components
class CourseComponent:
    """コース描画コンポーネント"""

    def __init__(self, screen, font):
        self.screen = screen
        self.font = font

    def render_cell(self, char: str, x: int, y: int, color: Tuple[int, int, int]):
        text = self.font.render(char, True, color)
        self.screen.blit(text, (x * CELL_SIZE, y * CELL_SIZE))

    def render(self, course_rows: List[List[str]]):
        for screen_row in range(ROWS):
            if screen_row < len(course_rows):
                course_row = course_rows[screen_row]
                for col in range(COLS):
                    if col < len(course_row):
                        char = course_row[col]
                        color = (0, 0, 0) if char == "■" else (255, 255, 255)
                        self.render_cell(
                            char if char == "■" else "　", col, screen_row, color
                        )


class PlayerComponent:
    """プレイヤー描画コンポーネント"""

    def __init__(self, screen, font):
        self.screen = screen
        self.font = font

    def render(self, x: int, row: int):
        text = self.font.render("車", True, (0, 0, 0))
        self.screen.blit(text, (x * CELL_SIZE, row * CELL_SIZE))


class UIComponent:
    """UI描画コンポーネント"""

    def __init__(self, screen, font):
        self.screen = screen
        self.font = font

    def render(self, scroll_offset: int):
        score_text = self.font.render(f"距離: {scroll_offset}", True, (0, 0, 0))
        text_rect = score_text.get_rect()

        pygame.draw.rect(
            self.screen,
            (255, 255, 255),
            (8, 8, text_rect.width + 4, text_rect.height + 4),
        )
        pygame.draw.rect(
            self.screen, (0, 0, 0), (8, 8, text_rect.width + 4, text_rect.height + 4), 1
        )
        self.screen.blit(score_text, (10, 10))


class GameOverComponent:
    """ゲームオーバー描画コンポーネント"""

    def __init__(self, screen, font):
        self.screen = screen
        self.font = font

    def render(self, scroll_offset: int):
        texts = [
            ("ゲームオーバー", SCREEN_HEIGHT // 2 - 40),
            (f"最終距離: {scroll_offset}", SCREEN_HEIGHT // 2 - 10),
            ("Rキーでリスタート", SCREEN_HEIGHT // 2 + 20),
        ]

        for text, y in texts:
            rendered_text = self.font.render(text, True, (0, 0, 0))
            text_rect = rendered_text.get_rect()
            text_rect.centerx = SCREEN_WIDTH // 2
            text_rect.y = y
            self.screen.blit(rendered_text, text_rect)


# Main App Component
class App:
    """メインアプリケーション"""

    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("文字だけドライブゲーム")

        try:
            font = pygame.font.Font(
                "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc", 32
            )
        except:
            font = pygame.font.Font(None, 32)

        self.course = CourseComponent(self.screen, font)
        self.player = PlayerComponent(self.screen, font)
        self.ui = UIComponent(self.screen, font)
        self.game_over = GameOverComponent(self.screen, font)
        self.clock = pygame.time.Clock()

        self.state = GameState()

    def reset(self):
        self.state = GameState()

    def update(self, keys):
        """useEffect相当の更新処理"""
        if not self.state.game_over:
            self.state = use_input(self.state, keys)
            self.state = use_scroll(self.state)

    def render(self):
        """レンダリング"""
        self.screen.fill((255, 255, 255))

        if not self.state.game_over:
            self.course.render(self.state.course_rows)
            self.player.render(self.state.player_x, self.state.player_row)
            self.ui.render(self.state.scroll_offset)
        else:
            self.game_over.render(self.state.scroll_offset)

        pygame.display.flip()

    def run(self):
        """メインループ"""
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_r and self.state.game_over:
                        self.reset()

            keys = pygame.key.get_pressed()
            self.update(keys)
            self.render()
            self.clock.tick(FPS)


if __name__ == "__main__":
    app = App()
    app.run()
