"""Build the in-game 600×380 battle grounds from the illustrated venue sheets.

Each entry in the sheet index includes its measured, exclusive pixel bounds.
Crop a single scene before resampling so a neighboring scene can never bleed
into the battle field, including when the arena camera zooms in.
"""
import argparse
from io import BytesIO
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PLATES = ROOT / "tools/data/venue-plates"
DESIGNS = ROOT / "tools/data/battle-venues"
OUTPUT = ROOT / "assets/battle/venues"
MANIFEST = ROOT / "src/renderer/battle-venues.json"
FIELD_SIZE = (600, 380)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def render_panel(sheet, bounds, key):
    x0, y0, x1, y1 = bounds
    if not (0 <= x0 < x1 <= sheet.width and 0 <= y0 < y1 <= sheet.height):
        raise ValueError(f"Crop falls outside sheet for {key}: {bounds}")
    scene = sheet.crop((x0, y0, x1, y1))
    # Preserve the proportions of the original buildings, decorations and court.
    field = ImageOps.fit(scene, FIELD_SIZE, method=Image.Resampling.LANCZOS)
    encoded = BytesIO()
    field.save(encoded, format="PNG", compress_level=9)
    return encoded.getvalue()


def prepare_outputs():
    expected = {
        spec.stem: {key: design["name"] for key, design in read_json(spec).items()}
        for spec in sorted(DESIGNS.glob("*.json"))
    }
    seen = {region: {} for region in expected}
    outputs = {}
    for number, entries in enumerate(read_json(PLATES / "index.json"), start=1):
        if not 1 <= len(entries) <= 9:
            raise ValueError(f"Unexpected number of panels in sheet {number}: {len(entries)}")
        with Image.open(PLATES / f"sheet-{number:02}.png") as image:
            sheet = image.convert("RGB")
            for entry in entries:
                region, key, name = entry["region"], entry["id"], entry["name"]
                if expected.get(region, {}).get(key) != name or key in seen[region]:
                    raise ValueError(f"Unknown, renamed or repeated venue: {region}/{key}")
                seen[region][key] = name
                destination = OUTPUT / region / f"{key}.png"
                if entry.get("standalone"):
                    with Image.open(PLATES / "overrides" / f"{key}.png") as replacement:
                        full = (0, 0, replacement.width, replacement.height)
                        outputs[destination] = render_panel(replacement.convert("RGB"), full, key)
                else:
                    outputs[destination] = render_panel(sheet, entry["crop"], key)
    if seen != expected:
        missing = {f"{r}/{k}" for r in expected for k in expected[r] if k not in seen[r]}
        raise ValueError(f"Missing venue panels: {sorted(missing)}")
    outputs[MANIFEST] = (json.dumps(expected, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the shipped images without writing")
    args = parser.parse_args()
    outputs = prepare_outputs()
    changed = [path for path, data in outputs.items() if not path.exists() or path.read_bytes() != data]
    if args.check and changed:
        raise SystemExit("Out of date: " + ", ".join(str(path.relative_to(ROOT)) for path in changed))
    if changed:
        with TemporaryDirectory(dir=ROOT) as staging:
            for number, path in enumerate(changed):
                temporary = Path(staging) / str(number)
                temporary.write_bytes(outputs[path])
                path.parent.mkdir(parents=True, exist_ok=True)
                temporary.replace(path)
    print(f"{len(outputs) - 1} illustrated venues verified, {len(changed)} files updated.")


if __name__ == "__main__":
    main()
