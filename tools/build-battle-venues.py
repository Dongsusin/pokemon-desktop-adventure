"""Build region/trainer venue PNGs using the released Pokémon Resonance v3.0.0 app.asar."""
import argparse
import io
import json
import math
import random
import struct
import zlib
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageColor, ImageDraw, ImageEnhance, ImageStat, ImageOps
from battle_venue_sets import set_dressing
from battle_venue_special import dress_special
from battle_venue_props import prop, blend

ROOT = Path(__file__).resolve().parents[1]
W, H = 300, 190
NEAR = Image.Resampling.NEAREST
LAYOUTS = {'court','hall','terrace','island','ring','runway','garden','cavern','dock','works','temple','summit'}


class Resources:
    def __init__(self, archive):
        self.stream = archive.open('rb')
        header = struct.unpack('<4I', self.stream.read(16))
        self.files = json.loads(self.stream.read(header[3]))['files']
        self.offset = 8 + header[1]
        self.arenas = json.loads(self.read('dist/data/arenas.json'))['arenas']

    def read(self, path):
        entry = {'files': self.files}
        for part in path.split('/'):
            entry = entry['files'][part]
        self.stream.seek(self.offset + int(entry['offset']))
        return self.stream.read(entry['size'])

    @lru_cache(maxsize=60)
    def picture(self, path):
        return Image.open(io.BytesIO(self.read(path))).convert('RGBA')

    def tiles(self, name, index, w, h):
        # The converted RPG tilesets repack each source row of 8 cells into 64 across.
        sheet = self.picture('assets/Overworld/tilesets/' + name + '.png')
        out = Image.new('RGBA', (w*32, h*32))
        for y in range(h):
            for x in range(w):
                tile = index + y*8 + x
                px, py = tile%64*32, tile//64*32
                out.paste(sheet.crop((px,py,px+32,py+32)), (x*32,y*32))
        return out

    @lru_cache(maxsize=60)
    def ground(self, key):
        image = self.picture('assets/Arenas/' + key + '.png')
        a,b,c,d = self.arenas[key]['field']
        if key == 'sea':
            # Water battles share the original water, not the source training arena's square sand platforms.
            cells = [image.crop((x,y,x+32,y+32)).convert('RGB') for y in range(round(b),round(d)-32,32) for x in range(round(a),round(c)-32,32)]
            from collections import Counter
            counts = Counter(cell.tobytes() for cell in cells)
            water_tile = max(cells, key=lambda cell: counts[cell.tobytes()]).resize((9,9),NEAR)
            sea = Image.new('RGB',(W,H))
            for y in range(0,H,9):
                for x in range(0,W,9): sea.paste(water_tile,(x,y))
            return sea
        # Keep a strip of the original rim and the native tile pattern of the center.
        mx,my = round((c-a)*.036),round((d-b)*.043)
        return image.crop((round(a)-mx,round(b)-my,round(c)+mx,round(d)+my)).convert('RGB').resize((W,H),NEAR)


def octagon(box, cut):
    x,y,w,h=box
    return [(x+cut,y),(x+w-cut,y),(x+w,y+cut),(x+w,y+h-cut),(x+w-cut,y+h),
            (x+cut,y+h),(x,y+h-cut),(x,y+cut),(x+cut,y)]


def water(draw, rect, blue, rng):
    x,y,right,bottom=rect
    if right<=x or bottom<=y:
        return
    deep=blend(blue,(27,82,128),.53); light=blend(deep,(171,226,225),.48)
    draw.rectangle(rect,deep)
    for row in range(y+3,bottom,7):
        for col in range(x-1+rng.randrange(9),right,18):
            draw.line([(max(x,col),row),(min(right,col+3),row),(min(right,col+4),row-1),(min(right,col+8),row-1)],light)


def railing(draw, y, color, shade, x1=0, x2=299):
    for row,ink in [(y+1,shade),(y,color),(y+4,shade)]:
        draw.line([(x1,row),(x2,row)],ink)
    for x in range(x1+2,x2,13):
        draw.rectangle((x,y-2,x+2,y+6),shade);draw.point((x,y-2),color)


def stamp(image, piece, x, y, width, height, flip=False):
    piece=piece.copy()
    if flip:
        piece=piece.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    ratio=min(width/piece.width,height/piece.height)
    piece=piece.resize((max(1,round(piece.width*ratio)),max(1,round(piece.height*ratio))),NEAR)
    ix=round(x-piece.width/2);iy=round(y-piece.height)
    alpha=piece.getchannel('A')
    shadow=Image.new('RGBA',piece.size,(31,34,44,0));shadow.putalpha(alpha.point(lambda a:a*67//255))
    image.alpha_composite(shadow,(ix+2,iy+2))
    image.alpha_composite(piece,(ix,iy))


def surface(scene, source, layout, a, t, motifs, region, rng):
    d=ImageDraw.Draw(scene)
    avg=tuple(round(x) for x in ImageStat.Stat(source.crop((70,47,230,145))).mean[:3])
    dark=blend(t,(26,38,53),.65); shade=blend(t,dark,.45);light=blend(a,(238,231,199),.44)
    stripe=blend(avg,light,.23); inset=blend(avg,shade,.22)
    is_sport=region=='galar' and 'stadium-screen' in motifs
    if layout in ('court','runway','ring') or is_sport:
        d.line(octagon((17,34,265,134),12),stripe,2)
        d.line(octagon((21,37,257,128),11),inset)
        if layout=='runway':
            for x in range(25,280,20):
                d.rectangle((x,56,x+8,57),stripe);d.rectangle((x,146,x+8,147),stripe)
            for x,dirx in [(33,1),(266,-1)]:
                for y in range(73,139,15):
                    d.line([(x,y),(x+dirx*6,y+4),(x,y+8)],stripe,2)
        else:
            d.ellipse((126,82,174,123),outline=stripe)
            d.line([(149,39),(149,82)],stripe);d.line([(149,124),(149,164)],stripe)
            d.arc((25,78,70,130),276,85,fill=stripe,width=1)
            d.arc((230,78,275,130),95,265,fill=stripe,width=1)
        if layout=='ring':
            for y in (31,168):railing(d,y,a,dark,17,282)
            for x in (18,278):
                d.rectangle((x,35,x+2,166),shade)
                for y in [32,165]:d.rectangle((x-3,y,x+4,y+4),a)
    if layout in ('hall','temple','works'):
        d.rectangle((0,0,299,23),shade)
        for y,ink in [(3,light),(14,t),(21,dark),(23,light),(25,shade)]:
            d.line([(0,y),(299,y)],ink)
        for x in range(-5,300,21):
            d.rectangle((x,5,x+17,11),dark)
            d.line([(x+1,6),(x+14,6)],t)
            d.line([(x+3,17),(x+16,17)],t)
        if layout in ('hall','temple'):
            for x in [19,24,275,280]:d.line([(x,26),(x,177)],stripe)
            for y in [68,72,134,138]:
                d.line([(21,y),(39,y)],stripe);d.line([(261,y),(278,y)],stripe)
            if layout=='temple':
                for y in [37,42,47,165,169]:
                    d.line([(66,y),(233,y)],stripe)
                for x in range(72,232,14):
                    d.line([(x,42),(x+7,37),(x+14,42)],inset)
        else:
            for x in [12,286]:
                for y in range(44,158,6):
                    d.rectangle((x-4,y,x+3,y+3),shade);d.line([(x-3,y+1),(x+1,y+1)],light)
            for y in [38,166]:
                for x in range(24,281,12):
                    d.line([(x,y+1),(x+3,y-2)],stripe,2)
            d.line([(25,50),(38,50),(48,60),(84,60)],stripe)
            d.line([(216,147),(251,147),(261,137),(275,137)],stripe)
    if layout in ('dock','island'):
        sea=blend(a,(61,158,190),.65)
        if layout=='dock':
            water(d,(0,1,299,23),sea,rng);water(d,(0,175,299,189),sea,rng)
            for y in [24,170]:
                d.rectangle((0,y,299,y+4),shade)
                for x in range(0,300,7):
                    d.line([(x,y),(x,y+3)],dark);d.point((x+2,y),light)
            for x in range(13,300,34):
                for y in [24,171]:
                    d.rectangle((x-2,y-4,x+2,y+4),dark);d.rectangle((x-2,y-4,x+1,y-2),light)
            # Swimming pools have recognizable lane floats; a ship deck has timber seams.
            if 'pool' in motifs or 'buoy' in motifs:
                for y in [55,146]:
                    for x in range(25,278,6):
                        d.line([(x,y),(x+3,y)],stripe if x%4 else inset,2)
            else:
                for y in range(42,166,15):
                    for x in range(29+(y%9),280,43):d.line([(x,y),(x+15,y)],inset)
        else:
            mask=Image.new('L',(W,H));md=ImageDraw.Draw(mask);edgepts=[]
            for i in range(64):
                angle=i*math.tau/64
                u,v=math.cos(angle),math.sin(angle)
                px=math.copysign(abs(u)**.65,u)*139;py=math.copysign(abs(v)**.65,v)*77
                edgepts.append((int(150+px+rng.randrange(-2,3)),int(100+py+rng.randrange(-1,2))))
            md.polygon(edgepts,255)
            sea_picture=Image.new('RGBA',scene.size);water(ImageDraw.Draw(sea_picture),(0,0,W-1,H-1),sea,rng)
            sea_picture.paste(scene,(0,0),mask);scene.paste(sea_picture,(0,0));d=ImageDraw.Draw(scene)
            d.line(edgepts+[edgepts[0]],light,3);d.line(edgepts+[edgepts[0]],shade)
    if layout in ('garden','terrace'):
        for y in (3,169):
            for x in range(-4,300,55):
                d.rectangle((x,y,x+52,y+16),shade)
                d.rectangle((x+1,y+1,x+50,y+8),blend(a,(67,121,69),.63) if layout=='garden' else t)
                d.line([(x+1,y+13),(x+50,y+13)],light)
                if layout=='garden':
                    for i in range(13):
                        xx=x+rng.randrange(2,48); yy=y+rng.randrange(1,10)
                        d.ellipse((xx,yy,xx+3,yy+2),[(84,144,75),(125,160,83),light][i%3])
                else:
                    for xx in range(x+4,x+48,8):d.line([(xx,y+2),(xx,y+8)],shade)
        if layout=='garden':
            for y in [39,154]:
                for dx in [8,35,66,214,243,270]:
                    d.arc((dx,y-4,dx+23,y+5),4,174,stripe)
        else:
            for x in [13,282]:
                for yy in range(49,158,6):d.line([(x,yy),(x+4,yy)],stripe)
    if layout in ('cavern','summit'):
        stone=blend(t,avg,.35)
        for band,sign in [(0,1),(187,-1)]:
            pts=[(-2,band+sign*12)]
            for x in range(0,312,9): pts.append((x,band+sign*rng.randrange(5,19)))
            d.polygon([(-2,band),(306,band)]+list(reversed(pts)),stone)
            d.line(pts,blend(stone,dark,.6),2)
            for (x,y),(xx,yy) in zip(pts,pts[1:]):
                if rng.randrange(3):d.line([(x,y-sign*3),(xx-1,yy-sign*3)],blend(stone,light,.32))
        for side in [0,1]:
            x=(20 if not side else 280);s=1 if not side else -1
            for _ in range(10):
                xx=x+rng.randrange(0,20)*s; yy=rng.randrange(53,150)
                d.line([(xx,yy),(xx+4*s,yy),(xx+7*s,yy-2)],inset,1)
    if is_sport:
        crowd_colors=[blend(dark,c,.63) for c in [a,(141,165,183),(200,125,105),(196,169,107)]]
        d.rectangle((0,0,299,22),dark)
        for y in [4,11,18]:
            for x in range(1+(y%3)*2,300,7):
                d.rectangle((x,y,x+2,y+1),crowd_colors[rng.randrange(4)]);d.rectangle((x-1,y+2,x+3,y+3),shade)
        railing(d,22,light,dark,0,299)


def draw_venue(res, region, trainer, spec):
    layout=spec['layout']; motifs=spec['motifs']
    if layout not in LAYOUTS or not 2 <= len(motifs) <= 3:
        raise ValueError((region,trainer,spec))
    a,t=map(ImageColor.getrgb,spec['colors'])
    rng=random.Random(zlib.crc32((region+'/'+trainer).encode()))
    base=res.ground(spec['ground'])
    # Transfer each venue's palette onto the original tile luminance, then bring some
    # material color back. The same wooden hall can read as a shrine, club, or eatery.
    shade=blend(t,(27,35,48),.64); hi=blend(a,(231,228,207),.68)
    generic=spec['ground'] in {'indoor','league','lab','cave','mountain'}
    weight=.59 if generic else .29
    if set(motifs)&{'stage-speaker','spotlight'}: shade=blend((20,22,48),a,.14);hi=blend((125,133,157),a,.36);weight=.74
    if trainer in ('alola-mimikyu','johto-morty','agatha','sinnoh-fantina','unova-shauntal'):hi=blend((119,138,145),a,.32);weight=.72
    if region=='galar' and 'stadium-screen' in motifs:
        shade=blend((28,65,66),a,.25);hi=blend((138,187,138),a,.45);weight=.82
    tinted=ImageOps.colorize(ImageOps.grayscale(base),shade,hi)
    base=Image.blend(base,tinted,weight)
    base=ImageEnhance.Contrast(base).enhance(.84)
    scene=base.convert('RGBA')
    surface(scene,base,layout,a,t,motifs,region,rng)
    avg=tuple(round(v) for v in ImageStat.Stat(base.crop((62,54,238,146))).mean)
    set_dressing(scene,avg,layout,motifs,a,t,rng,res)
    dress_special(scene,region,trainer,spec,a,t,avg)
    d=ImageDraw.Draw(scene)
    pieces=[prop(k,a,t,res.tiles) for k in motifs]
    # Scenic silhouettes remain visible with the live camera zoomed in.
    # Offset the two wings instead of mirroring the whole arena.
    offset=rng.choice([-7,-3,0,3,7])
    left,right=61+offset,241+offset
    if layout in ('island','summit','cavern'):
        stamp(scene,pieces[1],left-25,38,31,26,True)
        stamp(scene,pieces[0],left+4,47,51,35)
        stamp(scene,pieces[-1],right,39,49,35)
        stamp(scene,pieces[0],right+25,49,24,17,True)
        stamp(scene,pieces[-1],22,171,33,26,True);stamp(scene,pieces[1],269,175,37,26)
    elif layout in ('hall','temple','works'):
        stamp(scene,pieces[0],left,48,50,39)
        stamp(scene,pieces[1],right,45,50,36)
        stamp(scene,pieces[-1],22,163,34,30);stamp(scene,pieces[-1],276,168,31,27,True)
        stamp(scene,pieces[1],21,32,24,20,True);stamp(scene,pieces[0],280,36,24,21)
    else:
        stamp(scene,pieces[0],left,46,49,38)
        stamp(scene,pieces[1],right,48,50,38)
        stamp(scene,pieces[-1],30,174,36,28,True);stamp(scene,pieces[-1],272,172,39,30)
        if len(pieces)==3:stamp(scene,pieces[2],right+37,32,22,20)
    if 'badge' in spec:
        badge=Image.open(ROOT/'assets/maps'/region/'gym-badges.png').convert('RGBA')
        index=spec['badge']
        if not (isinstance(index,int) and 0<=32*index+31<badge.height):
            raise ValueError((region,trainer,'badge index',index))
        emblem=badge.crop((0,index*32+16,16,index*32+32))
        if region == 'kanto':
            lum=ImageOps.grayscale(emblem)
            emblem=ImageOps.colorize(lum,blend(a,(68,54,44),.53),blend(a,(255,246,213),.8)).convert('RGBA')
            emblem.putalpha(lum.point(lambda value: 0 if value==255 else 255))
        edge=blend(t,(26,33,42),.6);highlight=blend(a,(237,232,214),.35)
        # A freestanding gym crest marks the platform at the far end.
        d.polygon([(137,4),(162,4),(161,16),(150,23),(138,17)],edge)
        d.line([(138,5),(161,5)],highlight)
        scene.alpha_composite(emblem,(142,4))
        # A tone-on-tone floor crest is recognizable through camera zoom without
        # competing with the arena's projected skill footprints.
        crest=emblem.resize((32,22),NEAR)
        layer=Image.new('RGBA',crest.size,blend(avg,highlight,.47))
        layer.putalpha(crest.getchannel('A').point(lambda n:n//3))
        scene.alpha_composite(layer,(134,91))
    return scene.convert('RGB').resize((600,380),NEAR)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive',type=Path)
    args=parser.parse_args()
    resources=Resources(args.archive)
    out=ROOT/'assets/battle/venues'
    manifest={}
    for source in sorted((ROOT/'tools/data/battle-venues').glob('*.json')):
        region=source.stem;specs=json.loads(source.read_text(encoding='utf8'))
        (out/region).mkdir(parents=True,exist_ok=True)
        manifest[region]={}
        for trainer,spec in specs.items():
            scene=draw_venue(resources,region,trainer,spec)
            scene.save(out/region/(trainer+'.png'),optimize=True)
            manifest[region][trainer]=spec['name']
    path=ROOT/'src/renderer/battle-venues.json'
    path.write_bytes((json.dumps(manifest,indent=2,ensure_ascii=False)+'\n').encode('utf8'))
    resources.stream.close()
    print(f'{sum(map(len,manifest.values()))} venues across {len(manifest)} regions')


if __name__ == '__main__':
    main()
