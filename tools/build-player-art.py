"""Package the six original trainer poses from tools/data/player-trainers.png.

Run with Python and Pillow. Optionally pass --preview-font /path/to/Korean-font.ttf
when regenerating the documented selection and battle preview as well.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tools/data/player-trainers.png"
OUTPUT = ROOT / "assets/trainers/player"
GALLERY = ROOT / "docs/screenshots/player-trainers.png"
SLOTS = ("front", "idle", "command")

# Atlas-space x-coordinate of the rear shoe at the sole, within each 512 px column.
# The extended arm widens the command pose. Anchoring to the shoe keeps it planted.
PROFILES = {
    "male": {"rows": (0, 496), "shoe_x": (173, 166, 127), "height": 465,
             "portrait": (116, 0, 402, 286)},
    "female": {"rows": (496, 1024), "shoe_x": (172, 164, 127), "height": 496,
               "portrait": (112, 499, 412, 799)},
}


def clean_atlas(source):
    # The source contains a very faint matte in transparent space. Trim low coverage
    # before resampling to keep it from becoming a colored fringe on a dark desktop.
    alpha = source.getchannel("A").point(
        lambda a: min(255, max(0, round((a - 40) * 255 / 145)))
    )
    source.putalpha(alpha)
    clean = Image.new("RGBA", source.size)
    clean.paste(source, mask=alpha.point(lambda a: 255 if a else 0))
    return clean


def battle_frame(atlas, profile, column):
    left = column * 512
    top, bottom = profile["rows"]
    cell = atlas.crop((left, top, left + 512, bottom))
    bounds = cell.getchannel("A").getbbox()
    scale = 58 / profile["height"]
    w = round((bounds[2] - bounds[0]) * scale)
    h = round((bounds[3] - bounds[1]) * scale)
    filtered = cell.crop(bounds).convert("RGBa").filter(ImageFilter.GaussianBlur(1))
    sprite = filtered.resize((w, h), Image.Resampling.NEAREST).convert("RGBA")

    # Combat is drawn at roughly 50 px. Preserve a solid contour and crisp face
    # details on both dark and light playfields when the renderer scales it.
    coverage = sprite.getchannel("A").point(lambda a: 255 if a >= 100 else 0)
    color = sprite.convert("RGB")
    sprite = Image.new("RGBA", sprite.size)
    sprite.paste(color, mask=coverage)
    x = 21 - round((profile["shoe_x"][column] - bounds[0]) * scale)
    frame = Image.new("RGBA", (64, 64))
    frame.paste(sprite, (x, 61 - h))
    return frame


def write_preview(font_path, portraits, poses):
    sheet = Image.new("RGB", (736, 416), "#f4f4ec")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype(str(font_path), 15)
    column_width = 184
    for col, label in enumerate(("트레이너 선택", "정면", "배틀 대기", "배틀 지시")):
        draw.text((col * column_width + column_width // 2, 19), label, font=font, fill="#344642", anchor="mm")
    for row, gender in enumerate(PROFILES):
        y = 38 + row * 185
        for col, frame in enumerate([portraits[gender], *poses[gender]]):
            x = col * column_width
            fill = ("#dce6dc", "#f4e5d7")[row] if not col else ("#eaf0e7", "#f3eae2")[row]
            draw.rounded_rectangle((x + 5, y, x + column_width - 5, y + 178), 7, fill=fill)
            size = 153 if not col else 160
            render = frame.resize((size, size), Image.Resampling.LANCZOS if not col else Image.Resampling.NEAREST)
            sheet.paste(render, (x + (column_width - size) // 2, y + 12), render)
    sheet.save(GALLERY, optimize=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview-font", type=Path, help="also write the Korean documentation preview")
    args = parser.parse_args()
    with Image.open(SOURCE) as image:
        if image.mode != "RGBA" or image.size != (1536, 1024):
            raise ValueError("Expected the original 1536 x 1024 RGBA trainer atlas")
        atlas = clean_atlas(image.copy())
    portraits, poses = {}, {}
    for gender, profile in PROFILES.items():
        folder = OUTPUT / gender
        folder.mkdir(parents=True, exist_ok=True)
        portraits[gender] = atlas.crop(profile["portrait"]).resize((160, 160), Image.Resampling.LANCZOS)
        portraits[gender].save(folder / "portrait.png", optimize=True)
        poses[gender] = [battle_frame(atlas, profile, i) for i in range(len(SLOTS))]
        for slot, frame in zip(SLOTS, poses[gender]):
            frame.save(folder / f"{slot}.png", optimize=True)
    if args.preview_font:
        write_preview(args.preview_font, portraits, poses)


if __name__ == "__main__":
    main()
