// Pokémon Gold grass and Surf encounters from pret/pokegold (see assets/maps/johto/SOURCES.md).
// Rows retain the native species and levels. We pool all three times of day and all
// floors belonging to the same landmark, weighted by the original encounter rates
// and slot probabilities. Surf tables use the same slots across all three times.

type EncounterSlot = readonly [speciesId: string, level: number, weight: number]

export const johtoEncounterSlots: Readonly<Partial<Record<string, readonly EncounterSlot[]>>> = {
  'new-bark-town': [
    ['tentacool', 15, 540], ['tentacool', 20, 1080], ['tentacruel', 20, 180],
  ],
  'route-29': [
    ['pidgey', 2, 600], ['sentret', 2, 200], ['hoothoot', 2, 300],
    ['rattata', 2, 100], ['sentret', 3, 600], ['pidgey', 3, 400],
    ['hoothoot', 3, 500], ['rattata', 4, 150], ['pidgey', 4, 100],
    ['hoothoot', 4, 50],
  ],
  'cherrygrove-city': [
    ['tentacool', 15, 540], ['tentacool', 20, 1080], ['tentacruel', 20, 180],
  ],
  'route-30': [
    ['pidgey', 2, 600], ['caterpie', 3, 600], ['spinarak', 3, 300],
    ['rattata', 3, 300], ['caterpie', 4, 250], ['metapod', 4, 200],
    ['pidgey', 4, 300], ['hoothoot', 4, 300], ['rattata', 4, 100],
    ['metapod', 5, 50], ['poliwag', 15, 180], ['poliwag', 20, 360],
    ['poliwhirl', 20, 60],
  ],
  'route-31': [
    ['pidgey', 3, 600], ['bellsprout', 3, 600], ['caterpie', 4, 600],
    ['spinarak', 4, 300], ['rattata', 4, 300], ['metapod', 5, 250],
    ['caterpie', 5, 100], ['rattata', 5, 100], ['hoothoot', 5, 100],
    ['metapod', 6, 50], ['poliwag', 15, 180], ['poliwag', 20, 360],
    ['poliwhirl', 20, 60],
  ],
  'violet-city': [
    ['poliwag', 15, 180], ['poliwag', 20, 360], ['poliwhirl', 20, 60],
  ],
  'sprout-tower': [
    ['rattata', 3, 360], ['gastly', 3, 120], ['rattata', 4, 240],
    ['gastly', 4, 120], ['rattata', 5, 220], ['gastly', 5, 80],
    ['rattata', 6, 40], ['gastly', 6, 20],
  ],
  'route-32': [
    ['rattata', 4, 900], ['wooper', 4, 40], ['zubat', 4, 10],
    ['bellsprout', 6, 800], ['mareep', 6, 500], ['hoppip', 6, 200],
    ['rattata', 6, 100], ['wooper', 6, 300], ['rattata', 8, 50],
    ['wooper', 8, 50], ['zubat', 8, 50], ['tentacool', 15, 1080],
    ['quagsire', 20, 540], ['tentacruel', 20, 180],
  ],
  'ruins-of-alph': [
    ['unown', 5, 1800], ['wooper', 15, 360], ['quagsire', 15, 60],
    ['natu', 18, 240], ['natu', 20, 360], ['smeargle', 20, 60],
    ['quagsire', 20, 180], ['natu', 22, 360], ['smeargle', 22, 60],
    ['natu', 24, 120],
  ],
  'union-cave': [
    ['rattata', 4, 180], ['zubat', 5, 360], ['geodude', 6, 540],
    ['sandshrew', 6, 540], ['onix', 6, 90], ['rattata', 6, 90],
    ['zubat', 7, 450], ['geodude', 8, 540], ['sandshrew', 8, 540],
    ['onix', 8, 180], ['zubat', 9, 90], ['wooper', 15, 720],
    ['quagsire', 15, 120], ['tentacool', 15, 720], ['rattata', 20, 60],
    ['quagsire', 20, 720], ['tentacruel', 20, 120], ['geodude', 21, 120],
    ['zubat', 22, 360], ['raticate', 22, 360], ['golbat', 22, 240],
    ['onix', 23, 60],
  ],
  'route-33': [
    ['zubat', 4, 50], ['hoppip', 6, 600], ['spearow', 6, 400],
    ['rattata', 6, 500], ['zubat', 6, 300], ['rattata', 7, 900],
    ['hoppip', 8, 100], ['rattata', 8, 50], ['zubat', 8, 100],
  ],
  'slowpoke-well': [
    ['zubat', 5, 180], ['zubat', 6, 180], ['slowpoke', 6, 60],
    ['zubat', 7, 120], ['zubat', 8, 30], ['slowpoke', 8, 30],
    ['slowpoke', 10, 60], ['slowpoke', 15, 1080], ['zubat', 19, 120],
    ['slowpoke', 20, 540], ['slowbro', 20, 120], ['zubat', 21, 180],
    ['slowpoke', 21, 60], ['zubat', 23, 180], ['golbat', 23, 30],
    ['slowpoke', 23, 30],
  ],
  'ilex-forest': [
    ['caterpie', 5, 240], ['paras', 5, 80], ['zubat', 5, 60],
    ['metapod', 5, 80], ['oddish', 5, 120], ['metapod', 6, 160],
    ['caterpie', 6, 200], ['paras', 6, 60], ['oddish', 6, 120],
    ['zubat', 6, 80], ['psyduck', 10, 180], ['psyduck', 15, 360],
    ['golduck', 15, 60],
  ],
  'route-34': [
    ['drowzee', 10, 900], ['abra', 10, 300], ['ditto', 10, 150],
    ['rattata', 11, 900], ['drowzee', 12, 600], ['rattata', 13, 150],
    ['tentacool', 15, 540], ['tentacool', 20, 1080], ['tentacruel', 20, 180],
  ],
  'route-35': [
    ['abra', 10, 300], ['ditto', 10, 120], ['nidoran-m', 12, 900],
    ['nidoran-f', 12, 900], ['yanma', 12, 30], ['drowzee', 14, 600],
    ['pidgey', 14, 100], ['hoothoot', 14, 50], ['psyduck', 15, 360],
    ['psyduck', 20, 720], ['golduck', 20, 120],
  ],
  'national-park': [
    ['caterpie', 10, 600], ['metapod', 10, 600], ['pidgey', 10, 50],
    ['hoothoot', 10, 650], ['sunkern', 11, 200], ['caterpie', 12, 200],
    ['pidgey', 12, 200], ['hoothoot', 12, 300], ['sunkern', 13, 50],
    ['pidgey', 14, 100], ['hoothoot', 14, 50],
  ],
  'route-36': [
    ['nidoran-m', 12, 900], ['nidoran-f', 12, 900], ['pidgey', 13, 200],
    ['growlithe', 13, 300], ['stantler', 13, 150], ['hoothoot', 13, 200],
    ['pidgey', 14, 200], ['pidgey', 15, 50], ['growlithe', 15, 50],
    ['hoothoot', 15, 50],
  ],
  'route-37': [
    ['pidgey', 13, 600], ['spinarak', 13, 300], ['growlithe', 14, 300],
    ['stantler', 15, 900], ['pidgey', 15, 500], ['pidgeotto', 15, 50],
    ['hoothoot', 15, 200], ['spinarak', 15, 100], ['growlithe', 16, 50],
  ],
  'ecruteak-city': [
    ['poliwag', 15, 180], ['poliwag', 20, 360], ['poliwhirl', 20, 60],
  ],
  'tin-tower': [
    ['rattata', 20, 960], ['gastly', 20, 480], ['rattata', 21, 960],
    ['gastly', 21, 480], ['rattata', 22, 1120], ['gastly', 22, 320],
    ['rattata', 23, 240], ['rattata', 24, 240],
  ],
  'burned-tower': [
    ['rattata', 13, 360], ['koffing', 14, 900], ['zubat', 14, 120],
    ['rattata', 14, 570], ['magmar', 14, 60], ['rattata', 15, 240],
    ['raticate', 15, 60], ['zubat', 15, 90], ['koffing', 16, 420],
    ['rattata', 16, 120], ['magmar', 16, 60],
  ],
  'route-38': [
    ['miltank', 13, 150], ['tauros', 13, 120], ['snubbull', 13, 30],
    ['rattata', 16, 1000], ['raticate', 16, 900], ['magnemite', 16, 600],
    ['farfetchd', 16, 200],
  ],
  'route-39': [
    ['miltank', 15, 70], ['tauros', 15, 70], ['rattata', 16, 520],
    ['magnemite', 16, 280], ['farfetchd', 16, 40], ['raticate', 17, 420],
  ],
  'olivine-city': [
    ['tentacool', 15, 720], ['tentacool', 20, 1440], ['tentacruel', 20, 240],
  ],
  'route-40': [
    ['tentacool', 15, 540], ['tentacool', 20, 1080], ['tentacruel', 20, 180],
  ],
  'whirl-islands': [
    ['horsea', 15, 1080], ['tentacool', 20, 720], ['tentacruel', 20, 600],
    ['horsea', 20, 1080], ['seadra', 20, 120], ['krabby', 22, 2700],
    ['seel', 22, 900], ['zubat', 23, 2700], ['golbat', 23, 450],
    ['krabby', 23, 1080], ['seel', 23, 360], ['krabby', 24, 2340],
    ['seel', 24, 630], ['zubat', 24, 1080], ['golbat', 24, 180],
    ['krabby', 25, 720], ['seel', 25, 180], ['zubat', 25, 540],
    ['golbat', 25, 90], ['krabby', 26, 360], ['seel', 26, 90],
  ],
  'route-41': [
    ['tentacool', 20, 1080], ['tentacruel', 20, 540], ['mantine', 20, 180],
  ],
  'cianwood-city': [
    ['tentacool', 15, 540], ['tentacool', 20, 1080], ['tentacruel', 20, 180],
  ],
  'route-42': [
    ['mareep', 13, 900], ['spearow', 14, 400], ['zubat', 14, 200],
    ['mankey', 15, 900], ['flaaffy', 15, 150], ['goldeen', 15, 360],
    ['spearow', 16, 200], ['zubat', 16, 100], ['flaaffy', 17, 150],
    ['goldeen', 20, 720], ['seaking', 20, 120],
  ],
  'mt-mortar': [
    ['zubat', 13, 540], ['geodude', 13, 540], ['machop', 13, 540],
    ['machop', 14, 360], ['rattata', 14, 360], ['geodude', 14, 90],
    ['zubat', 14, 90], ['zubat', 15, 1080], ['marill', 15, 18],
    ['geodude', 15, 360], ['machop', 15, 90], ['goldeen', 15, 540],
    ['rattata', 16, 432], ['machop', 16, 180], ['geodude', 16, 90],
    ['raticate', 16, 90], ['zubat', 17, 540], ['goldeen', 20, 1440],
    ['seaking', 20, 180], ['goldeen', 25, 180], ['seaking', 25, 60],
    ['machop', 28, 90], ['raticate', 30, 180], ['golbat', 30, 90],
    ['graveler', 31, 540], ['geodude', 31, 360], ['machoke', 32, 540],
  ],
  'route-43': [
    ['magikarp', 10, 60], ['flaaffy', 15, 900], ['girafarig', 15, 900],
    ['mareep', 15, 250], ['magikarp', 15, 180], ['venonat', 16, 200],
    ['pidgeotto', 17, 450], ['flaaffy', 17, 100], ['noctowl', 17, 200],
    ['magikarp', 20, 360],
  ],
  'lake-of-rage': [
    ['magikarp', 10, 360], ['magikarp', 15, 720], ['gyarados', 15, 120],
  ],
  'route-44': [
    ['poliwag', 20, 180], ['weepinbell', 22, 900], ['bellsprout', 22, 600],
    ['tangela', 23, 900], ['lickitung', 24, 300], ['weepinbell', 24, 150],
    ['poliwag', 25, 360], ['poliwhirl', 25, 60], ['lickitung', 26, 150],
  ],
  'ice-path': [
    ['jynx', 20, 20], ['swinub', 21, 360], ['jynx', 21, 20],
    ['golbat', 22, 360], ['zubat', 22, 280], ['jynx', 22, 70],
    ['swinub', 22, 360], ['swinub', 23, 300], ['golbat', 23, 360],
    ['zubat', 23, 280], ['jynx', 23, 60], ['swinub', 24, 120],
    ['golbat', 24, 180], ['zubat', 24, 140], ['jynx', 24, 30],
    ['swinub', 25, 60],
  ],
  'blackthorn-city': [
    ['magikarp', 5, 120], ['magikarp', 10, 360], ['magikarp', 15, 720],
  ],
  'dragons-den': [
    ['magikarp', 10, 360], ['dratini', 10, 120], ['magikarp', 15, 720],
  ],
  'route-45': [
    ['magikarp', 5, 60], ['magikarp', 15, 180], ['teddiursa', 20, 300],
    ['magikarp', 20, 360], ['geodude', 23, 900], ['graveler', 23, 900],
    ['gligar', 24, 600], ['graveler', 25, 150], ['graveler', 27, 150],
  ],
  'dark-cave': [
    ['zubat', 2, 360], ['geodude', 2, 240], ['geodude', 3, 360],
    ['zubat', 3, 60], ['geodude', 4, 120], ['zubat', 4, 48],
    ['dunsparce', 4, 12], ['magikarp', 5, 120], ['magikarp', 10, 360],
    ['magikarp', 15, 720], ['wobbuffet', 20, 120], ['geodude', 23, 360],
    ['zubat', 23, 360], ['golbat', 23, 60], ['graveler', 25, 240],
    ['wobbuffet', 25, 60],
  ],
  'route-46': [
    ['spearow', 2, 600], ['rattata', 2, 600], ['geodude', 2, 300],
    ['geodude', 3, 900], ['spearow', 3, 100], ['jigglypuff', 3, 120],
    ['rattata', 3, 300], ['geodude', 4, 50], ['jigglypuff', 5, 30],
  ],
  'mt-silver': [
    ['larvitar', 15, 72], ['larvitar', 20, 288], ['seaking', 35, 360],
    ['goldeen', 35, 60], ['poliwhirl', 35, 360], ['poliwag', 35, 60],
    ['sneasel', 38, 50], ['seaking', 40, 180], ['poliwhirl', 40, 180],
    ['tangela', 41, 900], ['doduo', 41, 100], ['onix', 42, 540],
    ['ponyta', 42, 900], ['ursaring', 42, 600], ['sneasel', 42, 50],
    ['graveler', 43, 540], ['dodrio', 43, 100], ['ursaring', 44, 540],
    ['rapidash', 44, 300], ['golbat', 45, 90], ['quagsire', 45, 1200],
    ['misdreavus', 45, 240], ['ursaring', 47, 720], ['golduck', 48, 1080],
    ['golbat', 48, 540], ['onix', 48, 540], ['ursaring', 50, 180],
    ['golbat', 51, 540], ['golduck', 51, 90],
  ],
  'johto-victory-road': [
    ['graveler', 32, 540], ['golbat', 32, 540], ['ursaring', 33, 360],
    ['onix', 34, 180], ['rhyhorn', 35, 90], ['onix', 36, 90],
  ],
  'route-26': [
    ['tentacool', 25, 540], ['doduo', 28, 600], ['sandslash', 28, 900],
    ['raticate', 28, 300], ['doduo', 30, 200], ['dodrio', 30, 100],
    ['raticate', 30, 190], ['quagsire', 30, 60], ['tentacool', 30, 1080],
    ['tentacruel', 30, 180], ['ponyta', 32, 600], ['quagsire', 32, 50],
  ],
  'route-27': [
    ['tentacool', 15, 540], ['tentacool', 20, 1080], ['tentacruel', 20, 180],
    ['doduo', 28, 600], ['raticate', 28, 900], ['quagsire', 28, 400],
    ['doduo', 30, 400], ['sandslash', 30, 150], ['raticate', 30, 200],
    ['quagsire', 30, 200], ['ponyta', 32, 150],
  ],
  'tohjo-falls': [
    ['rattata', 20, 60], ['goldeen', 20, 720], ['slowpoke', 20, 360],
    ['seaking', 20, 120], ['slowpoke', 21, 120], ['zubat', 22, 360],
    ['raticate', 22, 360], ['golbat', 22, 240], ['slowpoke', 23, 60],
  ],
  'route-28': [
    ['poliwag', 35, 180], ['tangela', 39, 900], ['ponyta', 40, 900],
    ['ursaring', 40, 600], ['sneasel', 40, 100], ['poliwag', 40, 360],
    ['poliwhirl', 40, 60], ['doduo', 41, 100], ['rapidash', 42, 300],
    ['dodrio', 43, 100],
  ],
}
