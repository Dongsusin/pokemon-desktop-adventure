"""Pack native, battle-only Mega forms and localized activation effects from Resonance."""
import json
import re
from PIL import Image, ImageOps

from battle_emitters import emitter_data
from battle_motions import actor_pose, write_records


def activation_clip(root, filename, key, read, picture):
    clip = json.loads(read(f'dist/data/anims/common/{key}.json'))
    sheet = picture('assets/Graphics/Animations/' + clip['sheet'])
    frames = []
    for cells in clip['f']:
        canvas = Image.new('RGBA', (384, 384))
        for j in range(0, len(cells), 9):
            x, y, tile, sx, sy, angle, alpha, flags, _ = cells[j:j+9]
            if not alpha or tile < 0 or not sx or not sy:
                continue
            col, row = tile % 5 * 192, tile // 5 * 192
            image = sheet.crop((col, row, col+192, row+192))
            image = image.resize((max(1, round(192*abs(sx)/100)), max(1, round(192*abs(sy)/100))), Image.Resampling.NEAREST)
            if bool(flags & 1) != (sx < 0):
                image = ImageOps.mirror(image)
            if sy < 0:
                image = ImageOps.flip(image)
            if angle:
                image = image.rotate(angle, resample=Image.Resampling.NEAREST, expand=True)
            if alpha < 255:
                image.putalpha(image.getchannel('A').point(lambda a: round(a*alpha/255)))
            # The selected common clips use the original caster at (128,224).
            canvas.alpha_composite(image, (round(192+x-128-image.width/2), round(192+y-224-image.height/2)))
        frames.append(canvas)
    frames[0].save(root/filename, 'WEBP', save_all=True, append_images=frames[1:], duration=50, loop=1, lossless=True)


def build_gimmick_art(root, out, read, picture, atlas, named, metrics):
    output = out/'gimmicks'
    portraits = output/'portraits'
    portraits.mkdir(parents=True, exist_ok=True)
    activation_clip(output, 'mega.webp', 'MegaEvolution2', read, picture)
    activation_clip(output, 'z.webp', 'ZPower', read, picture)
    species = dict(re.findall(r'^  \[(\d+),"([^"]+)",', (root/'src/game/catalog.ts').read_text(encoding='utf-8'), re.M))
    current = root/'src/game/resonance-motions.json'
    catalog = json.loads(current.read_text(encoding='utf-8'))
    atlas_file = root/'src/renderer/battle-atlases.json'
    manifest = json.loads(atlas_file.read_text(encoding='utf-8'))
    emitter_file = root/'src/game/arena-emitters.json'
    emitters = json.loads(emitter_file.read_text(encoding='utf-8'))
    definitions = json.loads(read('dist/data/species.json'))['species']
    mega, added_atlases, chosen, credits = {}, {}, {}, {}
    stat_names = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed']
    for entry in definitions.values():
        change = entry.get('change', {})
        if change.get('kind') != 'mega' or entry.get('set8') not in named:
            continue
        base = species[str(entry['dex'])]
        original = definitions[change['from'][0]]
        if original.get('form', 0):
            origin = next((key.split('/')[1] for key in catalog['actors'] if key.startswith(base+'/')
                           and key.split('/')[1].replace('-', '') == original.get('set8')), None)
        else:
            origin = base
        source_key = base if origin == base else f'{base}/{origin}'
        if source_key not in catalog['actors']:
            continue
        # Keep source species order so the first eligible original variant remains the default.
        suffix = re.search(r'mega([xyz])?$', entry['set8'])
        if not suffix:
            continue
        key = origin + '-mega' + ('-' + suffix[1] if suffix[1] else '')
        sprite = named[entry['set8']]
        _, strips, credit = atlas((key, sprite))
        pose = actor_pose(out, key, sprite, strips)
        if not pose:
            (out/'sprites'/(key+'.png')).unlink()
            continue
        with Image.open(out/'sprites'/(key+'.png')) as sheet:
            y, width, height = strips['idle'][:3]
            face = sheet.convert('RGBA').crop((0,y,width,y+height))
            face.crop(face.getbbox()).save(portraits/(key+'.png'))
        mega[key] = {'base': base, 'from': origin, 'types': [t.lower() for t in entry['types']],
                     'baseStats': dict(zip(stat_names, entry['baseStats']))}
        catalog['actors'][base+'/'+key] = pose
        added_atlases[key], chosen[key], credits[key] = strips, sprite, credit
    manifest.update(added_atlases)
    emitters.update(emitter_data(out, added_atlases, chosen, metrics))
    current.write_text(json.dumps(catalog, indent=2)+'\n', encoding='utf-8')
    atlas_file.write_text(json.dumps(manifest,separators=(',',':')), encoding='utf-8')
    write_records(emitter_file, emitters)
    write_records(root/'src/game/mega-forms.json', mega)
    (output/'SPRITE-CREDITS.txt').write_text('\n\n'.join(credits.values())+'\n', encoding='utf-8')
    (output/'MOVE-CREDITS.txt').write_bytes(read('assets/Graphics/Animations/CREDITS.txt'))
    print(f'{len(mega)} battle-only Mega forms', flush=True)
