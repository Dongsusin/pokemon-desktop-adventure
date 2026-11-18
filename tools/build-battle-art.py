import io
import json
import re
import struct
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

# Pass the extracted resources/app.asar from the published Windows v3.0.0 ZIP.
# Read only the pictures, their frame measurements, arena bounds and artist credits.
root = Path(__file__).resolve().parents[1]
archive = Path(sys.argv[1])
out = root / 'assets/battle'
with archive.open('rb') as stream:
    header_size = struct.unpack('<4I', stream.read(16))
    header = json.loads(stream.read(header_size[3]))['files']
    data_offset = 8 + header_size[1]

def index_at(path):
    entry = {'files': header}
    for part in path.split('/'):
        entry = entry['files'][part]
    return entry

def read(path):
    entry = index_at(path)
    with archive.open('rb') as stream:
        stream.seek(data_offset + int(entry['offset']))
        return stream.read(entry['size'])

def picture(path):
    return Image.open(io.BytesIO(read(path))).convert('RGBA')

def action_strip(sprite, anim):
    sheet = picture('assets/Battle/movement/' + sprite['dir'] + '/' + anim['f'] + '-Anim.png')
    w, h = anim['w'], anim['h']
    rows, frames = sheet.height // h, anim['n']
    assert rows in (1, 8) and frames <= sheet.width // w
    anchors = anim.get('a', [w // 2, h // 2])
    cells = []
    for row in range(rows):
        for frame in range(frames):
            source = sheet.crop((w * frame, h * row, w * (frame + 1), h * (row + 1)))
            bbox = source.getbbox()
            if not bbox:
                continue
            if isinstance(anchors[0], list):
                row_anchors = anchors[row]
                ax, ay = row_anchors if len(row_anchors) == 2 else row_anchors[frame*2:frame*2+2]
            else:
                ax, ay = anchors
            cells.append((row, frame, bbox[0]-ax, bbox[1]-ay, source.crop(bbox)))
    left = min(cell[2] for cell in cells)
    top = min(cell[3] for cell in cells)
    width = max(x + img.width for _, _, x, _, img in cells) - left
    height = max(y + img.height for _, _, _, y, img in cells) - top
    strip = Image.new('RGBA', (width * frames, height * rows))
    for row, frame, x, y, img in cells:
        strip.paste(img, (frame*width+x-left, row*height+y-top))
    return strip, [width, height, -left, -top, rows, anim['d']]

def atlas(entry):
    key, sprite = entry
    records = {}
    strips = []
    atlas_height = 0
    for action in ['idle', 'walk', 'attack', 'hurt', 'charge', 'shoot']:
        anim = sprite['anims'].get(action)
        if not isinstance(anim, dict):
            continue
        strip, meta = action_strip(sprite, anim)
        if action in ('attack', 'shoot'):
            frames = anim['n']
            hit = min(frames-1, max(0, anim.get('hit', frames//3)))
            back = min(frames, max(hit+1, anim.get('ret', (frames*2)//3)))
            meta.extend([sum(anim['d'][:hit]), sum(anim['d'][:back])])
        records[action] = [atlas_height] + meta
        atlas_height += strip.height
        strips.append(strip)
    image = Image.new('RGBA', (max(s.width for s in strips), atlas_height))
    y = 0
    for strip in strips:
        image.paste(strip, (0, y))
        y += strip.height
    # Exact palette conversion only. Source alpha and pixel colours are preserved.
    colors = image.getcolors(256)
    if colors and all(color[3] in (0,255) for _, color in colors):
        opaque = [color[:3] for _,color in colors if color[3] == 255]
        palette = Image.new('P',(1,1))
        palette.putpalette(bytes(b for rgb in [(0,0,0), *opaque] for b in rgb))
        indexed = image.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        # Preserve opaque black even if the quantizer selected transparency's RGB.
        if (0,0,0) in opaque:
            black = opaque.index((0,0,0)) + 1
            indexed = indexed.point([black] + list(range(1,256)))
        indexed.paste(0, mask=image.getchannel('A').point(lambda a: 255-a))
        indexed.info['transparency'] = 0
        if indexed.convert('RGBA').tobytes() == image.tobytes():
            image = indexed
    image.save(out / 'sprites' / (key + '.png'))
    credit = read('assets/Battle/movement/' + sprite['dir'] + '/credits.txt').decode('utf-8-sig').strip()
    return key, records, f"{key} ({sprite['key']} / {sprite['dir']})\n{credit}"

def battle_floor(key, ground):
    floor = picture('assets/Arenas/' + key + '.png').crop(ground['field'])
    if key == 'gym-pewter':
        # Static scenery in the recording, outside the central approach and cast line.
        decorations = [
            ('boulder',0,.24,.16,2), ('rock',0,.76,.17,2),
            ('rock',0,.25,.78,2), ('boulder',0,.77,.76,2),
            ('rock',1,.11,.88,1), ('rock',1,.89,.10,1),
        ]
        for prop, row, x, y, scale in decorations:
            tile = picture('assets/Graphics/Characters/Object '+prop+'.png').crop((0,row*32,32,row*32+32))
            tile = tile.resize((32*scale,32*scale), Image.Resampling.NEAREST)
            floor.alpha_composite(tile, (round(floor.width*x-tile.width/2),round(floor.height*y-tile.height/2)))
    floor.convert('RGB').save(out/'grounds'/(key+'.png'))

def add_fronts(manifest):
    index = json.loads(read('dist/data/pokerogue-sprites.json'))
    species = json.loads(read('dist/data/species.json'))['species']
    official = index['species']
    mapping = {str(s['dex']): key for key,s in species.items() if '_' not in key and key in official}
    # These twelve forms have a dedicated front animation in the reference library.
    missing_forms = {
        'stunfisk-galar':'STUNFISK_1', 'dudunsparce-three-segment':'DUDUNSPARCE_1',
        'squawkabilly-blue-plumage':'SQUAWKABILLY_1','squawkabilly-yellow-plumage':'SQUAWKABILLY_2',
        'squawkabilly-white-plumage':'SQUAWKABILLY_3'
    }
    for mon in ['machamp','drednaw','coalossal','centiskorch','hatterene','grimmsnarl','duraludon']:
        missing_forms[mon+'-gmax'] = mon.upper()+'_1'
    mapping.update(missing_forms)
    used = []
    for dex, original in sorted(mapping.items()):
        if dex in manifest:
            continue
        src = 'assets/Graphics/PokeRogue/pokemon/'+official[original]['normal']
        raw = json.loads(read(src+'.json'))
        texture = raw['textures'][0] if 'textures' in raw else raw
        sheet = picture(src+'.png')
        frames = sorted(texture['frames'], key=lambda f: int(f['filename'].split('.')[0]))
        w = max(f['sourceSize']['w'] for f in frames)
        h = max(f['sourceSize']['h'] for f in frames)
        cols = min(16,len(frames))
        atlas = Image.new('RGBA',(w*cols,h*((len(frames)+cols-1)//cols)))
        for i, frame in enumerate(frames):
            bounds = frame['frame']
            sw,sh = bounds['w'],bounds['h']
            if frame['rotated']:
                sw,sh = sh,sw
            img = sheet.crop((bounds['x'],bounds['y'],bounds['x']+sw,bounds['y']+sh))
            if frame['rotated']:
                img = img.transpose(Image.Transpose.ROTATE_90)
            at = frame['spriteSourceSize']
            assert img.size == (at['w'],at['h']), (dex,img.size,at)
            atlas.paste(img,(w*(i%cols)+at['x'],h*(i//cols)+at['y']))
        atlas.save(out/'sprites'/(dex+'.png'))
        manifest[dex] = {'idle':[0,w,h,w//2,int(h*.89),1,[index['frameMs']*60//1000]*len(frames)],'columns':cols}
        used.append(f"{dex}\t{original}\t{official[original]['normal']}")
    assert all(str(i) in manifest for i in range(1,1026))
    (out/'FRONT-SPRITES.txt').write_text('\n'.join(used)+'\n',encoding='utf-8')
    for name in ['CREDITS.txt','LICENSE.txt','LICENSE-AGPL-3.0.txt']:
        (out/('FRONT-'+name)).write_bytes(read('assets/Graphics/PokeRogue/'+name))

def main():
    (out/'sprites').mkdir(parents=True, exist_ok=True)
    (out/'grounds').mkdir(parents=True, exist_ok=True)
    sets = [json.loads(read('assets/Battle/sprites8/sets/' + name)) for name in index_at('assets/Battle/sprites8/sets')['files']]
    chosen = {str(int(s['dir'])): s for s in sets if re.fullmatch(r'\d{4}', s['dir'])}
    named = {s['key']:s for s in sets}
    forms = re.findall(r'^  \["([^"]+)","', (root/'src/game/forms.ts').read_text(encoding='utf-8'), re.M)
    for form in forms:
        search = re.sub(r'(breed|plumage)$', '', form.replace('-',''))
        if search in named:
            chosen[form] = named[search]
    grounds = json.loads(read('dist/data/arenas.json'))['arenas']
    generics = {'league','icecave','cave','sea','grove','lab','indoor','mountain','desert','sinnoh-marsh'}
    for key, ground in grounds.items():
        if key.startswith('gym-') or key in generics:
            battle_floor(key, ground)
    manifest, credits = {}, []
    with ThreadPoolExecutor(max_workers=6) as pool:
        for key, records, credit in pool.map(atlas, sorted(chosen.items())):
            manifest[key] = records
            credits.append(credit)
    add_fronts(manifest)
    (root/'src/renderer/battle-atlases.json').write_text(json.dumps(manifest,separators=(',',':')),encoding='utf-8')
    (out/'SPRITE-CREDITS.txt').write_text('\n\n'.join(credits)+'\n',encoding='utf-8')
    for source, dest in [('assets/Battle/movement/LICENSE.md','SPRITE-LICENSE.md'),('assets/Battle/movement/credit_names.txt','SPRITE-ARTISTS.txt'),('assets/Arenas/CREDITS.txt','GROUND-CREDITS.txt')]:
        (out/dest).write_bytes(read(source))
    print(f"{len(manifest)} atlases generated", flush=True)

if __name__ == '__main__':
    main()
