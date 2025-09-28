import random
import sys

import pygame

# 初期化
pygame.init()
SCREEN_WIDTH, SCREEN_HEIGHT = 360, 600  # 9文字 × 40px = 360px
CELL_SIZE = 40
ROWS = SCREEN_HEIGHT // CELL_SIZE
COLS = 9
FPS = 60

screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("文字だけドライブゲーム")

# フォント設定
try:
    # Macのフォント
    FONT_PATH = "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"
    font = pygame.font.Font(FONT_PATH, 32)
except:
    # デフォルトフォント
    font = pygame.font.Font(None, 32)

# プレイヤー
player_x = COLS // 2  # 中央からスタート
player_row = ROWS - 2  # 下から2行目

# コースパターン
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

# ゲーム状態
scroll_offset = 0
current_pattern = 0
scroll_timer = 0
SCROLL_SPEED = 10

# キー入力制御
key_timer = 0
KEY_REPEAT_DELAY = 5

# 画面に表示するコース行を保持
course_rows = []


def generate_new_row():
    """新しいコース行を1つ生成"""
    global current_pattern

    # 一定間隔でパターンを変更
    current_pattern = (current_pattern + random.choice([-1, 0, 1])) % len(
        COURSE_PATTERNS
    )

    # 現在のパターンを取得
    pattern = COURSE_PATTERNS[current_pattern]

    # パターンを9文字に調整
    if len(pattern) < COLS:
        pattern += " " * (COLS - len(pattern))
    elif len(pattern) > COLS:
        pattern = pattern[:COLS]

    return list(pattern)


def initialize_course():
    """初期コースを生成"""
    global course_rows, current_pattern, scroll_timer, key_timer
    course_rows = []
    scroll_timer = 0
    key_timer = 0

    # 最初に適当なパターンで埋める
    for _ in range(ROWS - 1):
        course_rows.append(generate_new_row())

    # 最後の行（一番下）を真ん中が空いているパターンに設定
    current_pattern = 0  # 最初のパターン（真ん中が空いている）を使用
    pattern = COURSE_PATTERNS[0]  # "■■■   ■■"
    if len(pattern) < COLS:
        pattern += " " * (COLS - len(pattern))
    elif len(pattern) > COLS:
        pattern = pattern[:COLS]

    course_rows.append(list(pattern))


def draw_text(char, x, y, color=(0, 0, 0)):
    """文字を描画"""
    text = font.render(char, True, color)
    screen.blit(text, (x * CELL_SIZE, y * CELL_SIZE))


def draw_course():
    """コースを描画"""
    for screen_row in range(ROWS):
        # 保持している行を描画
        if screen_row < len(course_rows):
            course_row = course_rows[screen_row]

            # 各文字を描画
            for col in range(COLS):
                if col < len(course_row):
                    char = course_row[col]
                    if char == "■":
                        draw_text("■", col, screen_row, (0, 0, 0))  # 黒
                    else:
                        draw_text("　", col, screen_row, (255, 255, 255))  # 白


def draw_player():
    """プレイヤーを描画"""
    draw_text("車", player_x, player_row, (0, 0, 0))  # 黒


def check_collision(x=None, row=None):
    """当たり判定"""
    check_x = x if x is not None else player_x
    check_row = row if row is not None else player_row

    # 指定した位置のコースデータを取得
    if check_row < len(course_rows):
        course_row = course_rows[check_row]

        # 指定した位置に壁があるかチェック
        if 0 <= check_x < len(course_row):
            return course_row[check_x] == "■"
    return False


def can_move_to(new_x):
    """指定した位置に移動可能かチェック"""
    if new_x < 0 or new_x >= COLS:
        return False
    return not check_collision(new_x, player_row)


def draw_ui():
    """UI情報を描画"""
    score_text = font.render(f"距離: {scroll_offset}", True, (0, 0, 0))  # 黒
    text_rect = score_text.get_rect()
    
    # 文字サイズに合わせた背景を描画
    pygame.draw.rect(screen, (255, 255, 255), (8, 8, text_rect.width + 4, text_rect.height + 4))  # 白背景
    pygame.draw.rect(screen, (0, 0, 0), (8, 8, text_rect.width + 4, text_rect.height + 4), 1)  # 黒枠線
    
    screen.blit(score_text, (10, 10))


clock = pygame.time.Clock()
game_over = False

# 初期コースを生成
initialize_course()

# ゲームループ
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r and game_over:
                # リスタート
                scroll_offset = 0
                player_x = COLS // 2
                current_pattern = 0
                game_over = False
                initialize_course()  # コースも再初期化

    if not game_over:
        # キー入力処理（改善版）
        keys = pygame.key.get_pressed()

        # キータイマーを使用してスムーズな移動を実現
        if key_timer <= 0:
            moved = False

            # 左移動
            if keys[pygame.K_LEFT]:
                new_x = player_x - 1
                if can_move_to(new_x):
                    player_x = new_x
                    moved = True

            # 右移動
            elif keys[pygame.K_RIGHT]:
                new_x = player_x + 1
                if can_move_to(new_x):
                    player_x = new_x
                    moved = True

            if moved:
                key_timer = KEY_REPEAT_DELAY
        else:
            key_timer -= 1

        # スクロール処理：タイマーを使用して速度制御
        scroll_timer += 1
        if scroll_timer >= SCROLL_SPEED:
            scroll_timer = 0

            # 上に新しい行を追加、下の行を削除
            new_row = generate_new_row()
            course_rows.insert(0, new_row)  # 一番上に新しい行を追加
            if len(course_rows) > ROWS:
                course_rows.pop()  # 一番下の行を削除

            scroll_offset += 1

            # スクロール後の当たり判定（プレイヤーが壁に押し込まれた場合）
            if check_collision():
                game_over = True

    # 描画
    screen.fill((255, 255, 255))  # 白背景

    if not game_over:
        draw_course()
        draw_player()
        draw_ui()
    else:
        # ゲームオーバー画面
        game_over_text = font.render("ゲームオーバー", True, (0, 0, 0))  # 黒
        restart_text = font.render("Rキーでリスタート", True, (0, 0, 0))  # 黒
        final_score = font.render(f"最終距離: {scroll_offset}", True, (0, 0, 0))  # 黒

        screen.blit(game_over_text, (SCREEN_WIDTH // 2 - 80, SCREEN_HEIGHT // 2 - 40))
        screen.blit(final_score, (SCREEN_WIDTH // 2 - 70, SCREEN_HEIGHT // 2 - 10))
        screen.blit(restart_text, (SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2 + 20))

    pygame.display.flip()
    clock.tick(FPS)
