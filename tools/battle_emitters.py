"""Build firing-pose measurements for the already packed trainer-battle sheets."""
import json
import math
from PIL import Image


def resolve_pose(sprite, action):
    anim = sprite['anims'].get(action)
    if isinstance(anim, str):
        anim = sprite['anims'].get(anim)
    return anim if isinstance(anim, dict) else None


def firing_pose(sprite):
    shot = resolve_pose(sprite, 'shoot') or resolve_pose(sprite, 'attack') or sprite['anims']['idle']
    special = resolve_pose(sprite, 'special') or shot
    if special.get('mouth') and not special.get('via'):
        return special
    return resolve_pose(sprite, special.get('via', 'shoot')) or shot


# For directional sheets that lack published mouth data, use the actual art in
# each direction. Low bodies, long necks and beaks need different height ratios.
DIRECTIONAL_LANDMARKS = {'599':(.56,.50), '600':(.56,.50), '601':(.62,.50), '653':(.88,.36)}

# Resonance v3.0.0 overrides this particular Shoot sheet at frame 4.
GYARADOS_HELD_MOUTH = [0,-14.5,24.5,-16.5,34.5,-24.5,37.5,-32.5,
                       0,-38.5,-37.5,-32.5,-34.5,-24.5,-24.5,-16.5]


def hold_frame(anim):
    count = anim['n']
    hit = anim.get('hit', -1)
    if hit < 0:
        hit = int(count*.45)
    index = anim.get('hold', -1)
    if index < 0:
        index = hit
    return min(count-1, index if index >= hit else 0)


def silhouette(image, strip, row, frame):
    sy, w, h, ax, ay, rows, *_ = strip
    left = frame*w
    top = sy + (row if rows == 8 else 0)*h
    cell = image.crop((left, top, left+w, top+h))
    bbox = cell.getchannel('A').getbbox()
    if not bbox:
        raise ValueError(f'Empty emitting frame at {left},{top}')
    x1,y1,x2,y2 = bbox
    return x1-ax,y1-ay,x2-ax,y2-ay


def at_fraction(bounds, fx, fy):
    x1,y1,x2,y2 = bounds
    return [round(x1+(x2-1-x1)*fx,1), round(y1+(y2-1-y1)*fy,1)]


def build_emitters(root, out, manifest, chosen, source_metrics):
    data = {}
    for key, atlas in manifest.items():
        idle = atlas['idle']
        size = max(16, idle[1], idle[2])
        sprite = chosen[key]
        anim = firing_pose(sprite)
        hold = hold_frame(anim)
        metrics = source_metrics[sprite['key']]
        # Up is the top of the body relative to the planted feet.
        body_y = round(-metrics[6]+.5*metrics[4],1)
        mouth = anim.get('mouth')
        if sprite['key'] == 'gyarados' and hold == 4:
            mouth = GYARADOS_HELD_MOUTH
        if not mouth:
            strip = atlas.get('shoot',atlas.get('attack',idle))
            reach, height = DIRECTIONAL_LANDMARKS[key]
            mouth = []
            with Image.open(out/'sprites'/(key+'.png')) as source:
                image = source.convert('RGBA')
                for row in range(8):
                    heading_x = math.sin(row*math.pi/4)
                    bounds = silhouette(image,strip,row,hold)
                    mouth.extend(at_fraction(bounds,.5+(reach-.5)*heading_x,height))
        data[key] = {'unit':size,'bodyY':body_y,'frame':hold,'mouth':mouth}
    # One species per line keeps atlas data changes inspectable.
    entries = [json.dumps(k)+':'+json.dumps(v,separators=(',',':')) for k,v in data.items()]
    (root/'src/game/arena-emitters.json').write_text('{\n'+',\n'.join(entries)+'\n}\n', encoding='utf-8')
