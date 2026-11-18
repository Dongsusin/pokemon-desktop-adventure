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


# Coordinates (percent of the first visible silhouette) marked on the game's 56
# front-only drawings. Chien-Pao is mirrored relative to the left-facing birds.
FRONT_LANDMARKS = {
    '514':(45,43), '516':(44,43), '520':(2,37), '522':(9,46), '523':(2,37),
    '538':(46,45), '558':(39,80), '564':(35,91), '565':(29,23), '591':(49,51),
    '592':(49,37), '616':(5,51), '626':(36,72), '668':(19,37), '732':(3,44),
    '735':(11,33), '756':(49,55), '765':(35,35), '838':(17,53), '839':(33,45),
    '866':(38,36), '870':(31,79), '878':(5,78), '893':(33,32), '931':(11,36),
    '942':(8,61), '943':(7,47), '944':(6,76), '947':(52,50), '949':(43,35),
    '950':(47,46), '954':(50,24), '956':(3,18), '962':(12,58), '973':(31,12),
    '986':(42,46), '993':(27,43), '999':(53,59), '1001':(28,44), '1002':(72,31),
    '1008':(28,31), '1014':(38,28), '1022':(18,56), '1023':(10,26),
    'centiskorch-gmax':(8,43), 'coalossal-gmax':(38,43), 'drednaw-gmax':(27,28),
    'dudunsparce-three-segment':(5,83), 'duraludon-gmax':(55,16),
    'grimmsnarl-gmax':(27,25), 'hatterene-gmax':(31,36), 'machamp-gmax':(40,25),
    'squawkabilly-blue-plumage':(11,36), 'squawkabilly-white-plumage':(11,36),
    'squawkabilly-yellow-plumage':(11,36), 'stunfisk-galar':(45,71)
}
NATIVE_RIGHT = {'1002'}

# For directional sheets that lack published mouth data, use the actual art in
# each direction. Low bodies, long necks and beaks need different height ratios.
DIRECTIONAL_LANDMARKS = {
    '593':(.78,.39), '599':(.56,.50), '600':(.56,.50), '601':(.62,.50),
    '618':(.79,.53), '653':(.88,.36), '683':(.72,.42), '733':(.94,.22),
    '865':(.57,.68), '879':(.88,.49), '929':(.53,.52), '945':(.81,.49),
    '948':(.64,.31), '990':(.60,.52), '1003':(.91,.42), '1020':(.84,.47),
    '1021':(.75,.17), 'alcremie-gmax':(.51,.14), 'charizard-gmax':(.80,.28)
}

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
        if key in chosen:
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
        else:
            fx,fy = FRONT_LANDMARKS[key]
            with Image.open(out/'sprites'/(key+'.png')) as source:
                bounds = silhouette(source.convert('RGBA'),idle,0,0)
            mouth = at_fraction(bounds,fx/100,fy/100)
            body_y = at_fraction(bounds,.5,.5)[1]
            data[key] = {'unit':size,'bodyY':body_y,'frame':0,'mouth':mouth,
                         'front':'right' if key in NATIVE_RIGHT else 'left'}
    # One species per line keeps atlas data changes inspectable.
    entries = [json.dumps(k)+':'+json.dumps(v,separators=(',',':')) for k,v in data.items()]
    (root/'src/game/arena-emitters.json').write_text('{\n'+',\n'.join(entries)+'\n}\n', encoding='utf-8')
