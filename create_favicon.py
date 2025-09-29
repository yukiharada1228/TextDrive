#!/usr/bin/env python3
"""
「車」の文字でfavicon.icoを作成するスクリプト
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_favicon():
    # より大きなサイズでアイコンを作成
    sizes = [32, 48, 64, 128]
    images = []
    
    for size in sizes:
        # 超高解像度で描画してから1-bit画像に変換（滲み完全除去）
        high_res_multiplier = 32  # 32倍の解像度で描画
        high_res_size = size * high_res_multiplier
        
        # 高解像度画像を作成 (RGBモードで白背景)
        high_res_img = Image.new('RGB', (high_res_size, high_res_size), (255, 255, 255))
        high_res_draw = ImageDraw.Draw(high_res_img)
        
        # フォントサイズを調整（高解像度版）
        font_size = int(high_res_size * 0.75)  # 75%のサイズで適度な余白
        
        # main.pyと同じフォントを使用
        font = None
        font_paths = [
            "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        ]
        
        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except IOError:
                continue
        if font is None:
            font = ImageFont.load_default()
        
        # テキストの位置を中央に調整（高解像度版）
        text = "車"
        # textbboxはフォントのベースラインを考慮するため、より正確な中央配置のために調整
        bbox = high_res_draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (high_res_size - text_width) / 2 - bbox[0]  # bbox[0]を引いて左端を調整
        y = (high_res_size - text_height) / 2 - bbox[1]  # bbox[1]を引いて上端を調整
        
        high_res_draw.text((x, y), text, font=font, fill=(0, 0, 0))
        
        # 1-bit画像に変換してアンチエイリアシングを完全に除去
        # 閾値を設定して、グレーのピクセルを白か黒に強制
        high_res_img_1bit = high_res_img.convert('L').point(lambda p: 0 if p < 128 else 255, mode='1')
        
        # 最終サイズにリサイズ（NEARESTでピクセルパーフェクトな縮小）
        img = high_res_img_1bit.resize((size, size), Image.Resampling.NEAREST)
        
        # ICO形式はRGBまたはRGBAを期待するため、再度RGBに変換
        images.append(img.convert('RGB'))
    
    # ICOファイルとして保存
    output_path = "/Users/yukiharada/dev/TextDrive/textdrive-react/public/favicon.ico"
    images[0].save(output_path, format='ICO', sizes=[(img.width, img.height) for img in images])
    print(f"Favicon created: {output_path}")

if __name__ == "__main__":
    create_favicon()
