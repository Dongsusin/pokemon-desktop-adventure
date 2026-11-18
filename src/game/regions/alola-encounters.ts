// Original Pokémon Sun local encounter slots. See assets/maps/alola/ENCOUNTERS.md.
import { expandEncounterRanges, type EncounterRange } from './encounterRanges'
import type { LegendaryEncounter } from './kanto'

const rangesByArea: Record<string, readonly EncounterRange[]> = {
  'abandoned-thrifty-megamart': [
    ['golbat', 29, 32, 8], ['haunter', 29, 32, 8], ['klefki', 29, 32, 3],
    ['mimikyu', 29, 32, 1],
  ],
  'akala-outskirts': [
    ['chinchou', 10, 23, 1], ['gumshoos', 20, 23, 15], ['magikarp', 10, 23, 79],
    ['nosepass', 20, 23, 15], ['raticate', 20, 23, 15], ['stufful', 20, 23, 5],
    ['wingull', 20, 23, 50], ['wishiwashi', 10, 23, 20],
  ],
  'alola-berry-fields': [
    ['crabrawler', 7, 10, 1],
  ],
  'alola-route-1': [
    ['bonsly', 10, 13, 6], ['caterpie', 2, 3, 8], ['caterpie', 3, 5, 4],
    ['caterpie', 10, 13, 4], ['grubbin', 3, 5, 4], ['ledyba', 2, 3, 4],
    ['ledyba', 3, 5, 3], ['ledyba', 10, 13, 2], ['metapod', 3, 5, 4],
    ['metapod', 10, 13, 4], ['munchlax', 10, 13, 2], ['pichu', 3, 5, 2],
    ['pikipek', 2, 3, 12], ['pikipek', 3, 5, 8], ['pikipek', 10, 13, 8],
    ['rattata', 2, 3, 6], ['rattata', 3, 5, 6], ['rattata', 10, 13, 6],
    ['spinarak', 2, 3, 4], ['spinarak', 3, 5, 3], ['spinarak', 10, 13, 2],
    ['yungoos', 2, 3, 6], ['yungoos', 3, 5, 6], ['yungoos', 10, 13, 6],
  ],
  'alola-route-10': [
    ['ariados', 24, 27, 2], ['crabrawler', 24, 27, 20], ['fearow', 24, 27, 22],
    ['gumshoos', 24, 27, 3], ['ledian', 24, 27, 2], ['pancham', 24, 27, 2],
    ['raticate', 24, 27, 3], ['skarmory', 24, 27, 6],
  ],
  'alola-route-11': [
    ['ariados', 24, 27, 2], ['gumshoos', 24, 27, 2], ['komala', 24, 27, 2],
    ['ledian', 24, 27, 2], ['morelull', 24, 27, 1], ['pancham', 24, 27, 4],
    ['paras', 24, 27, 1], ['raticate', 24, 27, 2], ['trumbeak', 24, 27, 4],
  ],
  'alola-route-12': [
    ['elekid', 25, 28, 1], ['elekid', 26, 29, 1], ['geodude', 25, 28, 4],
    ['geodude', 26, 29, 4], ['mudbray', 25, 28, 3], ['mudbray', 26, 29, 3],
    ['torkoal', 25, 28, 2], ['torkoal', 26, 29, 2],
  ],
  'alola-route-13': [
    ['bruxish', 10, 30, 1], ['magikarp', 10, 30, 79], ['wishiwashi', 10, 30, 20],
  ],
  'alola-route-14': [
    ['bruxish', 10, 31, 1], ['finneon', 28, 31, 40], ['magikarp', 10, 31, 79],
    ['pelipper', 28, 31, 20], ['tentacool', 28, 31, 40], ['wishiwashi', 10, 31, 20],
  ],
  'alola-route-15': [
    ['bruxish', 10, 33, 1], ['finneon', 30, 33, 40], ['gumshoos', 30, 33, 15],
    ['magikarp', 10, 33, 79], ['pelipper', 30, 33, 70], ['raticate', 30, 33, 15],
    ['slowpoke', 30, 33, 20], ['tentacool', 30, 33, 40], ['wishiwashi', 10, 33, 20],
  ],
  'alola-route-16': [
    ['crabrawler', 30, 33, 20], ['gumshoos', 30, 33, 3], ['pelipper', 30, 33, 10],
    ['raticate', 30, 33, 3], ['slowpoke', 30, 33, 4],
  ],
  'alola-route-17': [
    ['ariados', 31, 34, 1], ['crabrawler', 31, 34, 20], ['fearow', 31, 34, 6],
    ['graveler', 31, 34, 2], ['gumshoos', 31, 34, 3], ['ledian', 31, 34, 1],
    ['pancham', 31, 34, 3], ['raticate', 31, 34, 3], ['skarmory', 31, 34, 1],
  ],
  'alola-route-2': [
    ['abra', 7, 10, 2], ['crabrawler', 7, 10, 20], ['cutiefly', 7, 10, 2],
    ['drowzee', 7, 10, 2], ['growlithe', 7, 10, 2], ['makuhita', 9, 10, 6],
    ['meowth', 7, 10, 3], ['rattata', 7, 10, 1], ['rattata', 9, 10, 7],
    ['smeargle', 7, 10, 3], ['spearow', 7, 10, 4], ['yungoos', 7, 10, 1],
    ['yungoos', 9, 10, 7],
  ],
  'alola-route-3': [
    ['bagon', 9, 12, 1], ['crabrawler', 9, 12, 200], ['cutiefly', 9, 12, 40],
    ['delibird', 9, 12, 10], ['mankey', 9, 12, 40], ['rattata', 9, 12, 10],
    ['rufflet', 11, 12, 60], ['spearow', 9, 12, 89], ['spearow', 11, 12, 140],
    ['yungoos', 9, 12, 10],
  ],
  'alola-route-4': [
    ['crabrawler', 11, 14, 20], ['eevee', 11, 14, 1], ['grubbin', 11, 14, 2],
    ['igglybuff', 11, 14, 1], ['lillipup', 11, 14, 6], ['mudbray', 11, 14, 4],
    ['pikipek', 11, 14, 4], ['rattata', 11, 14, 1], ['yungoos', 11, 14, 1],
  ],
  'alola-route-5': [
    ['bonsly', 18, 21, 10], ['butterfree', 13, 16, 1], ['butterfree', 18, 21, 5],
    ['caterpie', 13, 16, 10], ['caterpie', 18, 21, 15], ['crabrawler', 13, 16, 200],
    ['diglett', 18, 21, 200], ['fomantis', 13, 16, 20], ['fomantis', 18, 21, 30],
    ['grubbin', 13, 16, 10], ['grubbin', 18, 21, 10], ['lillipup', 13, 16, 30],
    ['metapod', 13, 16, 9], ['metapod', 18, 21, 10], ['pikipek', 13, 16, 20],
    ['trumbeak', 18, 21, 20],
  ],
  'alola-route-6': [
    ['eevee', 14, 17, 1], ['grubbin', 14, 17, 2], ['igglybuff', 14, 17, 1],
    ['lillipup', 14, 17, 6], ['mudbray', 14, 17, 2], ['oricorio', 14, 17, 2],
    ['pikipek', 14, 17, 4], ['rattata', 14, 17, 1], ['yungoos', 14, 17, 1],
  ],
  'alola-route-7': [
    ['diglett', 16, 19, 100], ['finneon', 16, 19, 30], ['magikarp', 10, 19, 79],
    ['pyukumuku', 16, 19, 20], ['staryu', 10, 19, 1], ['tentacool', 16, 19, 30],
    ['wingull', 16, 19, 20], ['wishiwashi', 10, 19, 20],
  ],
  'alola-route-8': [
    ['chinchou', 10, 20, 1], ['crabrawler', 17, 20, 100], ['finneon', 17, 20, 40],
    ['fletchinder', 17, 20, 15], ['magikarp', 10, 20, 79], ['rattata', 17, 20, 15],
    ['salandit', 17, 20, 20], ['stufful', 17, 20, 5], ['tentacool', 17, 20, 40],
    ['trumbeak', 17, 20, 30], ['wimpod', 17, 20, 100], ['wingull', 17, 20, 20],
    ['wishiwashi', 10, 20, 20], ['yungoos', 17, 20, 15],
  ],
  'alola-route-9': [
    ['corsola', 10, 23, 1], ['luvdisc', 10, 23, 14], ['magikarp', 10, 23, 3],
    ['wishiwashi', 10, 23, 2],
  ],
  'ancient-poni-path': [
    ['exeggcute', 40, 43, 2], ['gastrodon', 40, 43, 2], ['granbull', 40, 43, 4],
    ['gumshoos', 40, 43, 3], ['pelipper', 40, 43, 6], ['raticate', 40, 43, 3],
  ],
  'blush-mountain': [
    ['charjabug', 27, 30, 1], ['elekid', 27, 30, 1], ['geodude', 27, 30, 3],
    ['mudbray', 27, 30, 2], ['togedemaru', 27, 30, 1], ['torkoal', 27, 30, 1],
    ['turtonator', 27, 30, 1],
  ],
  'brooklet-hill': [
    ['alomomola', 10, 15, 1], ['dewpider', 14, 17, 35], ['feebas', 10, 15, 1],
    ['finneon', 14, 17, 40], ['goldeen', 10, 15, 29], ['lillipup', 14, 17, 20],
    ['magikarp', 10, 15, 149], ['morelull', 14, 17, 10], ['paras', 14, 17, 10],
    ['poliwag', 14, 17, 70], ['psyduck', 14, 17, 80], ['surskit', 14, 17, 35],
    ['tentacool', 14, 17, 40], ['wingull', 14, 17, 60], ['wishiwashi', 10, 15, 20],
  ],
  'digletts-tunnel': [
    ['diglett', 19, 22, 13], ['zubat', 19, 22, 7],
  ],
  'exeggutor-island': [
    ['exeggcute', 40, 43, 4], ['exeggutor', 40, 43, 2], ['gastrodon', 40, 43, 1],
    ['pelipper', 40, 43, 3],
  ],
  'haina-desert': [
    ['dugtrio', 28, 31, 5], ['sandile', 28, 31, 14], ['trapinch', 28, 31, 1],
  ],
  'hano-beach': [
    ['finneon', 21, 24, 3], ['pyukumuku', 21, 24, 2], ['sandygast', 21, 24, 2],
    ['staryu', 21, 24, 8], ['tentacool', 21, 24, 3], ['wingull', 21, 24, 2],
  ],
  'hauoli-cemetery': [
    ['drifloon', 7, 10, 3], ['gastly', 7, 10, 10], ['misdreavus', 7, 10, 3],
    ['zubat', 7, 10, 4],
  ],
  'hauoli-city': [
    ['abra', 5, 8, 5], ['finneon', 15, 18, 8], ['grimer', 5, 8, 2],
    ['magnemite', 5, 8, 2], ['meowth', 5, 8, 2], ['pichu', 5, 8, 1],
    ['rattata', 5, 8, 2], ['tentacool', 15, 18, 8], ['wingull', 5, 8, 4],
    ['wingull', 15, 18, 4], ['yungoos', 5, 8, 2],
  ],
  'hauoli-outskirts': [
    ['finneon', 15, 18, 8], ['rattata', 5, 7, 3], ['slowpoke', 5, 7, 4],
    ['tentacool', 15, 18, 8], ['wingull', 5, 7, 10], ['wingull', 15, 18, 4],
    ['yungoos', 5, 7, 3],
  ],
  'kalae-bay': [
    ['bagon', 15, 18, 10], ['finneon', 15, 18, 40], ['magikarp', 10, 15, 79],
    ['rattata', 15, 18, 15], ['shellder', 10, 15, 1], ['slowpoke', 15, 18, 20],
    ['tentacool', 15, 18, 40], ['wingull', 15, 18, 60], ['wishiwashi', 10, 15, 20],
    ['yungoos', 15, 18, 15],
  ],
  'lush-jungle': [
    ['bonsly', 18, 21, 2], ['bounsweet', 18, 21, 8], ['caterpie', 18, 21, 2],
    ['comfey', 18, 21, 3], ['diglett', 18, 21, 6], ['fomantis', 18, 21, 94],
    ['metapod', 18, 21, 2], ['morelull', 18, 21, 6], ['paras', 18, 21, 6],
    ['passimian', 18, 21, 3], ['pinsir', 18, 21, 2], ['trumbeak', 18, 21, 12],
    ['zubat', 18, 21, 14],
  ],
  'malie-garden': [
    ['araquanid', 24, 27, 1], ['ariados', 24, 27, 1], ['cottonee', 24, 27, 1],
    ['goldeen', 10, 27, 4], ['ledian', 24, 27, 1], ['magikarp', 10, 27, 6],
    ['masquerain', 24, 27, 1], ['meowth', 24, 27, 2], ['poliwag', 24, 27, 2],
    ['psyduck', 24, 27, 1],
  ],
  'malie-outer-cape': [
    ['grimer', 24, 27, 3], ['gumshoos', 24, 27, 1], ['magnemite', 24, 27, 2],
    ['raticate', 24, 27, 1], ['trubbish', 24, 27, 3],
  ],
  'melemele-meadow': [
    ['butterfree', 9, 12, 1], ['caterpie', 9, 12, 10], ['cottonee', 9, 12, 30],
    ['cutiefly', 9, 12, 30], ['metapod', 9, 12, 9], ['oricorio', 9, 12, 20],
  ],
  'melemele-sea': [
    ['corsola', 10, 18, 1], ['finneon', 15, 18, 40], ['luvdisc', 10, 18, 1],
    ['magikarp', 10, 18, 78], ['tentacool', 15, 18, 40], ['wingull', 15, 18, 20],
    ['wishiwashi', 10, 18, 20],
  ],
  'memorial-hill': [
    ['gastly', 20, 23, 5], ['phantump', 20, 23, 3], ['zubat', 20, 23, 2],
  ],
  'mount-hokulani': [
    ['beldum', 25, 28, 2], ['cleffa', 25, 28, 1], ['ditto', 25, 28, 2],
    ['fearow', 25, 28, 7], ['minior', 25, 28, 6], ['skarmory', 25, 28, 2],
  ],
  'mount-lanakila': [
    ['absol', 42, 45, 2], ['absol', 45, 48, 4], ['golbat', 45, 48, 3],
    ['sneasel', 42, 45, 2], ['sneasel', 45, 48, 4], ['snorunt', 42, 45, 3],
    ['snorunt', 45, 48, 6], ['vulpix', 42, 45, 3], ['vulpix', 45, 48, 3],
  ],
  'paniola-ranch': [
    ['lillipup', 12, 15, 8], ['miltank', 12, 15, 1], ['mudbray', 12, 15, 10],
    ['tauros', 12, 15, 1],
  ],
  'paniola-town': [
    ['barboach', 10, 18, 1], ['magikarp', 10, 18, 99],
  ],
  'poni-breaker-coast': [
    ['magikarp', 10, 43, 79], ['sharpedo', 10, 43, 1], ['wailmer', 10, 43, 20],
    ['wimpod', 40, 43, 100],
  ],
  'poni-coast': [
    ['dugtrio', 56, 59, 1],
  ],
  'poni-gauntlet': [
    ['barboach', 10, 59, 40], ['bewear', 56, 59, 5], ['dratini', 10, 59, 1],
    ['golduck', 56, 59, 15], ['granbull', 56, 59, 20], ['gumshoos', 56, 59, 15],
    ['magikarp', 10, 59, 59], ['pelipper', 56, 59, 30], ['raticate', 56, 59, 15],
  ],
  'poni-grove': [
    ['granbull', 52, 55, 4], ['gumshoos', 52, 55, 3], ['pinsir', 52, 55, 2],
    ['raticate', 52, 55, 3], ['riolu', 52, 55, 2], ['trumbeak', 52, 55, 6],
  ],
  'poni-meadow': [
    ['barboach', 10, 57, 40], ['cottonee', 54, 57, 50], ['dratini', 10, 57, 1],
    ['magikarp', 10, 57, 59], ['oricorio', 54, 57, 20], ['ribombee', 54, 57, 30],
  ],
  'poni-plains': [
    ['braviary', 54, 57, 6], ['cottonee', 54, 57, 30], ['crabrawler', 54, 57, 80],
    ['emolga', 54, 57, 4], ['fearow', 54, 57, 18], ['gumshoos', 54, 57, 17],
    ['hariyama', 54, 57, 6], ['hypno', 54, 57, 4], ['miltank', 54, 57, 8],
    ['mudsdale', 54, 57, 4], ['pelipper', 54, 57, 4], ['primeape', 54, 57, 16],
    ['raticate', 54, 57, 17], ['scyther', 54, 57, 6], ['tauros', 54, 57, 8],
    ['trumbeak', 54, 57, 12],
  ],
  'poni-wilds': [
    ['crabrawler', 40, 43, 100], ['exeggcute', 40, 43, 10], ['gastrodon', 40, 43, 30],
    ['granbull', 40, 43, 20], ['gumshoos', 40, 43, 15], ['lapras', 40, 43, 5],
    ['lumineon', 40, 43, 25], ['magikarp', 10, 43, 79], ['pelipper', 40, 43, 50],
    ['raticate', 40, 43, 15], ['relicanth', 10, 43, 1], ['tentacruel', 40, 43, 30],
    ['wailmer', 10, 43, 20], ['wailmer', 40, 43, 45], ['wailord', 40, 43, 5],
    ['wimpod', 40, 43, 50],
  ],
  'resolution-cave': [
    ['dugtrio', 54, 57, 3], ['golbat', 54, 57, 7],
  ],
  'seafolk-village': [
    ['dhelmise', 10, 43, 1], ['magikarp', 10, 43, 79], ['wailmer', 10, 43, 20],
  ],
  'seaward-cave': [
    ['barboach', 10, 15, 1], ['diglett', 9, 12, 30], ['magikarp', 10, 15, 99],
    ['psyduck', 15, 18, 20], ['zubat', 9, 12, 70], ['zubat', 15, 18, 80],
  ],
  'secluded-shore': [
    ['bruxish', 10, 30, 1], ['crabrawler', 27, 30, 100], ['finneon', 27, 30, 40],
    ['magikarp', 10, 30, 79], ['pelipper', 27, 30, 20], ['tentacool', 27, 30, 40],
    ['wishiwashi', 10, 30, 20],
  ],
  'tapu-village': [
    ['absol', 28, 31, 2], ['gumshoos', 28, 31, 3], ['pelipper', 28, 31, 6],
    ['raticate', 28, 31, 3], ['snorunt', 28, 31, 4], ['vulpix', 28, 31, 2],
  ],
  'ten-carat-hill': [
    ['carbink', 10, 13, 4], ['diglett', 10, 13, 2], ['machop', 10, 13, 3],
    ['psyduck', 15, 18, 4], ['rockruff', 10, 13, 2], ['roggenrola', 10, 13, 5],
    ['spinda', 10, 13, 1], ['zubat', 10, 13, 3], ['zubat', 15, 18, 16],
  ],
  'trainers-school': [
    ['grimer', 6, 8, 2], ['magnemite', 6, 8, 5], ['meowth', 6, 8, 3],
  ],
  'ulaula-meadow': [
    ['ariados', 31, 34, 1], ['cottonee', 31, 34, 3], ['ledian', 31, 34, 1],
    ['oricorio', 31, 34, 2], ['ribombee', 31, 34, 3],
  ],
  'vast-poni-canyon': [
    ['barboach', 10, 44, 80], ['boldore', 41, 44, 40], ['carbink', 41, 44, 35],
    ['dratini', 10, 44, 2], ['dugtrio', 41, 44, 220], ['golbat', 41, 44, 190],
    ['golduck', 41, 44, 40], ['jangmo-o', 41, 44, 5], ['lycanroc', 41, 44, 20],
    ['machoke', 41, 44, 30], ['magikarp', 10, 44, 118], ['murkrow', 41, 44, 10],
    ['skarmory', 41, 44, 10],
  ],
  'verdant-cavern': [
    ['diglett', 8, 11, 3], ['zubat', 8, 11, 7],
  ],
  'wela-volcano-park': [
    ['cubone', 16, 19, 24], ['fletchling', 16, 19, 30], ['kangaskhan', 16, 19, 1],
    ['magby', 16, 19, 15], ['salandit', 16, 19, 30],
  ],
}

export const alolaEncounterSlots = expandEncounterRanges(rangesByArea)

export const alolaLegendSlots: Readonly<Partial<Record<string, readonly LegendaryEncounter[]>>> = {
  'altar-of-the-sunne': [{ speciesId: 'solgaleo', level: 55, weight: 1 }],
  'ruins-of-conflict': [{ speciesId: 'tapu-koko', level: 60, weight: 1, championOnly: true }],
  'ruins-of-life': [{ speciesId: 'tapu-lele', level: 60, weight: 1, championOnly: true }],
  'ruins-of-abundance': [{ speciesId: 'tapu-bulu', level: 60, weight: 1, championOnly: true }],
  'ruins-of-hope': [{ speciesId: 'tapu-fini', level: 60, weight: 1, championOnly: true }],
  'melemele-meadow': [{ speciesId: 'buzzwole', level: 65, weight: 1, championOnly: true }],
  'wela-volcano-park': [{ speciesId: 'nihilego', level: 55, weight: 1, championOnly: true }],
  'digletts-tunnel': [{ speciesId: 'nihilego', level: 55, weight: 1, championOnly: true }],
  'memorial-hill': [{ speciesId: 'xurkitree', level: 65, weight: 1, championOnly: true }],
  'lush-jungle': [{ speciesId: 'xurkitree', level: 65, weight: 1, championOnly: true }],
  'malie-garden': [{ speciesId: 'kartana', level: 60, weight: 1, championOnly: true }],
  'alola-route-17': [{ speciesId: 'kartana', level: 60, weight: 1, championOnly: true }],
  'resolution-cave': [{ speciesId: 'guzzlord', level: 70, weight: 1, championOnly: true }],
  'ten-carat-hill': [{ speciesId: 'necrozma', level: 75, weight: 1, championOnly: true }],
}
