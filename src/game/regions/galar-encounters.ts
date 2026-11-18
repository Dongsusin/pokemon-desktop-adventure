import type { AreaSlots } from './encounterRanges'
import type { KantoEncounter, LegendaryEncounter } from './kanto'

// Encounters extracted from Pokémon Sword. Sources and desktop pooling rules are in assets/maps/galar/ENCOUNTERS.md.
const Clear = 1, Clouds = 2, Rain = 4, Thunder = 8, Sun = 16, Snow = 32, Blizzard = 64, Sand = 128, Fog = 256
const AllWeather = Clear | Clouds | Rain | Thunder | Sun | Snow | Blizzard | Sand | Fog
const weatherFlags = [Clear, Clouds, Rain, Thunder, Sun, Snow, Blizzard, Sand, Fog] as const
const weatherNames: Readonly<Record<number, string>> = {
  [Clear]: '맑음', [Clouds]: '흐림', [Rain]: '비', [Thunder]: '뇌우', [Sun]: '쾌청',
  [Snow]: '눈', [Blizzard]: '눈보라', [Sand]: '모래바람', [Fog]: '짙은 안개',
}
type NativeTable = readonly [weathers: number, min: number, max: number, speciesPercent: Readonly<Record<string, number>>]
type Wanderer = readonly [weathers: number, speciesId: string, level: number, championOnly?: boolean]
interface AreaTable {
  tables: readonly NativeTable[]
  wanderers?: readonly Wanderer[]
}

const wildAreas = [
  'rolling-fields', 'dappled-grove', 'watchtower-ruins', 'east-lake-axewell', 'west-lake-axewell', 'axews-eye',
  'south-lake-miloch', 'giants-seat', 'north-lake-miloch', 'motostoke-riverbank', 'bridge-field',
  'stony-wilderness', 'dusty-bowl', 'giants-mirror', 'hammerlocke-hills', 'giants-cap', 'lake-of-outrage',
]
export const galarWildAreaIds: ReadonlySet<string> = new Set(wildAreas)

const areas: Readonly<Record<string, AreaTable>> = {
  'axews-eye': {
    tables: [
      // Symbol · Axew's Eye
      [Clear, 36, 40, { bewear: 60, kingler: 25, axew: 10, machoke: 5 }],
      [Clouds, 36, 40, { bewear: 60, machoke: 25, axew: 10, kingler: 5 }],
      [Rain, 36, 40, { crawdaunt: 60, bewear: 25, axew: 10, seismitoad: 5 }],
      [Thunder, 36, 40, { seismitoad: 60, crawdaunt: 25, kingler: 10, bewear: 5 }],
      [Sun, 36, 40, { crustle: 60, bewear: 25, mudsdale: 10, vulpix: 5 }],
      [Snow, 36, 40, { snover: 60, vanillish: 25, bewear: 10, delibird: 5 }],
      [Blizzard, 36, 40, { snover: 60, bronzong: 25, bewear: 10, vanillish: 5 }],
      [Sand, 36, 40, { mudsdale: 60, bewear: 25, crustle: 10, claydol: 5 }],
      [Fog, 36, 40, { drifblim: 60, claydol: 25, axew: 10, bewear: 5 }],
      // Hidden · Axew's Eye
      [Clear, 35, 40, { unfezant: 40, diggersby: 30, bewear: 20, steenee: 10 }],
      [Clouds, 35, 40, { roselia: 40, gloom: 30, diggersby: 20, unfezant: 10 }],
      [Rain, 35, 40, { pelipper: 40, charjabug: 30, diggersby: 20, unfezant: 10 }],
      [Thunder, 35, 40, { crawdaunt: 40, manectric: 30, diggersby: 20, unfezant: 10 }],
      [Sun, 35, 40, { vulpix: 40, unfezant: 30, diggersby: 20, mudsdale: 10 }],
      [Snow, 35, 40, { snover: 40, vanillish: 30, diggersby: 20, unfezant: 10 }],
      [Blizzard, 35, 40, { klink: 40, snover: 30, delibird: 20, diggersby: 10 }],
      [Sand, 35, 40, { baltoy: 40, crustle: 30, mudsdale: 20, diggersby: 10 }],
      [Fog, 35, 40, { munna: 40, liepard: 30, diggersby: 20, unfezant: 10 }],
      // Fishing · Axew's Eye
      [AllWeather, 35, 40, { magikarp: 50, octillery: 25, wishiwashi: 20, gyarados: 5 }],
      // Berry Tree · shaking
      [AllWeather, 35, 40, { greedent: 75, cherubi: 25 }],
    ],
    wanderers: [
      [Snow | Blizzard, 'abomasnow', 60],
      [AllWeather, 'cramorant', 65, true],
      [Clear | Clouds | Rain | Sun | Sand | Fog, 'haxorus', 60],
      [Thunder, 'seismitoad', 60],
    ],
  },
  'bridge-field': {
    tables: [
      // Symbol · Bridge Field
      [Clear, 27, 29, { cutiefly: 30, zigzagoon: 34, wobbuffet: 10, toxel: 5, noibat: 10, elgyem: 10, cufant: 1 }],
      [Clouds, 27, 29, { zigzagoon: 35, cutiefly: 25, scraggy: 10, sawk: 5, noibat: 10, elgyem: 10, cufant: 5 }],
      [Rain, 27, 29, { zigzagoon: 33, stufful: 30, toxel: 15, cramorant: 2, noibat: 10, bronzor: 10 }],
      [Thunder, 27, 29, { stufful: 35, zigzagoon: 30, frillish: 10, toxel: 5, noibat: 10, bronzor: 10 }],
      [Sun, 27, 29, { maractus: 35, cutiefly: 20, wobbuffet: 15, zigzagoon: 5, noibat: 10, baltoy: 10, cufant: 5 }],
      [Snow, 27, 29, { cubchoo: 40, zigzagoon: 35, sneasel: 10, stufful: 5, noibat: 10 }],
      [Blizzard, 27, 29, { sneasel: 40, cubchoo: 35, zigzagoon: 10, cufant: 10, noibat: 5 }],
      [Sand, 27, 29, { bonsly: 40, zigzagoon: 25, stufful: 10, scraggy: 5, noibat: 10, baltoy: 10 }],
      [Fog, 27, 29, { cutiefly: 30, munna: 25, zigzagoon: 10, stufful: 5, noibat: 10, elgyem: 20 }],
      // Symbol · Bridge Field (Surfing)
      [Clear, 40, 43, { goldeen: 55, qwilfish: 30, inkay: 15 }],
      [Clouds | Fog, 40, 43, { goldeen: 40, qwilfish: 45, inkay: 15 }],
      [Rain, 40, 43, { goldeen: 45, qwilfish: 40, inkay: 15 }],
      [Thunder, 40, 43, { qwilfish: 55, goldeen: 30, inkay: 15 }],
      [Sun, 40, 43, { qwilfish: 60, goldeen: 25, inkay: 15 }],
      [Snow, 40, 43, { vanillite: 50, goldeen: 20, qwilfish: 15, inkay: 15 }],
      [Blizzard, 40, 43, { vanillite: 55, qwilfish: 20, goldeen: 10, inkay: 15 }],
      [Sand, 40, 43, { qwilfish: 50, goldeen: 35, inkay: 15 }],
      // Symbol · Bridge Field (Flying)
      [Clear, 27, 29, { noibat: 60, woobat: 35, tranquill: 5 }],
      [Clouds, 27, 29, { noibat: 50, woobat: 35, tranquill: 15 }],
      [Rain, 27, 29, { noibat: 45, tranquill: 35, woobat: 20 }],
      [Thunder, 27, 29, { noibat: 70, woobat: 25, tranquill: 5 }],
      [Sun, 27, 29, { tranquill: 50, noibat: 35, woobat: 15 }],
      [Snow, 27, 29, { vanillite: 50, woobat: 30, tranquill: 15, noibat: 5 }],
      [Blizzard, 27, 29, { vanillite: 50, tranquill: 35, noibat: 10, woobat: 5 }],
      [Sand, 27, 29, { tranquill: 55, woobat: 35, noibat: 10 }],
      [Fog, 27, 29, { woobat: 65, noibat: 25, tranquill: 10 }],
      // Hidden · Bridge Field
      [Clear, 26, 28, { thievul: 28, wobbuffet: 25, inkay: 20, liepard: 10, palpitoad: 10, ferroseed: 5, togepi: 2 }],
      [Clouds, 26, 28, { karrablast: 30, thievul: 23, diggersby: 20, shelmet: 10, palpitoad: 10, ferroseed: 5, togepi: 2 }],
      [Rain, 26, 28, { binacle: 30, shellos: 25, inkay: 10, wimpod: 10, palpitoad: 20, ferroseed: 5 }],
      [Thunder, 26, 28, { noibat: 20, binacle: 25, shellos: 20, inkay: 10, palpitoad: 20, ferroseed: 5 }],
      [Sun, 26, 28, { inkay: 30, litwick: 25, thievul: 20, carkol: 10, palpitoad: 10, ferroseed: 5 }],
      [Snow, 26, 28, { sneasel: 30, thievul: 25, vanillite: 20, inkay: 10, palpitoad: 10, ferroseed: 5 }],
      [Blizzard, 26, 28, { sneasel: 30, cubchoo: 25, inkay: 20, mawile: 10, palpitoad: 10, ferroseed: 5 }],
      [Sand, 26, 28, { rhyhorn: 30, rufflet: 25, sudowoodo: 20, inkay: 10, palpitoad: 10, ferroseed: 5 }],
      [Fog, 26, 28, { milcery: 30, litwick: 25, elgyem: 20, thievul: 5, palpitoad: 10, ferroseed: 5, togepi: 5 }],
      // Fishing · Bridge Field
      [AllWeather, 26, 28, { drednaw: 30, lanturn: 25, qwilfish: 10, gyarados: 5, magikarp: 30 }],
      // Berry Tree · shaking
      [AllWeather, 26, 28, { greedent: 75, cherubi: 25 }],
    ],
    wanderers: [
      [Snow, 'beartic', 60],
      [Clear | Clouds | Snow | Blizzard | Fog, 'beheeyem', 42],
      [Clear | Rain | Thunder | Snow | Blizzard | Fog, 'bewear', 42],
      [Sun | Sand, 'bewear', 46],
      [Rain | Thunder, 'bronzong', 42],
      [Sun | Sand, 'claydol', 42],
      [Clouds, 'drapion', 50],
      [AllWeather, 'ferrothorn', 40],
      [Clear | Clouds | Rain | Thunder | Sun | Sand, 'gallade', 60],
      [AllWeather, 'garbodor', 40],
      [Clear | Rain | Thunder, 'golisopod', 50],
      [AllWeather, 'greedent', 42],
      [AllWeather, 'gyarados', 56],
      [Rain | Fog, 'jellicent', 46],
      [AllWeather, 'linoone', 40],
      [Fog, 'mimikyu', 50],
      [Fog, 'musharna', 60],
      [Snow, 'noctowl', 50],
      [Clear | Clouds | Rain | Thunder | Sun | Blizzard | Sand | Fog, 'noivern', 50],
      [AllWeather, 'obstagoon', 65, true],
      [Clouds | Sun, 'pangoro', 42],
      [Sun, 'pelipper', 46],
      [Sun | Sand, 'rhydon', 50],
      [Clear | Clouds | Sun | Fog, 'ribombee', 40],
      [Clear | Clouds | Sand, 'seaking', 46],
      [Clear | Clouds | Rain | Thunder | Fog, 'seismitoad', 36],
      [Snow | Blizzard, 'vanilluxe', 50],
      [Blizzard, 'weavile', 60],
    ],
  },
  'circhester-bay': {
    tables: [
      // Symbol · Route 9 (in Circhester Bay)
      [AllWeather, 39, 43, { clobbopus: 30, octillery: 24, toxapex: 20, barbaracle: 10, bergmite: 15, dhelmise: 1 }],
      // Symbol · Route 9 (in Circhester Bay) (Surfing)
      [AllWeather, 39, 43, { wailmer: 40, remoraid: 15, mantyke: 35, mantine: 10 }],
      // Hidden · Route 9 (in Circhester Bay)
      [AllWeather, 39, 43, { cramorant: 40, gastrodon: 30, inkay: 25, pincurchin: 5 }],
      // Fishing · Route 9 (in Circhester Bay)
      [AllWeather, 39, 43, { mantyke: 50, wailmer: 34, mantine: 10, wailord: 5, lapras: 1 }],
      // Berry Tree · shaking
      [AllWeather, 39, 43, { greedent: 100 }],
    ],
    wanderers: [
      [AllWeather, 'grapploct', 50],
    ],
  },
  'dappled-grove': {
    tables: [
      // Symbol · Dappled Grove
      [Clear, 13, 15, { oddish: 60, hoothoot: 25, bunnelby: 10, nuzleaf: 5 }],
      [Clouds, 13, 15, { oddish: 60, hoothoot: 28, nuzleaf: 10, tyrogue: 2 }],
      [Rain, 13, 15, { tympole: 60, oddish: 25, bunnelby: 10, nuzleaf: 5 }],
      [Thunder, 13, 15, { tympole: 60, electrike: 25, oddish: 10, nuzleaf: 5 }],
      [Sun, 13, 15, { baltoy: 60, bunnelby: 28, nuzleaf: 10, vulpix: 2 }],
      [Snow, 13, 15, { delibird: 60, bunnelby: 25, hoothoot: 10, nuzleaf: 5 }],
      [Blizzard, 13, 15, { delibird: 60, vanillite: 25, bunnelby: 10, nuzleaf: 5 }],
      [Sand, 13, 15, { baltoy: 60, bunnelby: 25, hoothoot: 10, nuzleaf: 5 }],
      [Fog, 13, 15, { purrloin: 60, ralts: 25, hoothoot: 10, nuzleaf: 5 }],
      // Hidden · Dappled Grove
      [Clear, 11, 15, { seedot: 40, budew: 35, bunnelby: 20, bounsweet: 5 }],
      [Clouds, 11, 15, { stufful: 40, stunky: 35, seedot: 20, budew: 5 }],
      [Rain, 11, 15, { tympole: 40, grubbin: 35, seedot: 20, budew: 5 }],
      [Thunder, 11, 15, { joltik: 40, grubbin: 35, seedot: 20, budew: 5 }],
      [Sun, 11, 15, { vulpix: 40, mudbray: 35, bunnelby: 20, budew: 5 }],
      [Snow, 11, 15, { snover: 40, vanillite: 35, snorunt: 20, bunnelby: 5 }],
      [Blizzard, 11, 15, { snorunt: 40, vanillite: 35, klink: 20, bunnelby: 5 }],
      [Sand, 11, 15, { baltoy: 40, golett: 35, bunnelby: 20, bounsweet: 5 }],
      [Fog, 11, 15, { ralts: 40, seedot: 35, purrloin: 20, budew: 5 }],
      // Berry Tree · shaking
      [AllWeather, 11, 15, { skwovet: 70, cherubi: 30 }],
    ],
    wanderers: [
      [AllWeather, 'bewear', 34],
      [Sun | Sand, 'claydol', 36],
      [AllWeather, 'orbeetle', 65, true],
      [Sun | Snow | Blizzard | Sand, 'pangoro', 32],
      [Rain | Thunder, 'seismitoad', 36],
      [Clear | Clouds | Rain | Thunder | Fog, 'shiftry', 34],
      [Snow | Blizzard, 'vanillish', 36],
      [Clear | Clouds | Fog, 'vileplume', 36],
    ],
  },
  'dusty-bowl': {
    tables: [
      // Symbol · Dusty Bowl
      [Clear, 42, 47, { nickit: 50, koffing: 35, scraggy: 15 }],
      [Clouds, 42, 47, { scraggy: 60, nickit: 35, hitmonlee: 5 }],
      [Rain, 42, 47, { electrike: 50, palpitoad: 35, nickit: 10, koffing: 5 }],
      [Thunder, 42, 47, { electrike: 50, nickit: 35, palpitoad: 15 }],
      [Sun, 42, 47, { hippopotas: 55, growlithe: 30, drilbur: 10, nickit: 5 }],
      [Snow, 42, 47, { cubchoo: 50, sneasel: 35, vanillish: 10, delibird: 5 }],
      [Blizzard, 42, 47, { snover: 50, mawile: 35, cubchoo: 15 }],
      [Sand, 42, 47, { hippopotas: 60, drilbur: 35, shuckle: 5 }],
      [Fog, 42, 47, { wobbuffet: 55, duskull: 35, gothorita: 10 }],
      // Symbol · Dusty Bowl (Flying)
      [Clear | Clouds | Rain | Thunder | Sun | Snow | Blizzard | Sand, 54, 54, { braviary: 100 }],
      [Fog, 54, 54, { braviary: 98, togekiss: 2 }],
      // Symbol · Dusty Bowl and Giant's Mirror (Surfing)
      [Clear | Thunder, 41, 45, { shellos: 65, frillish: 35 }],
      [Clouds | Fog, 41, 45, { frillish: 50, shellos: 50 }],
      [Rain, 41, 45, { shellos: 55, frillish: 45 }],
      [Sun, 41, 45, { shellos: 70, frillish: 30 }],
      [Snow, 41, 45, { vanillite: 50, shellos: 30, inkay: 20 }],
      [Blizzard, 41, 42, { vanillite: 65, shellos: 20, frillish: 15 }],
      [Sand, 41, 45, { shellos: 60, frillish: 40 }],
      // Hidden · Dusty Bowl
      [Clear, 40, 45, { eldegoss: 40, dubwool: 30, hattrem: 20, applin: 10 }],
      [Clouds, 40, 45, { skuntank: 40, eldegoss: 30, hattrem: 20, roselia: 10 }],
      [Rain, 40, 45, { pelipper: 40, barbaracle: 30, eldegoss: 20, hattrem: 10 }],
      [Thunder, 40, 45, { drednaw: 40, boltund: 30, charjabug: 20, eldegoss: 10 }],
      [Sun, 40, 45, { rhydon: 58, stunfisk: 30, coalossal: 2, mudsdale: 10 }],
      [Snow, 40, 45, { piloswine: 40, abomasnow: 30, corviknight: 20, gurdurr: 10 }],
      [Blizzard, 40, 45, { bronzong: 40, klang: 30, hattrem: 20, ferrothorn: 10 }],
      [Sand, 40, 45, { dugtrio: 40, sudowoodo: 30, eldegoss: 20, hattrem: 10 }],
      [Fog, 40, 45, { meowstic: 45, hattrem: 30, eldegoss: 20, gardevoir: 5 }],
      // Fishing · Dusty Bowl
      [AllWeather, 40, 45, { barraskewda: 50, lanturn: 35, qwilfish: 10, gyarados: 5 }],
    ],
    wanderers: [
      [Clouds | Rain | Thunder, 'barbaracle', 60],
      [Clear | Rain | Thunder | Snow | Blizzard | Fog, 'bronzong', 41],
      [Clouds | Sun | Sand, 'claydol', 41],
      [Fog, 'dusclops', 41],
      [Clear | Sand, 'flygon', 51],
      [AllWeather, 'gastrodon', 56],
      [Clear | Sun, 'gigalith', 51],
      [Clouds | Rain | Thunder | Snow | Blizzard | Sand | Fog, 'golurk', 51],
      [AllWeather, 'gyarados', 56],
      [Clear | Sun | Snow | Blizzard | Sand | Fog, 'kommo-o', 60],
      [Clear | Sun | Sand, 'mudsdale', 41],
      [Snow | Blizzard, 'piloswine', 41],
      [AllWeather, 'sandaconda', 65, true],
      [Rain | Thunder, 'seismitoad', 41],
      [AllWeather, 'shuckle', 34],
      [Clouds | Rain | Thunder | Sun | Snow | Blizzard | Fog, 'sigilyph', 51],
      [Clouds, 'skuntank', 41],
      [Clear | Clouds | Sun | Snow | Blizzard | Sand | Fog, 'sudowoodo', 41],
    ],
  },
  'east-lake-axewell': {
    tables: [
      // Symbol · East Lake Axewell
      [Clear, 10, 15, { stufful: 50, oddish: 35, bounsweet: 15 }],
      [Clouds, 10, 15, { stufful: 50, pancham: 35, oddish: 15 }],
      [Rain, 10, 15, { wingull: 50, stufful: 35, grubbin: 15 }],
      [Thunder, 10, 15, { electrike: 60, stufful: 25, oddish: 10, pancham: 5 }],
      [Sun, 10, 15, { mudbray: 60, vulpix: 25, stufful: 10, pancham: 5 }],
      [Snow, 10, 15, { snover: 60, stufful: 25, pancham: 10, snorunt: 5 }],
      [Blizzard, 10, 15, { snorunt: 60, stufful: 25, pancham: 15 }],
      [Sand, 10, 15, { baltoy: 60, mudbray: 25, stufful: 10, pancham: 5 }],
      [Fog, 10, 15, { munna: 60, stufful: 25, oddish: 15 }],
      // Symbol · East Lake Axewell (Surfing)
      [Clear, 40, 43, { wingull: 55, frillish: 25, shellder: 15, goldeen: 5 }],
      [Clouds, 40, 43, { frillish: 55, goldeen: 25, shellder: 15, wingull: 5 }],
      [Rain, 40, 43, { shellder: 45, frillish: 35, goldeen: 15, wingull: 5 }],
      [Thunder, 40, 43, { chinchou: 70, wingull: 15, shellder: 10, goldeen: 5 }],
      [Sun, 40, 43, { wingull: 70, frillish: 15, shellder: 10, goldeen: 5 }],
      [Snow, 40, 43, { vanillite: 40, frillish: 30, shellder: 20, wingull: 10 }],
      [Blizzard, 40, 43, { vanillite: 75, goldeen: 15, shellder: 5, wingull: 5 }],
      [Sand, 40, 43, { goldeen: 55, shellder: 30, frillish: 10, wingull: 5 }],
      [Fog, 40, 43, { frillish: 60, wingull: 25, goldeen: 10, shellder: 5 }],
      // Symbol · East Lake Axewell (Flying)
      [AllWeather, 12, 15, { pidove: 70, butterfree: 30 }],
      // Hidden · East Lake Axewell
      [Clear, 8, 12, { oddish: 45, bunnelby: 30, pidove: 20, stufful: 5 }],
      [Clouds, 8, 12, { budew: 45, oddish: 30, minccino: 20, stufful: 5 }],
      [Rain, 8, 12, { wingull: 45, grubbin: 30, oddish: 20, stufful: 5 }],
      [Thunder, 8, 12, { joltik: 45, electrike: 30, oddish: 20, stufful: 5 }],
      [Sun, 8, 12, { mudbray: 40, vulpix: 30, minccino: 15, stufful: 5, onix: 10 }],
      [Snow, 8, 12, { snorunt: 45, snover: 30, minccino: 20, stufful: 5 }],
      [Blizzard, 8, 12, { vanillite: 45, snover: 30, minccino: 20, stufful: 5 }],
      [Sand, 8, 12, { dwebble: 40, baltoy: 30, minccino: 15, stufful: 5, onix: 10 }],
      [Fog, 8, 12, { purrloin: 45, munna: 30, minccino: 20, stufful: 5 }],
      // Fishing · East Lake Axewell
      [AllWeather, 8, 12, { magikarp: 50, goldeen: 25, shellder: 20, wishiwashi: 5 }],
    ],
    wanderers: [
      [Fog, 'bronzong', 36],
      [Clear | Fog, 'cloyster', 46],
      [Clear | Clouds | Rain | Thunder, 'garbodor', 36],
      [AllWeather, 'gyarados', 56],
      [Clear | Clouds | Rain | Thunder | Fog, 'jellicent', 46],
      [Clear | Thunder | Fog, 'lanturn', 46],
      [Sun | Sand, 'mudsdale', 36],
      [Clear | Clouds | Rain | Thunder | Sun, 'pelipper', 46],
      [Snow | Blizzard, 'piloswine', 36],
      [Clear | Clouds | Sun | Sand, 'seaking', 46],
      [Snow | Blizzard, 'vanilluxe', 47],
      [AllWeather, 'weezing', 65, true],
      [Clear | Clouds | Sun | Snow | Blizzard | Sand | Fog, 'xatu', 26],
    ],
  },
  'galar-mine': {
    tables: [
      // Symbol · Galar Mine
      [AllWeather, 11, 14, { rolycoly: 35, timburr: 25, woobat: 15, diglett: 10, drilbur: 10, roggenrola: 5 }],
      // Hidden · Galar Mine
      [AllWeather, 11, 15, { rolycoly: 30, timburr: 30, diglett: 15, drilbur: 10, roggenrola: 5, woobat: 10 }],
    ],
    wanderers: [
      [AllWeather, 'carkol', 18],
      [AllWeather, 'woobat', 16],
    ],
  },
  'galar-mine-no-2': {
    tables: [
      // Symbol · Galar Mine No. 2
      [AllWeather, 20, 24, { shellos: 25, wimpod: 25, binacle: 15, scraggy: 15, chewtle: 5, shuckle: 5, noibat: 10 }],
      // Hidden · Galar Mine No. 2
      [AllWeather, 20, 24, { binacle: 10, wimpod: 20, noibat: 20, scraggy: 15, shuckle: 10, shellos: 10, stunfisk: 5, chewtle: 10 }],
      // Fishing · Galar Mine No. 2
      [AllWeather, 20, 24, { barboach: 55, chewtle: 30, corphish: 15 }],
    ],
    wanderers: [
      [AllWeather, 'drednaw', 24],
      [AllWeather, 'gastrodon', 50],
      [AllWeather, 'stunfisk', 25],
    ],
  },
  'galar-route-1': {
    tables: [
      // Symbol · Route 1
      [AllWeather, 3, 6, { skwovet: 50, rookidee: 30, wooloo: 15, nickit: 5 }],
      // Hidden · Route 1
      [AllWeather, 2, 5, { skwovet: 40, blipbug: 30, caterpie: 15, grubbin: 10, hoothoot: 5 }],
    ],
  },
  'galar-route-10': {
    tables: [
      // Symbol · Route 10 (Near Station)
      [AllWeather, 45, 48, { 'mr-mime': 30, cubchoo: 30, snover: 20, glalie: 10, vanilluxe: 10 }],
      // Symbol · Route 10
      [AllWeather, 45, 48, { 'mr-mime': 40, snover: 30, cubchoo: 15, sneasel: 14, duraludon: 1 }],
      // Hidden · Route 10 (Near Station)
      [AllWeather, 43, 46, { klang: 30, vanillish: 30, rhydon: 25, snom: 10, darumaka: 5 }],
      // Hidden · Route 10
      [AllWeather, 44, 46, { vanillish: 30, abomasnow: 28, beartic: 25, snom: 10, darumaka: 5, stonjourner: 2 }],
    ],
    wanderers: [
      [AllWeather, 'abomasnow', 55],
      [AllWeather, 'beartic', 55],
    ],
  },
  'galar-route-2': {
    tables: [
      // Symbol · Route 2
      [AllWeather, 5, 7, { skwovet: 38, rookidee: 30, nickit: 15, chewtle: 10, yamper: 5, zigzagoon: 2 }],
      // Hidden · Route 2
      [AllWeather, 4, 6, { blipbug: 40, rookidee: 25, seedot: 20, purrloin: 10, hoothoot: 5 }],
      // Fishing · Route 2
      [AllWeather, 4, 6, { magikarp: 80, chewtle: 15, arrokuda: 5 }],
    ],
    wanderers: [
      [AllWeather, 'chewtle', 8],
      [AllWeather, 'yamper', 8],
    ],
  },
  'galar-route-2-lakeside': {
    tables: [
      // Symbol · Route 2 (High Level)
      [AllWeather, 40, 43, { zigzagoon: 50, blipbug: 30, nickit: 15, yamper: 5 }],
      // Symbol · Route 2 (Surfing)
      [AllWeather, 38, 40, { arrokuda: 70, barraskewda: 28, gyarados: 2 }],
      // Hidden · Route 2 (High Level)
      [AllWeather, 37, 40, { gossifleur: 35, purrloin: 30, seedot: 20, blipbug: 10, chewtle: 5 }],
      // Fishing · Route 2 (High Level)
      [AllWeather, 37, 40, { magikarp: 59, chewtle: 40, feebas: 1 }],
    ],
    wanderers: [
      [AllWeather, 'drednaw', 50],
      [AllWeather, 'lapras', 55],
      [AllWeather, 'obstagoon', 50],
    ],
  },
  'galar-route-3': {
    tables: [
      // Symbol · Route 3
      [AllWeather, 10, 14, { zigzagoon: 38, gossifleur: 30, vulpix: 15, stunky: 10, trubbish: 5, tyrogue: 2 }],
      // Symbol · Route 3 (Garbage)
      [AllWeather, 10, 13, { rolycoly: 99, trubbish: 1 }],
      // Hidden · Route 3
      [AllWeather, 8, 13, { rookidee: 35, machop: 20, pancham: 20, mudbray: 15, klink: 9, sizzlipede: 1 }],
      // Berry Tree · shaking
      [AllWeather, 8, 13, { skwovet: 80, cherubi: 20 }],
    ],
    wanderers: [
      [AllWeather, 'corvisquire', 18],
    ],
  },
  'galar-route-4': {
    tables: [
      // Symbol · Route 4
      [AllWeather, 14, 16, { electrike: 30, meowth: 23, yamper: 20, pumpkaboo: 21, pikachu: 5, eevee: 1 }],
      // Hidden · Route 4
      [AllWeather, 13, 15, { meowth: 35, wooloo: 25, milcery: 20, joltik: 10, cutiefly: 5, budew: 4, ferroseed: 1 }],
      // Fishing · Route 4
      [AllWeather, 13, 15, { magikarp: 70, chewtle: 20, goldeen: 10 }],
      // Berry Tree · shaking
      [AllWeather, 13, 15, { skwovet: 100 }],
    ],
    wanderers: [
      [AllWeather, 'diglett', 17],
    ],
  },
  'galar-route-5': {
    tables: [
      // Symbol · Route 5
      [AllWeather, 19, 21, { stufful: 35, swirlix: 30, minccino: 15, wobbuffet: 10, farfetchd: 5, drifloon: 5 }],
      // Hidden · Route 5
      [AllWeather, 16, 18, { dottler: 26, espurr: 20, nuzleaf: 20, swirlix: 14, dewpider: 5, applin: 10, nincada: 5 }],
      // Fishing · Route 5
      [AllWeather, 16, 18, { magikarp: 70, chewtle: 20, goldeen: 10 }],
      // Berry Tree · shaking
      [AllWeather, 16, 18, { skwovet: 100 }],
    ],
    wanderers: [
      [AllWeather, 'eldegoss', 22],
    ],
  },
  'galar-route-6': {
    tables: [
      // Symbol · Route 6
      [AllWeather, 29, 33, { yamask: 35, helioptile: 29, dugtrio: 20, maractus: 10, axew: 5, trapinch: 1 }],
      // Hidden · Route 6
      [AllWeather, 28, 30, { silicobra: 30, durant: 20, duskull: 18, skorupi: 10, hippopotas: 10, heatmor: 5, torkoal: 5, hawlucha: 2 }],
      // Fishing · Route 6
      [AllWeather, 28, 30, { magikarp: 70, drednaw: 20, goldeen: 10 }],
      // Berry Tree · shaking
      [AllWeather, 28, 30, { greedent: 100 }],
    ],
  },
  'galar-route-7': {
    tables: [
      // Symbol · Route 7
      [AllWeather, 37, 41, { perrserker: 30, thievul: 20, galvantula: 20, liepard: 15, inkay: 10, morpeko: 5 }],
      // Hidden · Route 7
      [AllWeather, 36, 40, { toxel: 25, karrablast: 25, corviknight: 20, liepard: 10, meowstic: 10, seismitoad: 5, shelmet: 5 }],
      // Berry Tree · shaking
      [AllWeather, 36, 40, { greedent: 100 }],
    ],
  },
  'galar-route-8': {
    tables: [
      // Symbol · Route 8
      [AllWeather, 39, 41, { golett: 25, gurdurr: 25, pawniard: 20, boldore: 10, togedemaru: 5, rufflet: 10, solrock: 5 }],
      // Hidden · Route 8
      [AllWeather, 38, 40, { sandaconda: 30, rhyhorn: 20, dusclops: 15, haunter: 10, bronzong: 10, hippowdon: 8, drapion: 5, falinks: 2 }],
    ],
    wanderers: [
      [AllWeather, 'crustle', 40],
      [AllWeather, 'falinks', 40],
    ],
  },
  'galar-route-9': {
    tables: [
      // Symbol · Route 9
      [AllWeather, 41, 44, { pelipper: 40, mareanie: 35, gastrodon: 15, jellicent: 5, pyukumuku: 5 }],
      // Symbol · Route 9  (Surfing)
      [AllWeather, 39, 43, { pelipper: 40, qwilfish: 30, mantyke: 25, jellicent: 5 }],
      // Hidden · Route 9
      [AllWeather, 38, 42, { cramorant: 40, octillery: 30, kingler: 25, pincurchin: 5 }],
      // Fishing · Route 9
      [AllWeather, 38, 42, { octillery: 60, wishiwashi: 30, pyukumuku: 10 }],
    ],
    wanderers: [
      [AllWeather, 'glalie', 55],
    ],
  },
  'giants-cap': {
    tables: [
      // Symbol · Giant's Cap
      [Clear, 28, 30, { noctowl: 40, linoone: 35, liepard: 10, scraggy: 5, minccino: 10 }],
      [Clouds, 28, 30, { linoone: 40, scraggy: 35, gloom: 10, noctowl: 5, minccino: 10 }],
      [Rain, 28, 30, { drednaw: 40, quagsire: 35, noctowl: 10, linoone: 5, minccino: 10 }],
      [Thunder, 28, 30, { quagsire: 40, drednaw: 35, manectric: 10, noctowl: 5, minccino: 10 }],
      [Sun, 28, 30, { carkol: 40, diggersby: 35, torkoal: 10, noctowl: 5, minccino: 10 }],
      [Snow, 28, 30, { vanillite: 40, sneasel: 35, linoone: 10, noctowl: 5, minccino: 10 }],
      [Blizzard, 28, 30, { sneasel: 40, vanillite: 35, linoone: 10, riolu: 5, minccino: 10 }],
      [Sand, 28, 30, { carkol: 40, diggersby: 35, noctowl: 10, shuckle: 5, minccino: 10 }],
      [Fog, 28, 30, { gothita: 40, clefairy: 35, noctowl: 10, linoone: 5, minccino: 10 }],
      // Symbol · Giant's Cap (Ground)
      [Clear | Clouds | Sun | Sand | Fog, 31, 34, { rolycoly: 60, rhyhorn: 30, boldore: 10 }],
      [Rain | Thunder | Snow | Blizzard, 31, 34, { rhyhorn: 60, rolycoly: 30, boldore: 10 }],
      // Symbol · Giant's Cap (2)
      [Clear, 28, 30, { dottler: 50, blipbug: 35, hoothoot: 10, scraggy: 5 }],
      [Clouds, 28, 30, { dottler: 50, scraggy: 35, gloom: 10, hoothoot: 5 }],
      [Rain, 28, 30, { dottler: 50, wooper: 35, hoothoot: 10, chewtle: 5 }],
      [Thunder, 28, 30, { dottler: 50, chewtle: 35, wooper: 10, hoothoot: 5 }],
      [Sun, 28, 30, { rolycoly: 50, dottler: 35, torkoal: 10, hoothoot: 5 }],
      [Snow, 28, 30, { vanillite: 50, dottler: 35, sneasel: 10, hoothoot: 5 }],
      [Blizzard, 28, 30, { sneasel: 50, dottler: 35, vanillite: 10, riolu: 5 }],
      [Sand, 28, 30, { bunnelby: 50, dottler: 35, hoothoot: 10, shuckle: 5 }],
      [Fog, 28, 30, { gothita: 50, dottler: 35, clefairy: 10, hoothoot: 5 }],
      // Symbol · Giant's Cap (3)
      [Clear, 29, 32, { chewtle: 50, blipbug: 35, zigzagoon: 10, scraggy: 5 }],
      [Clouds, 29, 32, { chewtle: 50, scraggy: 35, gloom: 10, zigzagoon: 5 }],
      [Rain, 29, 32, { chewtle: 50, wooper: 35, zigzagoon: 10, gloom: 5 }],
      [Thunder, 29, 32, { chewtle: 50, gloom: 35, wooper: 10, zigzagoon: 5 }],
      [Sun, 29, 32, { rolycoly: 50, chewtle: 35, torkoal: 10, zigzagoon: 5 }],
      [Snow, 29, 32, { vanillite: 50, chewtle: 35, sneasel: 10, zigzagoon: 5 }],
      [Blizzard, 29, 32, { sneasel: 50, chewtle: 35, vanillite: 10, riolu: 5 }],
      [Sand, 29, 32, { bunnelby: 50, chewtle: 35, zigzagoon: 10, shuckle: 5 }],
      [Fog, 29, 32, { gothorita: 50, chewtle: 35, clefairy: 10, zigzagoon: 5 }],
      // Symbol · Giant's Cap (Lunatone/Solrock)
      [AllWeather, 41, 44, { solrock: 100 }],
      // Hidden · Giant's Cap
      [Clear, 27, 29, { nuzleaf: 40, dottler: 30, eldegoss: 20, stunky: 10 }],
      [Clouds, 27, 29, { eldegoss: 40, dottler: 30, munna: 20, karrablast: 10 }],
      [Rain, 26, 28, { palpitoad: 40, shellos: 30, dottler: 20, eldegoss: 10 }],
      [Thunder, 26, 28, { joltik: 40, toxel: 30, shellos: 20, dottler: 10 }],
      [Sun, 26, 28, { golett: 40, baltoy: 30, drilbur: 20, dugtrio: 10 }],
      [Snow, 26, 28, { snover: 40, snorunt: 30, delibird: 20, dottler: 10 }],
      [Blizzard, 26, 28, { snorunt: 40, pawniard: 30, delibird: 20, dottler: 10 }],
      [Sand, 26, 28, { golett: 40, drilbur: 30, mudbray: 20, dottler: 10 }],
      [Fog, 26, 28, { munna: 40, dottler: 30, duskull: 20, eldegoss: 10 }],
      // Fishing · Giant's Cap
      [AllWeather, 26, 28, { goldeen: 50, krabby: 35, corphish: 10, gyarados: 5 }],
      // Berry Tree · shaking
      [AllWeather, 26, 28, { greedent: 75, cherubi: 25 }],
    ],
    wanderers: [
      [Fog, 'aegislash', 58],
      [Snow, 'beartic', 60],
      [Clear | Clouds | Fog, 'cinccino', 46],
      [AllWeather, 'coalossal', 65, true],
      [AllWeather, 'corviknight', 39],
      [Clear | Clouds | Rain | Thunder | Sun | Snow | Blizzard | Sand, 'doublade', 56],
      [AllWeather, 'drednaw', 36],
      [Sun | Sand, 'excadrill', 46],
      [Clear | Clouds | Thunder | Sun | Blizzard | Sand | Fog, 'gengar', 60],
      [Snow | Blizzard, 'glalie', 46],
      [Rain, 'golisopod', 60],
      [AllWeather, 'orbeetle', 41],
      [Rain, 'seismitoad', 46],
    ],
  },
  'giants-mirror': {
    tables: [
      // Symbol · Giant's Mirror
      [Clear, 28, 30, { woobat: 35, pumpkaboo: 41, tranquill: 10, nickit: 4, gloom: 10 }],
      [Clouds, 28, 30, { butterfree: 40, tranquill: 35, sawk: 10, farfetchd: 5, gloom: 10 }],
      [Rain, 28, 30, { wimpod: 40, palpitoad: 35, natu: 10, chewtle: 5, gloom: 10 }],
      [Thunder, 28, 30, { helioptile: 40, joltik: 35, yamper: 10, natu: 5, gloom: 10 }],
      [Sun, 28, 30, { durant: 40, tranquill: 45, heatmor: 5, gloom: 10 }],
      [Snow, 28, 30, { vanillite: 50, cubchoo: 35, natu: 10, delibird: 5 }],
      [Blizzard, 28, 30, { pawniard: 50, vanillite: 35, cubchoo: 10, natu: 5 }],
      [Sand, 28, 30, { rhyhorn: 50, drilbur: 35, tranquill: 15 }],
      [Fog, 28, 30, { swirlix: 40, morelull: 35, natu: 10, cutiefly: 5, gloom: 10 }],
      // Symbol · Giant's Mirror (Flying)
      [AllWeather, 28, 30, { tranquill: 60, corvisquire: 40 }],
      // Symbol · Giant's Mirror (Ground)
      [Clear | Clouds | Rain | Thunder | Fog, 31, 34, { dugtrio: 60, excadrill: 30, boldore: 10 }],
      [Sun | Snow | Blizzard | Sand, 31, 34, { excadrill: 60, dugtrio: 30, boldore: 10 }],
      // Symbol · Dusty Bowl and Giant's Mirror (Surfing)
      [Clear | Thunder, 41, 45, { shellos: 65, frillish: 35 }],
      [Clouds | Fog, 41, 45, { frillish: 50, shellos: 50 }],
      [Rain, 41, 45, { shellos: 55, frillish: 45 }],
      [Sun, 41, 45, { shellos: 70, frillish: 30 }],
      [Snow, 41, 45, { vanillite: 50, shellos: 30, inkay: 20 }],
      [Blizzard, 41, 42, { vanillite: 65, shellos: 20, frillish: 15 }],
      [Sand, 41, 45, { shellos: 60, frillish: 40 }],
      // Hidden · Giant's Mirror
      [Clear, 27, 29, { koffing: 30, skorupi: 30, dottler: 20, budew: 10, machop: 10 }],
      [Clouds, 27, 29, { skorupi: 30, koffing: 30, roselia: 20, dottler: 10, machop: 10 }],
      [Rain, 26, 28, { shellos: 30, skorupi: 30, koffing: 20, dottler: 10, machop: 10 }],
      [Thunder, 26, 28, { joltik: 30, applin: 30, skorupi: 20, koffing: 10, machop: 10 }],
      [Sun, 26, 28, { diglett: 30, skorupi: 30, koffing: 20, torkoal: 10, machop: 10 }],
      [Snow, 26, 28, { swinub: 30, cubchoo: 30, snover: 20, koffing: 10, machop: 10 }],
      [Blizzard, 26, 28, { cubchoo: 30, swinub: 30, snover: 20, koffing: 10, machop: 10 }],
      [Sand, 26, 28, { hippowdon: 30, diggersby: 30, dottler: 20, koffing: 10, machop: 10 }],
      [Fog, 26, 28, { impidimp: 35, milcery: 32, koffing: 20, mimikyu: 3, machop: 10 }],
      // Fishing · Giant's Mirror
      [AllWeather, 26, 28, { drednaw: 50, mareanie: 35, chinchou: 10, gyarados: 5 }],
      // Berry Tree · shaking
      [AllWeather, 26, 28, { greedent: 75, cherubi: 25 }],
    ],
    wanderers: [
      [Snow, 'abomasnow', 60],
      [Clear | Sun | Fog, 'bellossom', 41],
      [AllWeather, 'gastrodon', 56],
      [AllWeather, 'machamp', 60],
      [AllWeather, 'perrserker', 65, true],
      [Rain, 'seismitoad', 60],
      [AllWeather, 'steelix', 50],
      [Clear | Clouds | Sun, 'unfezant', 41],
      [Clouds | Rain | Thunder | Snow | Blizzard | Sand, 'vileplume', 41],
      [Rain | Snow | Blizzard | Sand | Fog, 'xatu', 41],
    ],
  },
  'giants-seat': {
    tables: [
      // Symbol · Giant's Seat
      [Clear, 33, 38, { bronzor: 60, nuzleaf: 25, machoke: 10, stufful: 5 }],
      [Clouds, 33, 38, { machop: 60, gastly: 28, bronzor: 10, tyrogue: 2 }],
      [Rain, 33, 38, { nuzleaf: 60, bronzor: 25, gastly: 10, wooper: 5 }],
      [Thunder, 33, 38, { electrike: 60, bronzor: 28, palpitoad: 12 }],
      [Sun, 33, 38, { mudbray: 60, gastly: 25, bronzor: 10, vulpix: 5 }],
      [Snow, 33, 38, { snover: 60, snorunt: 25, machop: 10, bronzor: 5 }],
      [Blizzard, 33, 38, { snover: 60, snorunt: 25, bronzor: 10, delibird: 5 }],
      [Sand, 33, 38, { golett: 60, bronzor: 25, machop: 10, stufful: 5 }],
      [Fog, 33, 38, { duskull: 60, natu: 28, gastly: 10, munna: 2 }],
      // Hidden · Giant's Seat
      [Clear, 30, 35, { bewear: 40, diggersby: 20, tranquill: 15, bronzor: 5, onix: 20 }],
      [Clouds, 30, 35, { machoke: 40, bewear: 20, haunter: 15, bronzor: 5, onix: 20 }],
      [Rain, 30, 35, { quagsire: 50, bewear: 30, nuzleaf: 15, bronzor: 5 }],
      [Thunder, 30, 35, { manectric: 50, bewear: 30, crawdaunt: 15, bronzor: 5 }],
      [Sun, 30, 35, { dwebble: 40, bewear: 20, mudsdale: 15, bronzor: 5, onix: 20 }],
      [Snow, 30, 35, { delibird: 50, bewear: 30, swinub: 15, bronzor: 5 }],
      [Blizzard, 30, 35, { delibird: 50, bronzor: 30, swinub: 15, bewear: 5 }],
      [Sand, 30, 35, { mudsdale: 40, bewear: 20, dwebble: 15, bronzor: 5, onix: 20 }],
      [Fog, 30, 35, { xatu: 50, bewear: 30, liepard: 15, bronzor: 5 }],
      // Fishing · Giant's Seat
      [AllWeather, 30, 35, { shellder: 60, pyukumuku: 25, gyarados: 10, cloyster: 5 }],
      // Berry Tree · shaking
      [AllWeather, 30, 35, { greedent: 70, cherubi: 30 }],
    ],
    wanderers: [
      [Snow | Blizzard, 'abomasnow', 46],
      [AllWeather, 'bisharp', 52],
      [Clouds | Rain, 'bronzong', 46],
      [AllWeather, 'duraludon', 65, true],
      [Fog, 'dusclops', 46],
      [Rain, 'galvantula', 46],
      [Snow | Blizzard, 'glalie', 46],
      [Sand, 'golurk', 46],
      [Sun, 'mudsdale', 46],
      [Fog, 'musharna', 46],
      [Clear, 'rhydon', 46],
      [AllWeather, 'steelix', 50],
      [Clear | Clouds | Sun | Sand, 'vikavolt', 46],
    ],
  },
  'glimwood-tangle': {
    tables: [
      // Hidden · Glimwood Tangle
      [AllWeather, 34, 36, { morgrem: 20, shiinotic: 20, hattrem: 15, sinistea: 11, phantump: 10, swirlix: 10, passimian: 9, indeedee: 5 }],
    ],
    wanderers: [
      [AllWeather, 'impidimp', 31],
      [AllWeather, 'morgrem', 38],
    ],
  },
  'hammerlocke-hills': {
    tables: [
      // Symbol · Hammerlocke Hills
      [Clear, 29, 31, { wobbuffet: 45, stufful: 29, sudowoodo: 10, machoke: 5, pumpkaboo: 11 }],
      [Clouds, 29, 31, { stufful: 45, wobbuffet: 29, machoke: 15, pumpkaboo: 11 }],
      [Rain, 29, 31, { palpitoad: 45, wobbuffet: 29, machoke: 15, pumpkaboo: 11 }],
      [Thunder, 29, 31, { pumpkaboo: 36, wimpod: 35, wobbuffet: 24, machoke: 5 }],
      [Sun, 29, 31, { sudowoodo: 40, maractus: 34, machoke: 10, wobbuffet: 5, pumpkaboo: 11 }],
      [Snow, 29, 31, { cubchoo: 40, snorunt: 34, sneasel: 10, wobbuffet: 5, pumpkaboo: 11 }],
      [Blizzard, 29, 31, { sneasel: 40, snorunt: 34, wobbuffet: 10, machoke: 5, pumpkaboo: 11 }],
      [Sand, 29, 31, { sudowoodo: 40, machoke: 34, wobbuffet: 13, axew: 2, pumpkaboo: 11 }],
      [Fog, 29, 31, { honedge: 44, morelull: 35, gastly: 10, pumpkaboo: 11 }],
      // Symbol · Hammerlocke Hills (Flying)
      [AllWeather, 36, 39, { unfezant: 60, corvisquire: 40 }],
      // Hidden · Hammerlocke Hills
      [Clear, 28, 30, { espurr: 40, inkay: 25, corvisquire: 15, dubwool: 10, klink: 10 }],
      [Clouds, 28, 30, { inkay: 35, machoke: 25, thievul: 15, espurr: 10, hawlucha: 5, klink: 10 }],
      [Rain, 28, 30, { pelipper: 40, karrablast: 30, inkay: 15, shelmet: 5, klink: 10 }],
      [Thunder, 28, 30, { toxel: 40, charjabug: 25, karrablast: 15, espurr: 10, klink: 10 }],
      [Sun, 28, 30, { growlithe: 40, baltoy: 25, inkay: 15, espurr: 10, klink: 10 }],
      [Snow, 28, 30, { swinub: 40, inkay: 25, delibird: 15, espurr: 10, klink: 10 }],
      [Blizzard, 28, 30, { snorunt: 40, vanillite: 25, honedge: 15, inkay: 10, klink: 10 }],
      [Sand, 28, 30, { dugtrio: 40, dwebble: 25, drilbur: 15, espurr: 10, klink: 10 }],
      [Fog, 28, 30, { espurr: 40, hatenna: 25, inkay: 15, impidimp: 10, klink: 10 }],
      // Berry Tree · shaking
      [AllWeather, 28, 30, { greedent: 75, cherubi: 25 }],
    ],
    wanderers: [
      [Snow | Blizzard, 'abomasnow', 41],
      [Clear | Clouds | Rain | Thunder | Sun | Snow | Sand | Fog, 'copperajah', 65, true],
      [Clear | Clouds | Rain | Thunder | Sun | Snow | Sand | Fog, 'corviknight', 38],
      [Clear | Clouds | Rain | Thunder | Sun | Snow | Sand | Fog, 'gourgeist', 41],
      [Clear | Clouds | Rain | Thunder | Sun | Snow | Sand | Fog, 'hawlucha', 36],
      [Clear | Clouds | Rain | Snow, 'klang', 46],
      [Thunder | Sun | Blizzard | Sand | Fog, 'klinklang', 49],
      [Clouds | Fog, 'roserade', 41],
      [Clouds | Rain | Thunder | Snow | Sand, 'vileplume', 41],
    ],
  },
  'hulbury': {
    tables: [
      // Fishing · Town of Hulbury
      [AllWeather, 20, 24, { arrokuda: 50, chewtle: 15, chinchou: 20, basculin: 10, wishiwashi: 5 }],
    ],
  },
  'lake-of-outrage': {
    tables: [
      // Symbol · Lake of Outrage
      [Clear, 55, 58, { beheeyem: 32, golurk: 20, braviary: 25, sigilyph: 13, ditto: 10 }],
      [Clouds, 55, 58, { garbodor: 30, drapion: 24, golurk: 20, weezing: 13, hitmontop: 2, ditto: 10, drakloak: 1 }],
      [Rain, 55, 58, { seismitoad: 30, araquanid: 25, golurk: 20, golisopod: 12, drakloak: 1, ditto: 10, rotom: 2 }],
      [Thunder, 55, 58, { galvantula: 30, noivern: 27, golurk: 20, drakloak: 2, haxorus: 5, morpeko: 4, rotom: 2, ditto: 10 }],
      [Sun, 55, 58, { ninetales: 25, durant: 25, golurk: 20, lampent: 14, heatmor: 5, flygon: 1, ditto: 10 }],
      [Snow, 55, 58, { glalie: 25, vanilluxe: 25, golurk: 20, abomasnow: 15, bergmite: 5, ditto: 10 }],
      [Blizzard, 55, 58, { klinklang: 30, bisharp: 25, vanilluxe: 20, golurk: 13, copperajah: 2, ditto: 10 }],
      [Sand, 55, 58, { excadrill: 35, boldore: 30, golurk: 23, zweilous: 2, ditto: 10 }],
      [Fog, 55, 58, { wobbuffet: 30, hatterene: 25, golurk: 20, gothitelle: 13, drakloak: 2, ditto: 10 }],
      // Symbol · Lake of Outrage (Surfing)
      [Clear | Thunder, 40, 43, { mantyke: 65, mantine: 30, barraskewda: 5 }],
      [Clouds | Fog, 40, 43, { mantyke: 50, mantine: 45, barraskewda: 5 }],
      [Rain, 40, 43, { mantyke: 55, mantine: 40, barraskewda: 5 }],
      [Sun, 40, 43, { mantyke: 70, mantine: 25, barraskewda: 5 }],
      [Snow, 40, 43, { vanillite: 50, mantyke: 30, mantine: 15, barraskewda: 5 }],
      [Blizzard, 40, 43, { vanillite: 65, mantyke: 20, mantine: 10, barraskewda: 5 }],
      [Sand, 40, 43, { mantyke: 60, mantine: 35, barraskewda: 5 }],
      // Hidden · Lake of Outrage
      [Clear, 50, 52, { corviknight: 40, obstagoon: 25, bewear: 20, orbeetle: 13, ditto: 2 }],
      [Clouds, 50, 52, { skuntank: 33, grimmsnarl: 25, corviknight: 20, pangoro: 10, falinks: 6, dreepy: 1, 'jangmo-o': 5 }],
      [Rain, 50, 52, { pelipper: 38, cramorant: 25, corviknight: 20, quagsire: 13, barbaracle: 2, deino: 2 }],
      [Thunder, 50, 52, { boltund: 35, drednaw: 23, corviknight: 20, jellicent: 16, zweilous: 2, dreepy: 2, 'hakamo-o': 2 }],
      [Sun, 50, 52, { rhydon: 33, coalossal: 25, corviknight: 20, sandaconda: 13, turtonator: 2, stonjourner: 2, 'jangmo-o': 5 }],
      [Snow, 50, 52, { snom: 40, piloswine: 25, corviknight: 20, 'mr-mime': 13, obstagoon: 2 }],
      [Blizzard, 50, 52, { perrserker: 40, doublade: 25, corviknight: 20, togedemaru: 13, duraludon: 2 }],
      [Sand, 50, 52, { dugtrio: 40, hippowdon: 25, corviknight: 20, stunfisk: 10, stonjourner: 5 }],
      [Fog, 50, 52, { claydol: 35, bronzong: 25, corviknight: 23, indeedee: 14, gardevoir: 1, dreepy: 2 }],
      // Fishing · Lake of Outrage
      [AllWeather, 50, 52, { barraskewda: 50, lanturn: 35, qwilfish: 10, gyarados: 5 }],
      // Berry Tree · shaking
      [AllWeather, 50, 52, { greedent: 95, cherubi: 5 }],
    ],
    wanderers: [
      [Snow | Blizzard, 'avalugg', 60],
      [Sun, 'chandelure', 60],
      [Clouds, 'espeon', 56],
      [Sun, 'flareon', 56],
      [Clear | Fog, 'gardevoir', 60],
      [Snow | Blizzard, 'glaceon', 56],
      [AllWeather, 'grapploct', 56],
      [Clouds | Sun | Sand, 'gyarados', 56],
      [Clear | Rain | Thunder | Snow | Blizzard, 'gyarados', 60],
      [AllWeather, 'hatterene', 65, true],
      [Clear | Clouds | Rain | Thunder | Fog, 'jellicent', 46],
      [Thunder, 'jolteon', 56],
      [Clear | Thunder | Fog, 'lanturn', 46],
      [Clear | Rain | Thunder | Snow | Blizzard | Fog, 'lapras', 56],
      [Clear, 'leafeon', 56],
      [Fog, 'milotic', 60],
      [Sand, 'rhydon', 60],
      [Clouds | Sun | Sand, 'seaking', 46],
      [Clouds | Rain | Thunder, 'shiinotic', 60],
      [Fog, 'sylveon', 56],
      [Sand, 'umbreon', 56],
      [Rain, 'vaporeon', 56],
    ],
  },
  'motostoke': {
    tables: [
      // Fishing · City of Motostoke
      [AllWeather, 7, 11, { magikarp: 50, chewtle: 40, barboach: 10 }],
    ],
  },
  'motostoke-outskirts': {
    tables: [
      // Symbol · Motostoke Outskirts
      [AllWeather, 22, 26, { noctowl: 40, sudowoodo: 30, koffing: 15, hatenna: 10, sawk: 5 }],
      // Hidden · Motostoke Outskirts
      [AllWeather, 21, 24, { scraggy: 35, roggenrola: 30, pawniard: 20, chewtle: 10, impidimp: 5 }],
    ],
  },
  'motostoke-riverbank': {
    tables: [
      // Symbol · Motostoke Riverbank
      [Clear, 26, 28, { skorupi: 40, gossifleur: 25, wooloo: 10, munchlax: 5, purrloin: 20 }],
      [Clouds, 26, 28, { koffing: 40, cutiefly: 25, rookidee: 10, sawk: 5, purrloin: 20 }],
      [Rain, 26, 28, { skorupi: 40, wimpod: 25, chewtle: 10, dewpider: 5, purrloin: 20 }],
      [Thunder, 26, 28, { yamper: 40, mareanie: 25, skorupi: 10, toxel: 5, purrloin: 20 }],
      [Sun, 26, 28, { rhyhorn: 40, skorupi: 25, torkoal: 10, rolycoly: 5, purrloin: 20 }],
      [Snow, 26, 28, { sneasel: 40, cutiefly: 25, vanillite: 10, wooloo: 5, purrloin: 20 }],
      [Blizzard, 26, 28, { sneasel: 40, vanillite: 25, cutiefly: 10, pawniard: 5, purrloin: 20 }],
      [Sand, 26, 28, { skorupi: 20, sudowoodo: 25, rolycoly: 10, rhyhorn: 25, purrloin: 20 }],
      [Fog, 26, 28, { clefairy: 40, wobbuffet: 25, cutiefly: 10, duskull: 5, purrloin: 20 }],
      // Symbol · Motostoke Riverbank (Surfing)
      [Clear, 40, 43, { basculin: 65, arrokuda: 30, mantyke: 5 }],
      [Clouds | Fog, 40, 43, { basculin: 50, arrokuda: 45, mantyke: 5 }],
      [Rain, 40, 43, { basculin: 55, arrokuda: 40, mantyke: 5 }],
      [Thunder, 40, 43, { arrokuda: 65, basculin: 30, mantyke: 5 }],
      [Sun, 40, 43, { basculin: 70, arrokuda: 25, mantyke: 5 }],
      [Snow, 40, 43, { vanillite: 50, basculin: 30, arrokuda: 15, mantyke: 5 }],
      [Blizzard, 40, 43, { vanillite: 65, arrokuda: 20, basculin: 10, mantyke: 5 }],
      [Sand, 40, 43, { arrokuda: 60, basculin: 35, mantyke: 5 }],
      // Hidden · Motostoke Riverbank
      [Clear, 26, 28, { corvisquire: 35, noctowl: 30, eldegoss: 20, dubwool: 10, sigilyph: 5 }],
      [Clouds, 26, 28, { skorupi: 35, corvisquire: 30, noctowl: 20, dubwool: 10, sigilyph: 5 }],
      [Rain, 26, 28, { karrablast: 35, binacle: 30, corvisquire: 20, shelmet: 10, sigilyph: 5 }],
      [Thunder, 26, 28, { shellos: 35, wimpod: 30, boltund: 20, corvisquire: 10, sigilyph: 5 }],
      [Sun, 26, 28, { rhyhorn: 35, litwick: 30, corvisquire: 20, noctowl: 10, sigilyph: 5 }],
      [Snow, 26, 28, { sneasel: 35, vanillite: 30, corvisquire: 20, noctowl: 10, sigilyph: 5 }],
      [Blizzard, 26, 28, { pawniard: 35, sneasel: 30, corvisquire: 20, ferroseed: 10, sigilyph: 5 }],
      [Sand, 26, 28, { rhyhorn: 35, onix: 30, noctowl: 20, corvisquire: 10, sigilyph: 5 }],
      [Fog, 26, 28, { espurr: 35, elgyem: 30, corvisquire: 20, noctowl: 10, sigilyph: 5 }],
      // Fishing · Motostoke Riverbank
      [AllWeather, 26, 28, { arrokuda: 50, basculin: 35, barraskewda: 10, mareanie: 5 }],
      // Berry Tree · shaking
      [AllWeather, 26, 28, { greedent: 50, skwovet: 35, cherubi: 15 }],
    ],
    wanderers: [
      [Thunder | Sand, 'bewear', 40],
      [Blizzard, 'bisharp', 52],
      [Fog, 'clefable', 36],
      [Clear | Clouds | Rain | Thunder | Snow | Fog, 'conkeldurr', 55],
      [Rain | Thunder | Sun | Snow | Blizzard | Sand, 'corviknight', 40],
      [Clear | Rain | Thunder | Sun | Sand, 'drapion', 40],
      [AllWeather, 'eldegoss', 65, true],
      [AllWeather, 'linoone', 40],
      [Sun | Sand, 'rhydon', 55],
      [Clouds | Snow | Blizzard | Fog, 'ribombee', 40],
      [Rain | Thunder | Sun | Snow | Blizzard | Sand, 'sigilyph', 36],
      [Clear | Clouds | Fog, 'sigilyph', 40],
      [Clear | Clouds | Rain | Thunder | Sun | Snow | Blizzard | Sand, 'snorlax', 36],
      [AllWeather, 'wailmer', 56],
    ],
  },
  'north-lake-miloch': {
    tables: [
      // Symbol · North Lake Miloch
      [Clear, 26, 28, { stunky: 50, bunnelby: 30, gloom: 20 }],
      [Clouds, 26, 28, { stunky: 55, purrloin: 35, gloom: 10 }],
      [Rain, 26, 28, { palpitoad: 50, purrloin: 30, gloom: 20 }],
      [Thunder, 26, 28, { palpitoad: 60, gloom: 30, purrloin: 10 }],
      [Sun, 26, 28, { stunky: 60, bunnelby: 25, dwebble: 10, vulpix: 5 }],
      [Snow, 26, 28, { vanillite: 60, purrloin: 25, snorunt: 10, delibird: 5 }],
      [Blizzard, 26, 28, { vanillite: 60, klink: 25, snorunt: 10, purrloin: 5 }],
      [Sand, 26, 28, { golett: 60, stunky: 25, bunnelby: 10, dwebble: 5 }],
      [Fog, 26, 28, { drifloon: 60, stunky: 28, purrloin: 10, ralts: 2 }],
      // Symbol · North Lake Miloch (Surfing)
      [Clear, 42, 45, { frillish: 60, wingull: 25, drifloon: 10, barboach: 5 }],
      [Clouds, 42, 45, { wingull: 60, frillish: 25, barboach: 10, drifloon: 5 }],
      [Rain, 42, 45, { barboach: 60, goldeen: 28, wingull: 10, frillish: 2 }],
      [Thunder, 42, 45, { goldeen: 60, drifloon: 25, frillish: 10, barboach: 5 }],
      [Sun, 42, 45, { barboach: 60, drifloon: 25, frillish: 10, wingull: 5 }],
      [Snow, 42, 45, { vanillite: 60, frillish: 25, wingull: 10, drifloon: 5 }],
      [Blizzard, 42, 45, { vanillite: 60, drifloon: 25, frillish: 10, barboach: 5 }],
      [Sand, 42, 45, { barboach: 60, goldeen: 25, frillish: 10, drifloon: 5 }],
      [Fog, 42, 45, { frillish: 60, barboach: 25, drifloon: 10, wingull: 5 }],
      // Hidden · North Lake Miloch
      [Clear, 14, 16, { stunky: 40, stufful: 30, pidove: 20, diggersby: 10 }],
      [Clouds, 14, 16, { stunky: 40, machop: 30, stufful: 20, gastly: 10 }],
      [Rain, 14, 16, { tympole: 40, grubbin: 30, stunky: 20, stufful: 10 }],
      [Thunder, 14, 16, { grubbin: 40, joltik: 30, stunky: 20, stufful: 10 }],
      [Sun, 14, 16, { mudbray: 40, stunky: 30, baltoy: 20, stufful: 10 }],
      [Snow, 14, 16, { snorunt: 40, snover: 30, stunky: 20, stufful: 10 }],
      [Blizzard, 14, 15, { delibird: 40, snover: 30, stunky: 20, snorunt: 10 }],
      [Sand, 14, 16, { dwebble: 40, baltoy: 30, stunky: 20, mudbray: 10 }],
      [Fog, 14, 16, { natu: 45, stufful: 30, stunky: 20, ralts: 5 }],
      // Fishing · North Lake Miloch
      [AllWeather, 14, 16, { magikarp: 58, barboach: 40, basculin: 2 }],
      // Berry Tree · shaking
      [AllWeather, 14, 16, { skwovet: 50, cherubi: 50 }],
    ],
    wanderers: [
      [AllWeather, 'boltund', 65, true],
      [AllWeather, 'corviknight', 50],
      [Fog, 'drifblim', 36],
      [Clear | Clouds | Blizzard, 'drifblim', 46],
      [Clouds | Sun | Sand, 'gyarados', 56],
      [Clear | Rain | Thunder | Snow | Blizzard, 'gyarados', 60],
      [Clear | Clouds | Rain | Thunder | Fog, 'jellicent', 46],
      [Clear | Rain | Thunder | Snow | Blizzard | Fog, 'lapras', 56],
      [AllWeather, 'liepard', 28],
      [Clear, 'lucario', 36],
      [Rain | Thunder, 'pelipper', 26],
      [Rain | Thunder | Sand, 'seaking', 46],
      [Clouds | Thunder, 'seismitoad', 36],
      [Rain | Sun | Sand, 'skuntank', 36],
      [Snow | Blizzard, 'vanillish', 36],
      [Snow | Blizzard, 'vanilluxe', 47],
      [Clear | Clouds | Thunder | Sun | Sand, 'whiscash', 46],
      [Clear | Clouds | Sun | Snow | Blizzard | Sand | Fog, 'xatu', 26],
    ],
  },
  'outer-spikemuth': {
    tables: [
      // Symbol · Route 9 (in Outer Spikemuth)
      [AllWeather, 40, 44, { bergmite: 40, clobbopus: 30, mareanie: 24, jellicent: 5, dhelmise: 1 }],
      // Hidden · Route 9 (in Outer Spikemuth)
      [AllWeather, 40, 44, { perrserker: 40, thievul: 30, liepard: 25, morpeko: 5 }],
      // Berry Tree · shaking
      [AllWeather, 40, 44, { greedent: 100 }],
    ],
  },
  'rolling-fields': {
    tables: [
      // Symbol · Rolling Fields
      [Clear, 7, 10, { combee: 60, bunnelby: 25, metapod: 10, tyrogue: 5 }],
      [Clouds, 7, 10, { bunnelby: 60, tyrogue: 28, metapod: 10, ralts: 2 }],
      [Rain, 7, 10, { wingull: 60, bunnelby: 25, metapod: 10, tyrogue: 5 }],
      [Thunder, 7, 10, { electrike: 60, wingull: 25, metapod: 10, tyrogue: 5 }],
      [Sun, 7, 10, { vulpix: 60, bunnelby: 25, metapod: 10, tyrogue: 5 }],
      [Snow, 7, 10, { vanillite: 60, bunnelby: 25, metapod: 10, tyrogue: 5 }],
      [Blizzard, 7, 10, { delibird: 60, vanillite: 25, metapod: 10, tyrogue: 5 }],
      [Sand, 7, 10, { baltoy: 60, bunnelby: 25, metapod: 10, tyrogue: 5 }],
      [Fog, 7, 10, { ralts: 60, bunnelby: 25, metapod: 10, tyrogue: 5 }],
      // Symbol · Rolling Fields (Flying)
      [Clear | Clouds | Fog, 7, 10, { butterfree: 75, pidove: 25 }],
      [Rain | Thunder | Sun | Snow | Blizzard | Sand, 7, 10, { pidove: 75, butterfree: 25 }],
      // Symbol · Rolling Fields (Ground)
      [Clear | Rain | Thunder | Snow | Blizzard | Fog, 8, 10, { diglett: 80, roggenrola: 20 }],
      [Clouds | Sun | Sand, 8, 10, { roggenrola: 80, diglett: 20 }],
      // Symbol · Rolling Fields (2)
      [Clear, 7, 10, { pancham: 60, combee: 25, metapod: 10, tyrogue: 5 }],
      [Clouds, 7, 10, { pancham: 60, tyrogue: 28, metapod: 10, ralts: 2 }],
      [Rain, 7, 10, { pancham: 60, wingull: 25, metapod: 10, tyrogue: 5 }],
      [Thunder, 7, 10, { pancham: 60, electrike: 25, metapod: 10, tyrogue: 5 }],
      [Sun, 7, 10, { pancham: 60, vulpix: 25, metapod: 10, tyrogue: 5 }],
      [Snow | Blizzard, 7, 10, { pancham: 60, vanillite: 25, metapod: 10, tyrogue: 5 }],
      [Sand, 7, 10, { pancham: 60, baltoy: 25, metapod: 10, tyrogue: 5 }],
      [Fog, 7, 10, { pancham: 60, ralts: 25, metapod: 10, tyrogue: 5 }],
      // Hidden · Rolling Fields
      [Clear, 7, 9, { bunnelby: 40, minccino: 35, bounsweet: 20, metapod: 5 }],
      [Clouds, 7, 9, { oddish: 40, budew: 35, bunnelby: 20, metapod: 5 }],
      [Rain, 7, 9, { nuzleaf: 40, wingull: 35, bunnelby: 20, metapod: 5 }],
      [Thunder, 7, 9, { joltik: 40, electrike: 35, bunnelby: 20, metapod: 5 }],
      [Sun, 7, 9, { baltoy: 40, mudbray: 35, vulpix: 20, bunnelby: 5 }],
      [Snow, 7, 9, { vanillite: 40, swinub: 35, bunnelby: 20, minccino: 5 }],
      [Blizzard, 7, 9, { swinub: 40, delibird: 35, snorunt: 20, bunnelby: 5 }],
      [Sand, 7, 9, { dwebble: 40, baltoy: 35, golett: 20, bunnelby: 5 }],
      [Fog, 7, 9, { munna: 40, natu: 35, bunnelby: 20, metapod: 5 }],
      // Berry Tree · shaking
      [AllWeather, 7, 10, { skwovet: 80, cherubi: 20 }],
    ],
    wanderers: [
      [Sand, 'crustle', 34],
      [Clear | Rain | Thunder | Fog, 'diggersby', 15],
      [Clouds | Sun | Snow | Blizzard | Sand, 'diggersby', 26],
      [AllWeather, 'dubwool', 65, true],
      [Fog, 'gardevoir', 32],
      [Rain | Thunder, 'haunter', 31],
      [Fog, 'kirlia', 26],
      [Thunder, 'manectric', 26],
      [Blizzard, 'mime-jr', 15],
      [Clear | Clouds | Sun | Sand | Fog, 'mudsdale', 31],
      [AllWeather, 'ninjask', 15],
      [AllWeather, 'onix', 26],
      [Clear | Clouds | Rain | Thunder | Sun, 'pangoro', 32],
      [Rain | Thunder, 'pelipper', 26],
      [Thunder, 'pikachu', 15],
      [Snow | Blizzard, 'piloswine', 33],
      [Clear | Clouds | Rain | Sun | Snow | Sand | Fog, 'roselia', 15],
      [Clear, 'vespiquen', 26],
    ],
  },
  'slumbering-weald': {
    tables: [
      // Symbol · Slumbering Weald (Low Level)
      [AllWeather, 2, 3, { skwovet: 40, rookidee: 30, blipbug: 20, grubbin: 10 }],
      // Hidden · Slumbering Weald (Low Level)
      [AllWeather, 2, 3, { skwovet: 50, rookidee: 20, hoothoot: 15, blipbug: 10, grubbin: 5 }],
    ],
  },
  'slumbering-weald-interior': {
    tables: [
      // Symbol · Slumbering Weald (High Level)
      [AllWeather, 45, 47, { weezing: 50, munna: 30, orbeetle: 15, corviknight: 5 }],
      // Hidden · Slumbering Weald (High Level)
      [AllWeather, 45, 47, { weezing: 30, munna: 25, corviknight: 20, orbeetle: 15, butterfree: 5, stunfisk: 5 }],
      // Fishing · Slumbering Weald (High Level)
      [AllWeather, 45, 47, { whiscash: 60, barboach: 20, magikarp: 20 }],
    ],
    wanderers: [
      [AllWeather, 'stunfisk', 48],
    ],
  },
  'south-lake-miloch': {
    tables: [
      // Symbol · South Lake Miloch
      [Clear, 14, 16, { corphish: 30, stunky: 25, machop: 10, nuzleaf: 5, krabby: 30 }],
      [Clouds, 14, 16, { machop: 50, stunky: 25, corphish: 10, nuzleaf: 5, krabby: 10 }],
      [Rain, 14, 16, { tympole: 45, magikarp: 25, machop: 10, corphish: 10, krabby: 10 }],
      [Thunder, 14, 16, { corphish: 30, tympole: 28, joltik: 10, pyukumuku: 2, krabby: 30 }],
      [Sun, 14, 16, { machop: 60, vulpix: 25, mudbray: 10, stunky: 5 }],
      [Snow, 14, 16, { vanillite: 45, snover: 25, machop: 10, corphish: 10, krabby: 10 }],
      [Blizzard, 14, 16, { vanillite: 60, klink: 25, machop: 10, delibird: 5 }],
      [Sand, 14, 16, { mudbray: 55, dwebble: 25, machop: 15, stunky: 5 }],
      [Fog, 14, 16, { drifloon: 60, bronzor: 25, corphish: 10, ralts: 5 }],
      // Symbol · South Lake Miloch (Surfing)
      [Clear, 41, 44, { goldeen: 60, wingull: 25, drifloon: 10, barboach: 5 }],
      [Clouds | Fog, 41, 44, { drifloon: 60, barboach: 25, wingull: 10, goldeen: 5 }],
      [Rain, 41, 44, { goldeen: 60, drifloon: 25, barboach: 10, wingull: 5 }],
      [Thunder, 41, 44, { barboach: 60, goldeen: 25, drifloon: 10, wingull: 5 }],
      [Sun, 41, 44, { barboach: 60, drifloon: 25, goldeen: 10, wingull: 5 }],
      [Snow, 41, 44, { vanillite: 60, goldeen: 25, barboach: 10, drifloon: 5 }],
      [Blizzard, 41, 44, { vanillite: 60, drifloon: 25, goldeen: 10, barboach: 5 }],
      [Sand, 41, 44, { barboach: 60, wingull: 25, goldeen: 10, drifloon: 5 }],
      // Symbol · South Lake Miloch (Flying)
      [AllWeather, 14, 16, { wingull: 85, drifloon: 15 }],
      // Symbol · South Lake Miloch (2)
      [Clear, 14, 16, { machop: 80, stunky: 15, tyrogue: 5 }],
      [Clouds | Thunder, 14, 16, { machop: 60, stunky: 35, tyrogue: 5 }],
      [Rain, 14, 16, { machop: 70, stunky: 25, tyrogue: 5 }],
      [Sun, 14, 16, { machop: 80, vulpix: 15, tyrogue: 5 }],
      [Snow, 14, 16, { machop: 80, snover: 15, tyrogue: 5 }],
      [Blizzard, 14, 16, { snover: 60, machop: 35, tyrogue: 5 }],
      [Sand, 14, 16, { machop: 60, dwebble: 35, tyrogue: 5 }],
      [Fog, 14, 16, { machop: 60, bronzor: 35, tyrogue: 5 }],
      // Hidden · South Lake Miloch
      [Clear, 11, 13, { machop: 40, wingull: 30, tympole: 20, corphish: 10 }],
      [Clouds, 11, 13, { corphish: 40, roselia: 30, machop: 20, tyrogue: 10 }],
      [Rain, 11, 13, { tympole: 40, corphish: 30, machop: 20, wingull: 10 }],
      [Thunder, 11, 13, { electrike: 40, joltik: 30, corphish: 20, machop: 10 }],
      [Sun, 11, 13, { baltoy: 40, vulpix: 30, roselia: 20, nincada: 10 }],
      [Snow, 11, 13, { snorunt: 40, vanillite: 30, corphish: 20, machop: 10 }],
      [Blizzard, 11, 13, { klink: 40, snover: 30, corphish: 20, machop: 10 }],
      [Sand, 11, 13, { nincada: 40, wooper: 30, baltoy: 20, tympole: 10 }],
      [Fog, 11, 13, { natu: 40, corphish: 30, machop: 20, ralts: 10 }],
      // Fishing · South Lake Miloch
      [AllWeather, 11, 13, { magikarp: 50, remoraid: 40, barboach: 9, pyukumuku: 1 }],
    ],
    wanderers: [
      [Clear | Thunder, 'crawdaunt', 31],
      [Sun, 'crustle', 34],
      [Clear | Clouds | Blizzard | Fog, 'drifblim', 46],
      [AllWeather, 'galvantula', 46],
      [Clear | Clouds | Rain | Thunder | Sun | Snow | Blizzard | Sand, 'gyarados', 60],
      [Rain | Fog, 'jellicent', 46],
      [Clear | Thunder, 'kingler', 31],
      [Thunder, 'lanturn', 46],
      [Clear | Rain | Thunder | Snow | Blizzard | Fog, 'lapras', 56],
      [Clear | Rain | Thunder | Fog, 'machoke', 26],
      [Clouds | Sun | Snow | Blizzard | Sand, 'machoke', 31],
      [Fog, 'milotic', 60],
      [Clear | Sun | Sand | Fog, 'octillery', 46],
      [Rain | Thunder, 'palpitoad', 34],
      [Clear | Clouds | Rain | Thunder | Sand, 'seaking', 46],
      [Clear | Clouds | Snow | Blizzard | Sand | Fog, 'skuntank', 34],
      [AllWeather, 'thievul', 65, true],
      [Snow | Blizzard, 'vanilluxe', 47],
      [Clear | Thunder | Sun | Sand, 'whiscash', 46],
    ],
  },
  'steamdrift-way': {
    tables: [
      // Symbol · Route 8 (on Steamdrift Way)
      [AllWeather, 39, 43, { snom: 40, snorunt: 25, sneasel: 20, vanillish: 10, sawk: 5 }],
      // Hidden · Route 8 (on Steamdrift Way)
      [AllWeather, 38, 41, { snom: 40, sneasel: 25, snover: 20, delibird: 10, darumaka: 5 }],
    ],
  },
  'stony-wilderness': {
    tables: [
      // Symbol · Stony Wilderness
      [Clear, 28, 30, { zigzagoon: 35, ninjask: 30, tyrogue: 15, baltoy: 10, golett: 10 }],
      [Clouds, 28, 30, { machoke: 35, scraggy: 30, zigzagoon: 15, baltoy: 10, golett: 10 }],
      [Rain, 28, 30, { ninjask: 35, dewpider: 30, zigzagoon: 10, cramorant: 5, baltoy: 10, golett: 10 }],
      [Thunder, 28, 30, { yamper: 35, dewpider: 30, toxel: 10, pikachu: 5, baltoy: 10, golett: 10 }],
      [Sun, 28, 30, { maractus: 35, zigzagoon: 30, salandit: 15, baltoy: 10, golett: 10 }],
      [Snow, 28, 30, { cubchoo: 35, zigzagoon: 30, sneasel: 15, baltoy: 10, golett: 10 }],
      [Blizzard, 28, 30, { sneasel: 35, cubchoo: 30, zigzagoon: 10, ferroseed: 5, baltoy: 10, golett: 10 }],
      [Sand, 28, 30, { bonsly: 35, zigzagoon: 30, dwebble: 15, baltoy: 10, golett: 10 }],
      [Fog, 28, 30, { hatenna: 35, munna: 30, zigzagoon: 10, nickit: 5, baltoy: 10, golett: 10 }],
      // Symbol · Stony Wilderness (2)
      [Clear, 28, 30, { dwebble: 45, ninjask: 35, tyrogue: 15, rufflet: 5 }],
      [Clouds, 28, 30, { machoke: 45, scraggy: 35, dwebble: 15, rufflet: 5 }],
      [Rain, 28, 30, { dewpider: 45, dwebble: 35, ninjask: 15, rufflet: 5 }],
      [Thunder, 28, 30, { yamper: 45, dewpider: 35, toxel: 10, pikachu: 5, rufflet: 5 }],
      [Sun, 28, 30, { maractus: 45, dwebble: 35, roggenrola: 15, rufflet: 5 }],
      [Snow, 28, 30, { cubchoo: 45, dwebble: 35, sneasel: 15, rufflet: 5 }],
      [Blizzard, 28, 30, { sneasel: 45, cubchoo: 35, dwebble: 10, ferroseed: 5, rufflet: 5 }],
      [Sand, 28, 30, { bonsly: 45, dwebble: 35, roggenrola: 15, rufflet: 5 }],
      [Fog, 28, 30, { hatenna: 45, munna: 35, dwebble: 10, nickit: 5, rufflet: 5 }],
      // Symbol · Stony Wilderness (Flying)
      [Clear | Clouds | Rain | Thunder | Snow | Blizzard, 28, 30, { tranquill: 60, sigilyph: 40 }],
      [Sun | Sand | Fog, 28, 30, { sigilyph: 60, tranquill: 40 }],
      // Symbol · Stony Wilderness (3)
      [Clear, 28, 30, { bounsweet: 50, machop: 35, tyrogue: 15 }],
      [Clouds, 28, 30, { bounsweet: 50, machop: 35, scraggy: 15 }],
      [Rain, 28, 30, { bounsweet: 60, dewpider: 35, cramorant: 5 }],
      [Thunder, 28, 30, { dewpider: 45, bounsweet: 35, toxel: 10, pikachu: 10 }],
      [Sun, 28, 30, { maractus: 50, bounsweet: 45, salandit: 5 }],
      [Snow, 28, 30, { cubchoo: 50, bounsweet: 35, sneasel: 15 }],
      [Blizzard, 28, 30, { sneasel: 50, bounsweet: 35, cubchoo: 10, ferroseed: 5 }],
      [Sand, 28, 30, { bonsly: 50, bounsweet: 35, dwebble: 15 }],
      [Fog, 28, 30, { hatenna: 50, bounsweet: 35, munna: 10, nickit: 5 }],
      // Hidden · Stony Wilderness
      [Clear, 27, 29, { gurdurr: 40, ribombee: 30, impidimp: 20, eldegoss: 10 }],
      [Clouds, 27, 29, { cottonee: 40, swirlix: 30, ribombee: 20, impidimp: 10 }],
      [Rain, 26, 28, { barboach: 40, shellos: 30, impidimp: 20, pikachu: 10 }],
      [Thunder, 26, 28, { toxel: 40, gurdurr: 30, impidimp: 20, applin: 10 }],
      [Sun, 26, 28, { carkol: 40, gurdurr: 30, impidimp: 20, drilbur: 10 }],
      [Snow, 26, 28, { cubchoo: 40, sneasel: 30, impidimp: 20, gurdurr: 10 }],
      [Blizzard, 26, 28, { sneasel: 40, pawniard: 30, cubchoo: 20, impidimp: 10 }],
      [Sand, 26, 28, { rhyhorn: 40, drilbur: 30, boldore: 20, shuckle: 10 }],
      [Fog, 26, 28, { thievul: 40, dottler: 30, impidimp: 20, togetic: 10 }],
      // Berry Tree · shaking
      [AllWeather, 26, 28, { greedent: 75, cherubi: 25 }],
    ],
    wanderers: [
      [Rain, 'araquanid', 34],
      [Rain | Thunder | Snow | Blizzard | Fog, 'bronzong', 42],
      [Clear | Clouds | Sun | Sand, 'claydol', 42],
      [Clear | Clouds | Sun | Snow | Blizzard | Sand | Fog, 'crustle', 34],
      [AllWeather, 'dusknoir', 60],
      [AllWeather, 'ferrothorn', 40],
      [AllWeather, 'golurk', 43],
      [AllWeather, 'grimmsnarl', 65, true],
      [AllWeather, 'rhydon', 41],
      [Clear | Rain | Thunder | Sun | Snow | Blizzard | Sand | Fog, 'sigilyph', 40],
      [Clear | Clouds | Sun | Snow | Blizzard | Sand | Fog, 'tsareena', 36],
      [Clouds, 'unfezant', 40],
    ],
  },
  'turffield': {
    tables: [
    ],
    wanderers: [
      [AllWeather, 'crawdaunt', 50],
    ],
  },
  'watchtower-ruins': {
    tables: [
      // Symbol · Watchtower Ruins
      [Clear, 26, 29, { golett: 60, duskull: 25, drifloon: 15 }],
      [Clouds, 26, 29, { duskull: 60, gastly: 25, oddish: 10, drifloon: 5 }],
      [Rain, 26, 29, { duskull: 50, gastly: 35, wingull: 10, purrloin: 5 }],
      [Thunder, 26, 29, { gastly: 50, duskull: 35, drifloon: 10, purrloin: 5 }],
      [Sun, 26, 29, { drifloon: 60, duskull: 28, vulpix: 10, shuckle: 2 }],
      [Snow, 26, 29, { drifloon: 60, delibird: 25, duskull: 15 }],
      [Blizzard, 26, 29, { delibird: 60, gastly: 25, purrloin: 15 }],
      [Sand, 26, 29, { gastly: 60, shuckle: 25, purrloin: 15 }],
      [Fog, 26, 29, { gastly: 60, duskull: 25, ralts: 10, purrloin: 5 }],
      // Symbol · Watchtower Ruins (Flying)
      [Clear | Rain | Sun | Snow | Blizzard | Sand | Fog, 26, 29, { woobat: 60, noibat: 40 }],
      [Clouds | Thunder, 26, 29, { noibat: 60, woobat: 40 }],
      // Hidden · Watchtower Ruins
      [Clear, 11, 14, { golett: 40, drifloon: 30, bounsweet: 20, pidove: 10 }],
      [Clouds, 11, 14, { duskull: 40, machop: 30, bounsweet: 20, gastly: 10 }],
      [Rain, 11, 14, { duskull: 40, tympole: 30, wingull: 20, pidove: 10 }],
      [Thunder, 11, 14, { electrike: 40, grubbin: 30, duskull: 20, pidove: 10 }],
      [Sun, 11, 14, { golett: 40, duskull: 30, vulpix: 20, drifloon: 10 }],
      [Snow, 11, 14, { snorunt: 40, duskull: 30, snover: 20, drifloon: 10 }],
      [Blizzard, 11, 14, { snover: 40, snorunt: 30, duskull: 20, drifloon: 10 }],
      [Sand, 11, 14, { golett: 40, dwebble: 30, duskull: 20, pidove: 10 }],
      [Fog, 11, 14, { duskull: 60, purrloin: 30, pidove: 10 }],
      // Berry Tree · shaking
      [AllWeather, 11, 14, { skwovet: 50, cherubi: 50 }],
    ],
    wanderers: [
      [AllWeather, 'corviknight', 65, true],
      [Clear | Sun | Snow, 'drifblim', 34],
      [Clouds | Rain | Thunder | Fog, 'dusclops', 40],
      [Snow | Blizzard, 'glalie', 40],
      [Clear | Sun | Sand, 'golurk', 40],
      [Clouds | Rain | Thunder | Blizzard | Sand | Fog, 'haunter', 34],
    ],
  },
  'west-lake-axewell': {
    tables: [
      // Symbol · West Lake Axewell
      [Clear, 8, 14, { tympole: 60, wooper: 25, krabby: 10, purrloin: 5 }],
      [Clouds, 8, 14, { seedot: 60, tympole: 25, purrloin: 10, budew: 5 }],
      [Rain, 8, 14, { wooper: 50, wingull: 35, krabby: 10, tympole: 5 }],
      [Thunder, 8, 14, { wooper: 50, wingull: 35, electrike: 10, tympole: 5 }],
      [Sun, 8, 14, { dwebble: 40, vulpix: 35, bunnelby: 20, purrloin: 5 }],
      [Snow, 8, 14, { snorunt: 60, tympole: 25, vanillite: 10, purrloin: 5 }],
      [Blizzard, 8, 14, { vanillite: 60, klink: 25, tympole: 10, krabby: 5 }],
      [Sand, 8, 14, { dwebble: 60, bunnelby: 25, purrloin: 15 }],
      [Fog, 8, 14, { purrloin: 60, tympole: 25, natu: 10, wooper: 5 }],
      // Symbol · West Lake Axewell (Surfing)
      [Clear | Rain, 38, 40, { frillish: 60, goldeen: 25, remoraid: 10, magikarp: 5 }],
      [Clouds, 38, 40, { goldeen: 60, remoraid: 25, magikarp: 10, frillish: 5 }],
      [Thunder, 38, 40, { chinchou: 60, magikarp: 25, goldeen: 10, remoraid: 5 }],
      [Sun, 38, 40, { magikarp: 60, frillish: 25, goldeen: 10, remoraid: 5 }],
      [Snow, 38, 40, { vanillite: 60, shellder: 25, magikarp: 10, frillish: 5 }],
      [Blizzard, 38, 40, { vanillite: 70, magikarp: 15, frillish: 10, goldeen: 5 }],
      [Sand, 38, 40, { magikarp: 60, goldeen: 25, remoraid: 10, frillish: 5 }],
      [Fog, 38, 40, { magikarp: 60, goldeen: 25, frillish: 10, remoraid: 5 }],
      // Hidden · West Lake Axewell
      [Clear, 7, 11, { wooper: 40, krabby: 30, wingull: 20, bounsweet: 10 }],
      [Clouds, 7, 11, { krabby: 40, wooper: 30, pancham: 25, tyrogue: 5 }],
      [Rain, 7, 11, { wooper: 40, tympole: 30, krabby: 20, wingull: 10 }],
      [Thunder, 7, 11, { electrike: 40, tympole: 30, krabby: 20, joltik: 10 }],
      [Sun, 7, 11, { vulpix: 40, baltoy: 30, bunnelby: 20, pancham: 10 }],
      [Snow, 7, 11, { vanillite: 40, snorunt: 30, wingull: 20, delibird: 10 }],
      [Blizzard, 7, 11, { klink: 40, delibird: 30, vanillite: 20, bunnelby: 10 }],
      [Sand, 7, 11, { wooper: 40, nincada: 30, baltoy: 20, mudbray: 10 }],
      [Fog, 7, 11, { natu: 40, krabby: 30, wingull: 20, ralts: 10 }],
      // Fishing · West Lake Axewell
      [AllWeather, 7, 11, { magikarp: 50, goldeen: 35, remoraid: 10, wishiwashi: 5 }],
    ],
    wanderers: [
      [Clear | Fog, 'cloyster', 46],
      [Snow | Blizzard | Sand, 'diggersby', 15],
      [Sun, 'diggersby', 28],
      [AllWeather, 'drednaw', 65, true],
      [Clouds | Rain | Thunder | Fog, 'dusclops', 40],
      [Snow | Blizzard, 'glalie', 40],
      [Clear | Sun | Sand, 'golurk', 40],
      [Clear | Clouds | Sun | Snow | Blizzard | Sand | Fog, 'grapploct', 56],
      [AllWeather, 'gyarados', 56],
      [Clouds | Rain | Fog, 'jellicent', 46],
      [Clear, 'kingler', 28],
      [Clear | Rain | Thunder | Snow | Blizzard | Fog, 'lapras', 56],
      [Clouds | Snow | Blizzard | Sand | Fog, 'palpitoad', 28],
      [Rain | Thunder, 'pelipper', 28],
      [Clear | Clouds | Rain | Thunder | Fog, 'quagsire', 15],
      [Clear | Clouds | Sand, 'seaking', 46],
      [Snow | Blizzard, 'vanilluxe', 47],
    ],
  },
}

type WeightedPool = Map<string, KantoEncounter>

function addSlot(pool: WeightedPool, speciesId: string, level: number, weight: number) {
  const key = speciesId + ':' + level
  const existing = pool.get(key)
  if (existing) existing.weight += weight
  else pool.set(key, { speciesId, level, weight })
}

function addWeatherPool(pool: WeightedPool, area: AreaTable, flag: number, progress: 'catalog' | 'story' | 'champion') {
  const levelFloor = progress === 'champion' ? 60 : 0
  const active = area.tables.filter(([weathers]) => (weathers & flag) !== 0)
  const wanderers = area.wanderers?.filter(([weathers, , , championOnly]) =>
    (weathers & flag) !== 0 && (!championOnly || progress !== 'story')) ?? []
  // A walk samples a freely roaming strong spawn on 5% of rolls when ordinary tables are present.
  const wandererShare = wanderers.length ? (active.length ? 0.05 : 1) : 0
  for (const [, min, max, weights] of active) {
    const sharePerLevel = (1 - wandererShare) / active.length / (max - min + 1)
    for (const [speciesId, percent] of Object.entries(weights)) {
      for (let level = min; level <= max; level++) {
        addSlot(pool, speciesId, Math.max(level, levelFloor), percent * sharePerLevel)
      }
    }
  }
  for (const [, speciesId, level] of wanderers) {
    addSlot(pool, speciesId, Math.max(level, levelFloor), 100 * wandererShare / wanderers.length)
  }
}

export const galarEncounterSlots: AreaSlots = Object.fromEntries(Object.entries(areas).map(([id, area]) => {
  const pool: WeightedPool = new Map()
  const flags = galarWildAreaIds.has(id) ? weatherFlags : [AllWeather]
  for (const flag of flags) addWeatherPool(pool, area, flag, 'catalog')
  return [id, Array.from(pool.values(), ({ speciesId, level, weight }) => [speciesId, level, weight / flags.length])]
}))

// Restoring a save may happen on a different day from the encounter. Check every unlocked weather.
export function isGalarWildEncounter(id: string, speciesId: string, level: number, champion: boolean, badgeCount = 8) {
  const area = areas[id]
  if (!area || !Number.isInteger(level)) return false
  const inWildArea = galarWildAreaIds.has(id)
  const levelFloor = inWildArea && champion ? 60 : 0
  const weathers = !inWildArea || champion ? AllWeather
    : badgeCount >= 3 ? AllWeather & ~Fog : AllWeather & ~(Fog | Blizzard | Sand)
  return area.tables.some(([flags, min, max, chances]) =>
    (flags & weathers) !== 0 && Object.hasOwn(chances, speciesId) &&
    level >= Math.max(levelFloor, min) && level <= Math.max(levelFloor, max)) ||
    Boolean(area.wanderers?.some(([flags, species, nativeLevel, championOnly]) =>
      (flags & weathers) !== 0 && species === speciesId && Math.max(levelFloor, nativeLevel) === level &&
      (!championOnly || champion)))
}

export const galarLegendSlots: Readonly<Partial<Record<string, readonly LegendaryEncounter[]>>> = {
  'energy-plant': [
    { speciesId: 'eternatus', level: 60, weight: 1, minBadges: 8 },
    { speciesId: 'zacian', level: 70, weight: 1, championOnly: true },
  ],
}

// Known dates with uniform mainland weather. An absent entry uses the local daily forecast.
const firstOfMonth = [0, Blizzard, Clouds, Sand, Clear, Fog, Sun, Sun, Fog, Rain, Thunder, Snow]
function dailyWeather(zone: number, date: Date, badgeCount: number, champion: boolean) {
  const month = date.getMonth(), day = date.getDate()
  const uniform = day === 1 ? firstOfMonth[month]
    : month === 1 && day === 29 ? Fog : month === 11 && day === 25 ? Snow : 0
  // Use local calendar dates so daylight-saving changes cannot shift midnight boundaries.
  const dayNumber = Date.UTC(date.getFullYear(), month, day) / 86_400_000
  const index = ((dayNumber + zone * 5) % 9 + 9) % 9
  const forecast = uniform || weatherFlags[index]
  if (!champion && forecast === Fog) return Clear
  if (!champion && badgeCount < 3 && forecast === Sand) return Sun
  if (!champion && badgeCount < 3 && forecast === Blizzard) return Snow
  return forecast
}

interface GalarWeatherPool {
  weather: string
  encounters: readonly KantoEncounter[]
}

const weatherCache = new Map<string, GalarWeatherPool>()
export function getGalarWeatherEncounters(id: string, date: Date, badgeCount: number, champion: boolean): GalarWeatherPool | undefined {
  const zone = wildAreas.indexOf(id)
  if (zone < 0) return undefined
  const flag = dailyWeather(zone, date, badgeCount, champion)
  const cacheKey = id + ':' + flag + ':' + champion
  const cached = weatherCache.get(cacheKey)
  if (cached) return cached
  const pool: WeightedPool = new Map()
  addWeatherPool(pool, areas[id], flag, champion ? 'champion' : 'story')
  const result = { weather: weatherNames[flag], encounters: Array.from(pool.values()) }
  weatherCache.set(cacheKey, result)
  return result
}
