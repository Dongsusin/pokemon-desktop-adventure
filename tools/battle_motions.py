"""Audit the original Resonance actor poses and exact move timelines for playable content."""
import json
import re

from PIL import Image

from battle_emitters import firing_pose


MOVE_IDS = (
    'tackle', 'flameCharge', 'shadowSneak', 'scratch', 'vineWhip', 'bugBite', 'lowKick',
    'bite', 'metalClaw', 'waterGun', 'thunderShock', 'dragonBreath', 'ember', 'gust',
    'fairyWind', 'poisonSting', 'mudShot', 'iceShard', 'waterPulse', 'razorLeaf',
    'rockThrow', 'confusion', 'recover',
)


def write_records(path, records):
    lines = [json.dumps(key, ensure_ascii=False) + ':' + json.dumps(value, separators=(',', ':'),
             ensure_ascii=False) for key, value in records.items()]
    path.write_text('{\n' + ',\n'.join(lines) + '\n}\n', encoding='utf-8')


def moving_strip(image, strip):
    if not strip:
        return False
    y, w, h, _, _, rows, durations, *_ = strip
    if rows != 8 or len(durations) < 2:
        return False
    # Identical held frames do not establish a walk, attack or cast animation.
    animated = False
    for row in range(rows):
        top = y + row * h
        frames = [image.crop((i*w, top, (i+1)*w, top+h)) for i in range(len(durations))]
        if any(frame.getbbox() is None for frame in frames):
            return False
        first = frames[0].tobytes()
        if any(frame.tobytes() != first for frame in frames[1:]):
            animated = True
    return animated


def actor_pose(out, key, sprite, atlas):
    anims = sprite['anims']
    if not all(isinstance(anims.get(action), dict) and anims[action]['f'] == source
               for action, source in [('walk', 'Walk'), ('attack', 'Attack')]):
        return None
    with Image.open(out/'sprites'/(key + '.png')) as png:
        image = png.convert('RGBA')
        if not all(moving_strip(image, atlas.get(action)) for action in ('walk', 'attack')):
            return None
        # Resolve the published source's own special-pose override, as the muzzle does.
        release = firing_pose(sprite)
        if release['f'] not in ('Idle', 'Walk', 'Attack') and moving_strip(image, atlas.get('shoot')):
            return 'attack+shoot'
    return 'attack'


def build_motion_catalog(root, out, manifest, chosen, read):
    species = dict(re.findall(r'^  \[(\d+),"([^"]+)",', (root/'src/game/catalog.ts').read_text(encoding='utf-8'), re.M))
    forms = dict(re.findall(r'^  \["([^"]+)","([^"]+)",', (root/'src/game/forms.ts').read_text(encoding='utf-8'), re.M))
    actors, keys = {}, set()
    for key, sprite in chosen.items():
        pose = actor_pose(out, key, sprite, manifest[key])
        if pose:
            identity = species[key] if key.isdecimal() else forms[key] + '/' + key
            actors[identity] = pose
            keys.add(key)
    clips, moves = {}, {}
    directory = out/'moves'
    directory.mkdir(exist_ok=True)
    kinds = json.loads(read('dist/data/move-kinds.json'))['moves']
    for move_id in MOVE_IDS:
        original = move_id.upper()
        data = json.loads(read('dist/data/anims/moves/' + original + '.json'))
        assert data['id'] == original and data['src'] == 'Move:' + original
        assert data['n'] == len(data['f']) and data['n'] >= 2
        assert any(data['f']) or data.get('spr') or data.get('ov')
        assert kinds[original]['from'] == 'map'
        for name in set(data.get('img', [])) | ({data['sheet']} if data.get('sheet') else set()):
            (directory/name).write_bytes(read('assets/Graphics/Animations/' + name))
        clips[move_id] = {k: data[k] for k in ('id','src','sheet','hue','n','imp','lau','f','spr','ov','img','fx') if k in data}
        moves[move_id] = 'attack' if kinds[original]['kind'] in ('dash', 'strike') else 'shoot'
    (directory/'CREDITS.txt').write_bytes(read('assets/Graphics/Animations/CREDITS.txt'))
    write_records(root/'src/renderer/move-clips.json', clips)
    catalog = {'actors': dict(sorted(actors.items())), 'moves': moves}
    (root/'src/game/resonance-motions.json').write_text(json.dumps(catalog, indent=2) + '\n', encoding='utf-8')
    return keys
