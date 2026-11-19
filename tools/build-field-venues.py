"""Export the local trainer battle backgrounds from the original artwork sheets."""
import argparse
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "tools/data/field-venues"
DESTINATION = ROOT / "assets/battle/field-venues"
# Cells are numbered from the top left. Only terrain used on the regional maps ships.
SHEETS = {
    "outdoors": (3, {0: "route", 1: "forest", 2: "coast", 3: "city", 4: "hideout", 5: "cave", 7: "ruins", 8: "school"}),
    "locales": (2, {2: "arena"}),
    "landmarks": (2, {0: "desert", 1: "volcano", 2: "aether-lab", 3: "ship"}),
}


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--check", action="store_true", help="verify game assets against their artwork")
    args = cli.parse_args()
    if not args.check:
        DESTINATION.mkdir(parents=True, exist_ok=True)
    count = 0
    for sheet, (grid, cells) in SHEETS.items():
        with Image.open(SOURCES / f"{sheet}.png") as image:
            for cell, name in cells.items():
                row, col = divmod(cell, grid)
                box = (round(image.width * col / grid) + 2, round(image.height * row / grid) + 2,
                       round(image.width * (col + 1) / grid) - 2, round(image.height * (row + 1) / grid) - 2)
                scene = ImageOps.fit(image.crop(box).convert("RGB"), (600, 380), method=Image.Resampling.LANCZOS)
                result = BytesIO()
                scene.save(result, format="PNG", compress_level=9)
                destination = DESTINATION / f"{name}.png"
                if args.check:
                    if not destination.is_file() or destination.read_bytes() != result.getvalue():
                        raise SystemExit(f"Out of date: {destination}")
                else:
                    destination.write_bytes(result.getvalue())
                count += 1
    print(f"{count} field battle backgrounds {'verified' if args.check else 'exported'}.")


if __name__ == "__main__":
    main()
