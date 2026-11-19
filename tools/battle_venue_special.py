"""Site-specific scenery at the same 300 x 190 native pixel grid as the venue builder."""
from math import cos, sin, tau
from PIL import ImageDraw


def dress_special(scene, region, trainer, spec, accent, trim, avg):
    d = ImageDraw.Draw(scene)
    if trainer in ('kalos-olympia', 'unova-caitlin'):
        observatory = trainer == 'kalos-olympia'
        night = (37, 45, 82) if observatory else (65, 51, 83)
        d.rectangle((0, 0, 299, 189), night)
        for i in range(104):
            x, y = (i * 173 + 29) % 300, (i * 103 + (i*i) % 37) % 190
            d.point((x,y), (151, 161, 195))
            if i % 17 == 0:
                d.line((x-1,y,x+1,y), (205,195,177)); d.line((x,y-1,x,y+1), (205,195,177))
        if observatory:
            # A lenticular platform and orbital tracks against the night sky.
            d.ellipse((8,27,292,180), fill=(64,71,108), outline=(112,129,156), width=2)
            d.ellipse((15,32,285,175), outline=(96,108,142))
            for box in [(22,64,279,145),(47,47,253,161),(104,35,196,171)]:
                d.ellipse(box, outline=(78,87,122))
            for x,y,r in [(44,110,2),(84,52,3),(207,147,3),(270,78,2)]:
                d.ellipse((x-r,y-r,x+r,y+r), fill=(143,154,183))
        else:
            # Curtains and an oval, quilted dais belong to the sleeping chamber.
            d.ellipse((9,32,291,178), fill=(125,99,132), outline=(187,156,158), width=2)
            d.ellipse((16,37,284,172), outline=(151,127,149))
            for y in range(70,145,18):
                for x in range(45 + (y//18 % 2)*12, 259, 24):
                    d.line([(x-2,y),(x,y-1),(x+2,y)], fill=(135,111,138))
            for x in [0,243]:
                d.polygon([(x,0),(x+56,0),(x+45,9),(x+31,17),(x+22,21),(x+8,19),(x,15)], fill=(104,72,110))
                d.arc((x-15,-19,x+75,21), 28, 145, fill=(199,161,155), width=2)
        return
    if trainer == 'paldea-geeta':
        # Exposed roof with distant skyline, expansion joints and parapet.
        d.rectangle((0,0,299,189), (151,169,174))
        d.rectangle((0,0,299,16), (146,177,194))
        edge = [(0,15),(14,13),(26,14),(39,10),(55,12),(68,9),(85,11),(104,8),(123,13),
                (146,9),(166,12),(188,8),(208,12),(231,8),(248,11),(271,8),(299,12)]
        d.polygon([(0,18)]+edge+[(299,18)], fill=(113,139,157))
        for y in [18,22,171,176]: d.line((0,y,299,y), fill=(104,126,139))
        for y in (42,64,86,108,130,152):
            d.line((0,y,299,y), fill=(139,157,163))
            for x in range(8 if y % 4 else 32, 300, 48): d.line((x,y-21,x,y), fill=(139,157,163))
        d.rounded_rectangle((19,37,280,161), radius=12, outline=(184,195,192), width=2)
        d.ellipse((129,78,170,118), outline=(174,188,188))
        d.line((149,38,149,78), fill=(174,188,188)); d.line((149,118,149,160),fill=(174,188,188))
        return
    if trainer == 'paldea-nemona':
        # Mesagoza's compass mosaic in a terracotta and limestone public square.
        d.rectangle((0,0,299,189), (180,157,127))
        for y in range(5,187,10):
            d.line((0,y,299,y), fill=(170,148,122))
            for x in range((y//10%2)*11,300,22): d.line((x,y-9,x,y), fill=(170,148,122))
        for y,c in [(6,(216,192,151)),(10,(148,125,108)),(16,(213,189,151)),(169,(147,128,108)),(174,(216,192,151))]:
            d.line((0,y,299,y), c, 2)
        colors=[(173,140,117),(184,153,111),(159,156,121),(138,154,143),
                (141,151,160),(151,143,158),(172,144,149),(184,148,130)]
        for i,color in enumerate(colors):
            angle=i*tau/8
            points=[(150,98)]
            for da,rad in [(-.39,24),(0,42),(.39,24)]: points.append((round(150+cos(angle+da)*rad),round(98+sin(angle+da)*rad)))
            d.polygon(points, fill=color)
        d.ellipse((143,91,157,105), fill=(193,172,139), outline=(158,142,121))
        return
    if trainer == 'galar-piers':
        # Paired shuttered shops and curb paint give the band a real alley frontage.
        for x in [0,108,207]:
            d.rectangle((x,1,x+75,19), fill=(74,73,86), outline=(47,47,62))
            for y in [5,9,13,17]: d.line((x+3,y,x+72,y), fill=(94,91,100))
        for x in [18,37,250,268]:
            d.polygon([(x,151),(x+7,147),(x+5,151),(x+12,148),(x+6,154),(x+6,152),(x,155)], fill=(134,105,129))
    elif trainer == 'unova-roxie':
        # The back of the Virbank club is an amplifier wall with a signal trace.
        for x in range(8,288,8):
            level = (x*5//8)%9 + 2
            d.rectangle((x,19-level,x+3,19), fill=(102,151,129))
        d.line((0,21,299,21), fill=(74,105,101))
