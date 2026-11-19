"""Pixel scenery for the perimeter of the playable arena. Coordinates are native pixels."""
from math import cos, sin, pi
from PIL import Image, ImageDraw


def blend(a, b, t):
    return tuple(round(a[i] * (1-t) + b[i] * t) for i in range(3))


class Stamp:
    def __init__(self):
        self.image = Image.new("RGBA", (64, 52))
        self.d = ImageDraw.Draw(self.image)
        self.r = self.d.rectangle
        self.p = self.d.polygon
        self.e = self.d.ellipse
        self.l = self.d.line

    def block(self, xy, face, top, shadow):
        x, y, w, h = xy
        self.r((x, y, x+w, y+h), shadow)
        self.r((x+1, y, x+w-2, y+h-2), face)
        self.r((x+1, y, x+w-2, y+2), top)

    def tile(self, native, sheet, index, w, h, box):
        source = native(sheet, index, w, h)
        source.thumbnail(box[2:], Image.Resampling.NEAREST)
        self.image.alpha_composite(source, box[:2])


def prop(kind, accent, trim, native):
    s = Stamp()
    r, p, e, l, block = s.r, s.p, s.e, s.l, s.block
    edge = blend(trim, (18, 26, 45), .73)
    shade = blend(trim, edge, .46)
    mid = blend(trim, accent, .35)
    lit = blend(accent, (255, 245, 216), .48)
    white = (225, 234, 222)
    steel = (124, 150, 161)
    metal = (69, 87, 106)
    cyan = (89, 190, 205)
    gold = (235, 185, 83)
    wood = (151, 101, 65)
    leaf = (62, 133, 83)
    pale = (177, 218, 129)
    if kind == 'boulder':
        s.tile(native, 'Caves_0', 329, 1, 1, (1,26,24,24))
        s.tile(native, 'Caves_0', 330, 2, 1, (12,12,45,36))
        s.tile(native, 'Caves_0', 328, 1, 1, (43,29,20,20))
    elif kind == 'fossil':
        block((4,38,55,10), shade, lit, edge)
        # Original Pewter Museum glass display with the coiled fossil.
        s.tile(native, 'Museum_interior_0', 68, 2, 2, (7,2,47,39))
        l([(9,40),(49,40)],white); r((26,43,39,45),gold)
    elif kind == 'tree':
        s.tile(native, 'Outdoor_0', 109, 3, 5, (13,0,42,51))
    elif kind == 'flower':
        block((3,39,57,9),wood,lit,edge)
        for x,y in [(8,31),(17,24),(25,34),(34,19),(44,30),(54,24)]:
            l([(x,y+2),(x,38)],leaf,2)
            p([(x,y+10),(x-6,y+6),(x-3,y+12),(x,y+13)],pale)
            for dx,dy in [(0,-3),(3,0),(-3,0),(0,3)]:
                e((x+dx-3,y+dy-2,x+dx+2,y+dy+3),accent if x%2 else lit)
            r((x-1,y-1,x+1,y+1),gold)
        l([(7,44),(56,44)],shade)
    elif kind == 'greenhouse':
        p([(4,22),(13,9),(42,1),(59,17),(59,43),(4,47)],edge)
        p([(6,23),(15,11),(41,4),(55,17),(54,39),(6,43)],(91,164,151))
        p([(15,11),(41,4),(50,11),(24,17)],(182,223,198))
        r((7,34,53,40),(65,112,81))
        for x in [12,21,29,40,48]:
            e((x-4,29-(x%3),x+5,39),(112,162,86))
        for x,y in [(12,13),(22,10),(32,7),(43,7)]:
            l([(x,y),(x+9,y+9),(x+9,41)],edge,2)
        l([(5,24),(55,16)],white);block((4,44,55,4),wood,lit,edge)
    elif kind in ('ice-crystal','crystal','ice','lava','volcano'):
        if kind=='ice':
            block((3,36,55,11),(128,178,202),white,metal)
            for x,y in [(3,32),(11,20),(24,27),(39,15),(49,26)]:
                p([(x,y+11),(x+7,y),(x+14,y+8),(x+15,37),(x,39)],(169,215,231))
                p([(x+7,y),(x+10,y+9),(x+15,y+8)],white)
        elif kind in ('lava','volcano'):
            p([(2,45),(9,32),(16,32),(25,15),(31,11),(39,13),(45,27),(51,30),(62,45)],edge)
            p([(7,43),(20,28),(28,15),(38,15),(48,31),(59,44)],(107,70,61))
            p([(14,41),(26,22),(33,17),(40,25),(34,24),(29,31),(25,31),(26,37)],(156,91,65))
            p([(27,15),(33,12),(39,15),(34,18),(37,25),(30,30),(32,42),(28,44),(26,29),(32,23)],(236,106,50))
            l([(29,15),(34,15),(35,19)],(255,213,94),2)
            for x,y in [(33,4),(25,7),(36,10)]:r((x,y,x+1,y+2),gold)
        else:
            for x,y,w,h in [(11,20,13,22),(23,4,18,39),(38,16,16,29)]:
                p([(x,y+8),(x+w//2,y),(x+w,y+8),(x+w-2,y+h-4),(x+w//2,y+h),(x+1,y+h-7)],edge)
                p([(x+2,y+9),(x+w//2,y+2),(x+w//2,y+h-2),(x+2,y+h-7)],lit if kind=='crystal' else (201,237,249))
                p([(x+w//2,y+2),(x+w-2,y+9),(x+w-3,y+h-6),(x+w//2,y+h-2)],accent if kind=='crystal' else (93,179,219))
                l([(x+3,y+10),(x+w//2,y+7),(x+w-2,y+10)],white)
    elif kind in ('pool','wave','waterfall'):
        if kind=='waterfall':
            block((4,7,54,39),(89,112,107),pale,edge)
            p([(12,10),(48,10),(53,40),(38,49),(8,43)],(68,150,190))
            for x,dy in [(14,0),(20,4),(26,0),(30,6),(37,2),(43,3)]:
                l([(x,10),(x+1,23+dy),(x+2,37+dy)],(214,241,231) if x%3 else cyan,2)
            for x in range(10,50,6):e((x,38-(x%4),x+9,45),white)
        else:
            e((1,23,61,47),edge);e((3,21,59,43),steel);e((5,22,57,40),(66,154,180))
            for x,y in [(7,31),(24,25),(37,33),(26,35)]:l([(x,y),(x+6,y-1),(x+12,y)],(171,224,221),2)
            if kind=='wave':
                p([(6,33),(15,22),(20,15),(29,10),(39,12),(42,16),(34,14),(29,19),(31,24),(42,32),(50,34)],cyan)
                l([(8,31),(22,15),(30,11),(39,12),(42,16)],white,3)
    elif kind in ('buoy','wind-sock','banner','snow-flags'):
        if kind=='buoy':
            e((10,41,52,48),(66,124,151));e((14,36,49,44),edge)
            p([(18,39),(23,24),(28,19),(37,19),(41,24),(45,39)],(221,76,65))
            r((22,28,41,32),white);r((30,8,34,23),shade)
            e((28,7,36,14),gold);l([(15,42),(48,42)],white)
        elif kind=='wind-sock':
            block((11,10,4,37),steel,white,edge);r((6,46,20,49),shade)
            p([(14,11),(23,8),(56,13),(55,19),(24,23),(15,19)],edge)
            p([(16,12),(23,10),(55,14),(54,17),(23,21),(16,18)],(230,101,67))
            for x in [26,39]:p([(x,11),(x+5,11),(x+5,19),(x,20)],white)
        else:
            cords=[(14,4),(44,13)] if kind=='snow-flags' else [(31,1)]
            for x,y in cords:
                block((x-2,y+2,3,44-y),wood,lit,edge);r((x-6,46,x+5,48),shade)
                if kind=='banner':
                    l([(x-15,5),(x+17,5)],gold,3)
                    p([(x-12,7),(x+13,7),(x+13,33),(x,41),(x-12,33)],edge)
                    p([(x-10,7),(x+10,7),(x+10,31),(x,37),(x-10,31)],accent)
                    p([(x,12),(x+6,19),(x,26),(x-6,19)],lit)
                else:p([(x+2,y+3),(x+15,y+8),(x+2,y+14)],accent)
    elif kind in ('book','bookcase','shelf','sushi','oven'):
        if kind in ('book','bookcase','shelf'):
            block((7,7,50,41),wood,lit,edge)
            for y in [12,25,38]:
                r((10,y,53,y+7),shade)
                if kind=='shelf':
                    for x in range(12,51,8):
                        r((x,y+2,x+5,y+7),[cyan,gold,accent][(x+y)%3]);r((x+1,y,x+4,y+2),lit)
                else:
                    for i,x in enumerate(range(12,52,5)):
                        h=[6,8,7,5][(i+y)%4];r((x,y+7-h,x+3,y+7),[accent,(110,152,125),(172,89,75),gold,steel][(i*2+y)%5]);r((x,y+5,x+3,y+5),lit)
                l([(9,y+9),(54,y+9)],lit)
        elif kind=='sushi':
            block((2,25,59,22),wood,lit,edge);r((4,22,58,27),white);r((8,31,55,42),(111,78,61))
            for x in [11,23,35,47]:e((x-5,19,x+6,24),shade);e((x-4,17,x+5,22),white);r((x-3,17,x+4,19),(218,125,87))
            l([(5,10),(59,10)],edge,2)
            for x in [8,20,32,44]:r((x,6,x+9,13),accent);r((x+2,7,x+5,9),lit)
        else:
            block((9,8,47,40),(156,109,90),lit,edge)
            for y in [16,23,30,37]:l([(11,y),(53,y)],shade)
            for y in [9,24,38]:
                for x in [19,34,48]:l([(x,y),(x,y+6)],shade)
            e((21,18,46,43),edge);r((21,31,46,43),edge)
            p([(24,39),(27,32),(30,35),(33,26),(36,35),(40,32),(42,39)],(235,130,57))
            block((8,43,48,5),steel,white,edge)
    elif kind in ('conveyor','bridge','steel-beam','rail','mine-cart'):
        if kind=='mine-cart':
            for y in [38,46]:l([(0,y),(63,y-3)],metal,3)
            for x in range(2,61,10):l([(x,39),(x+4,48)],wood,3)
            for x in [17,40]:e((x-5,37,x+5,47),edge);e((x-2,40,x+2,44),steel)
            p([(5,20),(55,17),(49,36),(15,40)],edge)
            p([(9,23),(51,20),(46,33),(17,36)],metal)
            for x,y in [(18,14),(29,9),(39,13)]:p([(x-7,21),(x-5,y),(x+1,y-3),(x+7,y+3),(x+8,21)],mid)
            l([(6,22),(54,19)],lit,3)
        elif kind=='steel-beam':
            for x in [5,52]:block((x,5,7,43),metal,steel,edge)
            block((4,6,56,8),metal,white,edge);block((4,37,56,6),metal,steel,edge)
            for x in range(10,52,14):l([(x,36),(x+7,16),(x+14,36)],steel,3)
        elif kind=='bridge':
            block((1,27,61,16),wood,lit,edge)
            for x in range(4,60,7):l([(x,28),(x,40)],shade)
            for x in [3,23,42,60]:block((x-2,16,3,20),wood,lit,edge)
            l([(1,18),(62,18)],shade,3);l([(1,21),(62,21)],lit)
        else:
            p([(1,22),(51,19),(62,25),(62,38),(10,42),(1,35)],edge)
            p([(3,23),(51,22),(60,26),(12,31)],steel)
            p([(9,32),(60,27),(59,36),(12,39)],metal)
            for x in range(13,57,9):e((x,31-(x//24),x+4,35-(x//24)),lit)
            for x in range(9,51,9):l([(x,24),(x+7,28)],shade,2)
    elif kind in ('lightning-coil','turbine','gear','windmill'):
        if kind=='lightning-coil':
            block((7,41,49,7),metal,white,edge);block((24,13,15,29),shade,steel,edge)
            for y in [14,20,26,32,38]:e((14,y-3,48,y+4),edge);e((15,y-4,47,y+1),gold)
            e((22,2,40,14),edge);e((24,2,38,10),lit)
            l([(43,7),(49,11),(44,14),(55,17)],cyan,2)
        elif kind=='windmill':
            p([(17,47),(25,17),(38,17),(47,47)],edge);p([(20,45),(26,18),(36,18),(43,45)],wood)
            block((28,33,8,13),shade,gold,edge)
        else:block((15,35,35,12),metal,steel,edge)
        if kind in ('turbine','gear','windmill'):
            cx,cy=31,22
            if kind=='gear':
                for i in range(8):
                    a=i*pi/4; x=round(cx+16*cos(a));y=round(cy+16*sin(a));r((x-4,y-4,x+4,y+4),metal)
                e((13,4,49,40),edge);e((16,6,46,36),steel);e((24,14,38,29),edge);e((27,17,35,26),gold)
            else:
                for i in range(4):
                    a=i*pi/2+.35
                    def pt(rad,side):return (round(cx+rad*cos(a)-side*sin(a)),round(cy+rad*sin(a)+side*cos(a)))
                    pts=[pt(1,0),pt(20,-2),pt(25,4),pt(8,5)]
                    p(pts,edge);p([pt(4,1),pt(20,0),pt(22,3),pt(8,4)],lit if kind=='windmill' else cyan)
                    if kind=='windmill':l([pt(11,0),pt(11,4)],wood)
                e((27,18,35,26),edge);e((29,19,33,23),gold)
    elif kind in ('lantern','bell','clock','trash-can','punching-bag','dojo','drum'):
        if kind=='trash-can':
            block((16,18,32,29),steel,white,edge);e((14,11,50,22),edge);e((16,11,48,18),steel);r((26,8,37,11),edge)
            for x in [21,28,35,42]:l([(x,22),(x,41)],metal,2)
        elif kind=='punching-bag':
            l([(19,2),(47,2),(47,47)],metal,3);l([(20,3),(24,12),(30,3)],edge)
            block((14,12,22,32),accent,lit,edge);r((16,36,33,39),shade)
        elif kind=='dojo':
            block((8,9,6,37),shade,lit,edge);block((49,9,6,37),shade,lit,edge)
            p([(2,3),(12,7),(51,7),(62,3),(59,12),(6,12)],edge)
            r((7,11,55,14),accent);block((8,17,47,4),accent,lit,edge)
            r((22,19,40,30),lit);p([(26,24),(31,21),(36,24),(31,28)],accent)
        elif kind=='bell':
            block((5,4,53,6),wood,lit,edge);block((8,9,4,37),wood,lit,edge);block((51,9,4,37),wood,lit,edge)
            e((21,10,43,36),edge);p([(23,17),(40,16),(42,33),(47,37),(17,37),(21,32)],gold)
            l([(19,35),(44,35)],lit,2);e((29,36,35,42),shade)
        elif kind=='lantern':
            block((29,2,4,44),wood,lit,edge);block((20,46,22,3),shade,lit,edge)
            p([(18,12),(26,7),(38,7),(46,12),(42,16),(21,16)],edge)
            block((22,16,19,17),accent,lit,edge);r((26,18,36,28),(249,215,126));r((30,17,31,30),wood)
        elif kind=='clock':
            block((12,19,40,28),wood,lit,edge);e((13,3,50,40),edge);e((16,5,46,36),gold);e((19,8,43,33),white)
            for x,y in [(31,10),(40,20),(31,30),(21,20)]:r((x,y,x+1,y+1),shade)
            l([(24,23),(31,20),(31,13)],edge,2)
        else:
            e((10,29,54,47),edge);r((10,20,54,38),accent);e((10,12,54,28),edge);e((13,13,51,25),lit)
            for x in [12,23,35,46]:l([(x,26),(x+4,39),(x+9,26)],gold,2)
    elif kind in ('warp-pad','glass','ring-ropes','web','honeycomb'):
        if kind=='warp-pad':
            p([(4,30),(31,17),(59,30),(32,46)],edge);p([(8,29),(31,19),(54,29),(32,42)],shade)
            for a,b in [(16,47),(22,41)]:
                l([(a,30),(31,(a+24)//2),(b,30),(32,44-(a//2)),(a,30)],accent,2)
            e((27,26,35,33),lit)
        elif kind=='glass':
            p([(7,10),(48,4),(55,36),(13,44)],edge);p([(9,12),(46,7),(52,34),(15,41)],cyan)
            p([(11,13),(23,11),(16,37)],white);p([(33,10),(40,8),(26,39),(20,40)],lit)
        elif kind=='ring-ropes':
            for x,y in [(3,15),(34,4),(60,15)]:block((x-1,y,3,30),metal,steel,edge)
            for dy,c in [(6,lit),(13,accent),(20,white)]:l([(4,15+dy),(35,5+dy),(60,16+dy)],c,2)
        elif kind=='web':
            for x,y in [(3,2),(31,0),(61,6),(63,28),(49,47),(19,45),(1,30)]:l([(31,23),(x,y)],white)
            for m in [.4,.72,.98]:
                pts=[(round(31+(x-31)*m),round(23+(y-23)*m)) for x,y in [(3,2),(31,0),(61,6),(63,28),(49,47),(19,45),(1,30),(3,2)]]
                l(pts,lit)
            r((29,21,32,24),gold)
        else:
            for x,y in [(17,14),(38,14),(27,31),(49,31),(7,31)]:
                pts=[(x-9,y),(x-5,y-8),(x+4,y-8),(x+9,y),(x+4,y+7),(x-5,y+7)]
                p(pts,shade);l(pts+[pts[0]],gold,3);l([(x-7,y),(x-3,y-5),(x+3,y-5)],lit)
    elif kind in ('stadium-screen','spotlight','stage-speaker','telescope'):
        if kind=='stadium-screen':
            for x in [14,46]:block((x,29,4,18),steel,white,edge)
            block((2,4,59,30),metal,steel,edge);r((6,8,57,28),edge)
            for x in range(10,55,5):
                h=3+((x*7)%13);r((x,24-h,x+2,24),accent if x%2 else lit)
            r((8,29,55,30),cyan)
        elif kind=='stage-speaker':
            block((12,4,37,43),shade,steel,edge)
            for x in [16,43]:r((x,8,x+1,9),white);r((x,41,x+1,42),white)
            for cx,cy,rad in [(31,17,8),(31,33,10)]:e((cx-rad,cy-rad,cx+rad,cy+rad),edge);e((cx-rad+2,cy-rad+2,cx+rad-2,cy+rad-2),metal);e((cx-3,cy-3,cx+3,cy+3),edge)
        else:
            for tip in [(15,46),(47,46),(31,48)]:l([(31,26),tip],shade,3)
            p([(11,28),(37,10),(47,21),(19,37)],edge)
            p([(14,28),(38,12),(44,20),(20,34)],mid)
            p([(32,13),(43,6),(52,16),(43,23)],steel);l([(44,8),(50,16)],lit,3)
            if kind=='spotlight':e((39,6,54,20),gold);e((42,7,51,16),lit)
    elif kind in ('castle','columns','pillar','crown','star','stars'):
        if kind in ('columns','pillar','castle'):
            xs=[11,39] if kind=='columns' else [24]
            if kind=='castle':
                block((8,18,46,30),mid,lit,edge)
                for x in [7,18,30,43,52]:block((x,10,7,11),mid,lit,edge)
                e((23,28,39,50),edge);r((23,37,39,48),edge)
                for x in [12,44]:r((x,25,x+3,30),shade)
            else:
                for x in xs:
                    block((x-4,6,20,7),mid,lit,edge);block((x,12,12,30),mid,lit,edge)
                    l([(x+4,14),(x+4,39)],lit);block((x-5,41,22,6),mid,lit,edge)
        elif kind=='crown':
            block((21,40,22,7),mid,lit,edge);block((29,29,7,14),gold,lit,edge)
            p([(8,8),(19,16),(32,4),(44,16),(56,7),(50,27),(39,33),(23,32),(14,26)],edge)
            p([(11,11),(20,20),(32,8),(44,20),(53,11),(48,25),(38,30),(25,29),(17,24)],gold)
            e((29,19,35,25),accent);l([(16,25),(47,25)],lit,2)
        else:
            for x,y,v in [(29,23,13),(12,37,5),(51,10,5)]:
                pts=[]
                for i in range(10):
                    a=i*pi/5-pi/2;rr=v if i%2==0 else v*.45;pts.append((round(x+rr*cos(a)),round(y+rr*sin(a))))
                p(pts,gold);l(pts+[pts[0]],lit)
    elif kind in ('climbing-wall','mushroom','sail','dragon','furnace','snowball'):
        if kind=='climbing-wall':
            p([(7,45),(13,10),(37,3),(50,11),(57,45)],edge)
            p([(10,42),(16,12),(37,6),(47,13),(53,42)],(152,123,99))
            for i,(x,y) in enumerate([(21,30),(38,34),(30,25),(42,19),(25,15),(33,10)]):
                e((x-3,y-1,x+3,y+2),[cyan,gold,accent][i%3])
        elif kind=='mushroom':
            for x,y,rad in [(15,31,12),(38,21,20),(52,35,9)]:
                block((x-3,y+3,7,43-y),lit,white,shade);e((x-rad,y-rad//2,x+rad,y+rad//2),shade);p([(x-rad,y),(x-rad//2,y-rad//2),(x,y-rad//2-3),(x+rad//2,y-rad//2),(x+rad,y+1)],accent);r((x-4,y-5,x,y-3),lit)
        elif kind=='sail':
            p([(5,36),(59,36),(49,44),(18,46)],edge);p([(8,36),(56,36),(47,41),(20,42)],wood)
            l([(33,4),(33,38)],shade,2);p([(30,7),(29,32),(7,32)],white);p([(36,10),(53,31),(36,30)],accent)
        elif kind=='dragon':
            block((15,41,39,7),mid,lit,edge)
            points=[(17,41),(23,29),(35,22),(39,14),(44,11),(51,13),(60,11),(55,20),(48,23),(44,31),(43,40),(35,42),(35,35),(29,40)]
            p(points,edge);p([(21,39),(27,29),(37,24),(43,16),(51,15),(56,14),(49,20),(45,20),(40,28),(39,37)],mid)
            p([(24,29),(13,14),(16,7),(30,21),(33,26)],accent);p([(39,15),(38,6),(44,12)],lit);r((47,15,49,16),gold)
        elif kind=='furnace':
            block((6,13,51,34),metal,steel,edge);block((12,3,10,13),shade,steel,edge)
            r((15,23,48,39),edge);r((18,26,45,36),(235,121,64))
            for x in [20,28,36,42]:l([(x,25),(x,38)],shade,2)
            for x in [12,51]:e((x-2,17,x+2,21),gold)
        else:
            for x,y,v in [(13,36,10),(35,27,20),(51,39,8)]:
                e((x-v,y-v,x+v,y+v),metal);e((x-v+1,y-v,x+v-1,y+v-2),(167,201,214));e((x-v+2,y-v+1,x+v//2,y+v//3),white)
    else:
        raise ValueError('Unknown scenery motif: ' + kind)
    bounds = s.image.getbbox()
    if not bounds:
        raise ValueError('Empty scenery motif: ' + kind)
    return s.image.crop(bounds)
