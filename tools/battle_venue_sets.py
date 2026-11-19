"""Connected scenery, terraces, and floor inlays around each battle venue."""
from PIL import Image, ImageDraw
from battle_venue_props import blend, prop


def set_dressing(scene, avg, layout, motifs, accent, trim, rng, resources, mirror=False):
    dark = blend(trim, (27,36,47), .69)
    shade = blend(trim, dark, .48)
    light = blend(accent, (241,231,194), .48)
    ink = blend(avg, dark, .25)
    line = blend(avg, light, .35)
    a = accent
    d = ImageDraw.Draw(scene)
    stencil = Image.new('RGBA', scene.size)
    sd = ImageDraw.Draw(stencil)
    if layout in ('court','ring','runway'):
        bounds=[(35,38),(264,38),(276,54),(276,148),(265,161),(37,161),(24,147),(24,55)]
        sd.polygon(bounds,(*light,21))
        for x in range(33,267,42):
            sd.rectangle((x,60,x+21,146),(*light,12))
    elif layout in ('hall','temple'):
        if layout=='hall':
            top=blend(a,shade,.36)
            sd.polygon([(78,29),(220,29),(255,168),(45,168)],(*top,78))
            for x,y in [(80,47),(217,253)]:
                sd.line([(x,31),(y,166)],(*light,105),2)
            # Motifs in the woven selvedge rather than a flat colored rectangle.
            for i in range(15):
                y=40+i*8; x=round(78-(y-29)*.21)
                for xx in [x,299-x]:
                    sd.line([(xx-2,y),(xx,y-2),(xx+2,y),(xx,y+2),(xx-2,y)],(*light,113))
        else:
            for box in [(35,43,267,161),(39,47,262,157)]:
                sd.rectangle(box,outline=(*light,79))
            for x,y in [(43,50),(243,50),(43,145),(243,145)]:
                sd.line([(x,y),(x+12,y),(x+12,y+5),(x+5,y+5),(x+5,y+11)],(*light,116),2)
    elif layout in ('works','terrace','summit'):
        for y in range(45,166,22):
            for x in range(21+((y//22)%2)*18,269,37):
                sd.line([(x+1,y),(x+26,y)],(*dark,29))
                sd.line([(x+1,y+1),(x+27,y+1)],(*light,30))
                if layout=='works':
                    sd.point((x+3,y+3),(*light,130));sd.point((x+23,y+3),(*light,130))
    elif layout=='garden':
        sd.polygon([(27,87),(72,65),(103,68),(148,88),(204,78),(238,60),(274,60),
                    (271,76),(246,75),(210,95),(148,108),(97,87),(76,83),(32,104)],(*light,43))
    elif layout in ('cavern','island'):
        for _ in range(23):
            x=rng.randrange(35,259);y=rng.randrange(57,150)
            sd.line([(x,y),(x+3,y-1),(x+6,y)],(*dark,34))
    scene.alpha_composite(stencil)

    def sprite(kind,x,y,w,h,flip=False):
        b=prop(kind,a,trim,resources.tiles)
        if flip: b=b.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        scale=min(w/b.width,h/b.height)
        b=b.resize((max(1,round(b.width*scale)),max(1,round(b.height*scale))),Image.Resampling.NEAREST)
        scene.alpha_composite(b,(round(x-b.width/2),round(y-b.height)))

    # Floor-level architecture belongs to the actual motif; it can run under actors.
    if 'pool' in motifs or 'buoy' in motifs or 'waterfall' in motifs:
        if layout != 'island':
            blue=blend(a,(49,134,171),.68)
            for x1,x2 in [(1,19),(280,298)]:
                d.rectangle((x1,32,x2,162),dark)
                d.rectangle((x1+1,33,x2-1,161),blue)
                for y in range(37,160,9):
                    dx=rng.choice([1,3,5]); d.line([(x1+dx,y),(x1+dx+4,y),(x1+dx+7,y-1),(x1+dx+9,y-1)],blend(blue,(196,231,233),.58))
                for y in [61,124]:
                    d.rectangle((x1+1,y,x2-1,y+4),shade)
                    d.line([(x1+2,y),(x2-1,y)],light)
            if 'buoy' in motifs:
                for y in [47,153]:
                    for x in range(24,278,6):
                        d.rectangle((x,y,x+3,y+1),(223,217,191) if x%4 else (198,100,80))
            if 'waterfall' in motifs:
                for x in [18,110,185,279]:
                    sprite('waterfall',x,25,37,24, x%2==0)
        else:
            for y in [57,103,134]:
                for x in [37+(y%7),172+y%14,236-y%17]:
                    d.line([(x,y),(x+4,y-1),(x+9,y),(x+12,y-1)],blend(avg,(202,228,225),.33))
    if set(motifs) & {'tree','flower','greenhouse','mushroom','web','honeycomb'}:
        if layout=='garden' or 'greenhouse' in motifs:
            for x in range(-1,301,18):
                h=rng.randrange(12,23);sprite('tree',x,14+rng.randrange(3),int(h*.85),h, bool(x%2))
            for x1,x2 in [(0,17),(282,299)]:
                for y in range(52,158,14):
                    col=blend(trim,(67,125,71),.75)
                    d.ellipse((x1-3,y-5,x2+3,y+7),blend(col,dark,.28))
                    d.ellipse((x1-3,y-6,x2+1,y+3),col)
                    for _ in range(5):
                        xx=rng.randrange(x1,x2+1);yy=y+rng.randrange(-3,4)
                        d.point((xx,yy),light if 'flower' in motifs else blend(col,(157,189,115),.5))
        if 'web' in motifs:
            sprite('web',10,48,26,26);sprite('web',290,67,27,26,True)
        if 'honeycomb' in motifs:
            for x in range(8,300,29):sprite('honeycomb',x,18,28,18)
    if set(motifs) & {'boulder','fossil','mine-cart','climbing-wall','snowball','ice','ice-crystal','crystal','lava','volcano'}:
        if layout in ('cavern','summit','island'):
            is_icy=bool(set(motifs)&{'ice','ice-crystal','snowball'})
            for x in range(-2,307,13):
                height=rng.randrange(8,20); kind='ice' if is_icy else 'boulder'
                sprite(kind,x,14+rng.randrange(5),17,height, bool(x%3))
            for x in [3,293]:
                for y in [60,109,150]:
                    sprite('ice-crystal' if is_icy else 'boulder',x+rng.randrange(4),y,rng.randrange(13,21),13)
        if 'mine-cart' in motifs or 'fossil' in motifs and layout=='cavern':
            for side in [0,1]:
                x=23 if not side else 277
                for y in range(52,159,7):
                    d.line([(x-4,y),(x+3,y+1)],blend(trim,(95,75,61),.62),2)
                for k in [-2,2]:
                    d.line([(x+k,51),(x+k,158)],blend(shade,(134,145,142),.7))
        if set(motifs)&{'lava','volcano'}:
            for side in [0,1]:
                x=3 if side==0 else 288
                pts=[(x,29),(x+6,44),(x+2,65),(x+11,79),(x+6,98),(x+9,119),(x,150)]
                d.line(pts,(130,66,57),6);d.line(pts,(233,107,52),3);d.line(pts,(255,181,76))
    if set(motifs)&{'book','bookcase','sushi','shelf','oven'} and layout not in ('cavern','summit'):
        # Continuous back counter with room for the two larger story props.
        d.rectangle((0,0,299,19),blend(trim,(102,76,61),.6))
        for x in range(-2,306,38):
            kind='bookcase' if 'bookcase' in motifs or 'book' in motifs else 'shelf'
            sprite(kind,x+18,19,35,20)
        d.rectangle((0,20,299,24),shade);d.line([(0,20),(299,20)],light,2)
        if 'sushi' in motifs or 'oven' in motifs:
            for x in range(7,299,13):
                d.polygon([(x,0),(x+9,0),(x+9,7),(x+5,9),(x,7)],a)
                d.line([(x+2,3),(x+6,3)],light)
            for x in [38,48,58,240,250,260]:
                d.ellipse((x-3,158,x+3,161),shade);d.line([(x,161),(x,164)],dark)
    if set(motifs)&{'stage-speaker','spotlight','drum'}:
        truss=blend(trim,(70,78,96),.64)
        for x in range(0,300,11):
            d.line([(x,4),(x+6,11),(x+11,4)],truss)
        d.line([(0,3),(299,3)],dark,2);d.line([(0,11),(299,11)],truss)
        for x in range(9,298,28):
            d.rectangle((x-2,10,x+2,13),dark);d.line([(x-2,14),(x+2,14)],light)
        for x in [0,295]:
            d.rectangle((x,20,x+4,99),truss)
            for y in range(20,94,7):d.line([(x,y),(x+4,y+3),(x,y+7)],light)
        for x in [12,23,276,287]:sprite('stage-speaker',x,37,10,17)
        glows=Image.new('RGBA',scene.size);gd=ImageDraw.Draw(glows)
        for x,shift in [(24,36),(77,-18),(220,21),(284,-35)]:
            gd.polygon([(x,15),(x+2,15),(x+shift+17,89),(x+shift-14,89)],(*light,27))
        scene.alpha_composite(glows)
    if set(motifs)&{'lightning-coil','gear','turbine','steel-beam','furnace','conveyor'} and layout in ('works','hall','court'):
        for y in [13,169]:
            d.line([(0,y),(32,y),(42,y+5),(75,y+5)],dark,3)
            d.line([(0,y-1),(31,y-1),(42,y+4),(75,y+4)],light)
            d.line([(225,y+4),(269,y+4),(280,y),(299,y)],shade,3)
        for x in range(0,300,21):
            d.rectangle((x+2,1,x+15,7),dark)
            for k in range(4):d.line([(x+4+k*3,2),(x+4+k*3,6)],trim)
        if 'lightning-coil' in motifs:
            for x in [8,94,207,293]:sprite('lightning-coil',x,24,14,22)
    if set(motifs)&{'sail','wind-sock','windmill','snow-flags'} and layout in ('runway','dock','summit','terrace'):
        for y in [40,160]:
            for x in range(25,278,11):
                d.rectangle((x,y,x+2,y+2),shade);d.point((x+1,y),light)
        if layout=='runway':
            for x in range(40,266,17):
                d.line([(x,93),(x+6,93)],line,2)
            for x in [19,24,29,263,268,273]:
                d.rectangle((x,83,x+2,117),line)
    if 'warp-pad' in motifs or 'stars' in motifs or 'telescope' in motifs:
        for x in [13,277]:
            for y in [59,93,128]:
                d.polygon([(x-8,y),(x,y-4),(x+8,y),(x,y+4)],shade)
                d.line([(x-5,y),(x,y-2),(x+5,y),(x,y+2),(x-5,y)],light)
        for _ in range(25):
            x=rng.randrange(5,294);y=rng.choice([rng.randrange(1,24),rng.randrange(163,185)])
            d.point((x,y),light)
    if set(motifs)&{'castle','crown','columns','pillar','dragon','dojo','bell'} and layout in ('hall','temple','ring','terrace'):
        for x in [5,93,207,294]:
            if 'dojo' in motifs or 'bell' in motifs:
                d.rectangle((x-2,4,x+1,26),shade);d.line([(x-2,5),(x-2,24)],light)
            else:sprite('pillar',x,28,12,24)
    if 'snow-flags' in motifs or 'snowball' in motifs:
        for _ in range(65):
            x=rng.randrange(299);y=rng.choice([rng.randrange(15,46),rng.randrange(147,186)])
            d.line([(x,y),(x+1,y)],blend(avg,(241,248,245),.68))

    if 'stadium-screen' in motifs:
        turf=Image.new('RGBA',scene.size); td=ImageDraw.Draw(turf)
        for i in range(6):
            td.rectangle((22+i*43,41,64+i*43,156), fill=(*((98,167,112) if i%2 else (162,204,151)),65))
        td.line([(23,42),(277,42),(277,156),(23,156),(23,42)],(226,237,203,163),2)
        td.line([(149,43),(149,155)],(223,235,202,116))
        td.ellipse((128,82,171,116),outline=(224,237,201,151),width=2)
        for x in (23,250):
            td.rectangle((x,77,x+26,122),outline=(226,237,203,122))
        scene.alpha_composite(turf)
    if 'telescope' in motifs or 'stars' in motifs:
        sky=Image.new('RGBA',scene.size);sd=ImageDraw.Draw(sky)
        sd.ellipse((71,65,230,139),outline=(*light,80),width=1)
        sd.ellipse((90,50,210,151),outline=(*light,65))
        for x,y,n in [(81,88,4),(198,73,3),(151,149,2)]:
            sd.ellipse((x-n,y-n,x+n,y+n), fill=(*accent,90),outline=(*light,115))
        scene.alpha_composite(sky)
