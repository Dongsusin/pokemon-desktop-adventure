// Emerald PokéNav section coordinates and field connections. See assets/maps/hoenn/SOURCES.md.
import type { KantoEncounter, KantoGym, KantoLocation } from './kanto'
import { hoennEncounterSlots, hoennLegendSlots } from './hoenn-encounters'

export const HOENN_MAP_WIDTH = 240
export const HOENN_MAP_HEIGHT = 160
export const HOENN_START_LOCATION_ID = 'littleroot-town'
export const HOENN_LEAGUE_LOCATION_ID = 'hoenn-league'

type LocationRow = readonly [
  id: string, name: string, nameEn: string, kind: KantoLocation['kind'],
  x: number, y: number, links: readonly string[],
]

const locationRows: readonly LocationRow[] = [
  ['littleroot-town', '미로마을', 'Littleroot Town', 'town', 44, 108, ['route-101']],
  ['oldale-town', '고도마을', 'Oldale Town', 'town', 44, 92, ['route-103', 'route-101', 'route-102']],
  ['dewford-town', '무로마을', 'Dewford Town', 'town', 28, 132, ['route-106', 'route-107']],
  ['lavaridge-town', '용암마을', 'Lavaridge Town', 'town', 52, 44, ['route-112']],
  ['fallarbor-town', '단풍마을', 'Fallarbor Town', 'town', 36, 20, ['route-114', 'route-113']],
  ['verdanturf-town', '잔디마을', 'Verdanturf Town', 'town', 44, 68, ['route-116', 'route-117', 'rusturf-tunnel']],
  ['pacifidlog-town', '황금마을', 'Pacifidlog Town', 'town', 148, 100, ['route-132', 'route-131']],
  ['petalburg-city', '등화도시', 'Petalburg City', 'city', 20, 92, ['route-104', 'route-102']],
  ['slateport-city', '잿빛도시', 'Slateport City', 'city', 76, 104, ['route-110', 'route-109', 'route-134', 'battle-frontier']],
  ['mauville-city', '보라시티', 'Mauville City', 'city', 80, 68, ['route-111', 'route-110', 'route-117', 'route-118']],
  ['rustboro-city', '금탄도시', 'Rustboro City', 'city', 12, 64, ['route-115', 'route-104', 'route-116']],
  ['fortree-city', '검방울시티', 'Fortree City', 'city', 108, 20, ['route-119', 'route-120']],
  ['lilycove-city', '해안시티', 'Lilycove City', 'city', 160, 44, ['route-121', 'route-124', 'aqua-hideout', 'battle-frontier']],
  ['mossdeep-city', '이끼시티', 'Mossdeep City', 'city', 208, 60, ['route-125', 'route-127', 'route-124']],
  ['sootopolis-city', '루네시티', 'Sootopolis City', 'city', 180, 76, ['cave-of-origin', 'underwater-route-126']],
  ['ever-grande-city', '그랜드시티', 'Ever Grande City', 'city', 228, 92, ['route-128', 'hoenn-victory-road']],
  ['route-101', '101번도로', 'Route 101', 'route', 44, 100, ['littleroot-town', 'oldale-town']],
  ['route-102', '102번도로', 'Route 102', 'route', 28, 92, ['oldale-town', 'petalburg-city']],
  ['route-103', '103번도로', 'Route 103', 'route', 52, 84, ['oldale-town', 'route-110', 'altering-cave']],
  ['route-104', '104번도로', 'Route 104', 'route', 12, 84, ['petalburg-city', 'rustboro-city', 'route-105', 'petalburg-woods']],
  ['route-105', '105번수로', 'Route 105', 'route', 12, 108, ['route-104', 'route-106', 'island-cave', 'marine-cave']],
  ['route-106', '106번수로', 'Route 106', 'route', 12, 124, ['dewford-town', 'route-105', 'granite-cave']],
  ['route-107', '107번수로', 'Route 107', 'route', 44, 132, ['dewford-town', 'route-108']],
  ['route-108', '108번수로', 'Route 108', 'route', 60, 132, ['route-107', 'route-109', 'abandoned-ship']],
  ['route-109', '109번수로', 'Route 109', 'route', 76, 124, ['slateport-city', 'route-108']],
  ['route-110', '110번도로', 'Route 110', 'route', 76, 84, ['slateport-city', 'mauville-city', 'route-103', 'new-mauville']],
  ['route-111', '111번도로', 'Route 111', 'route', 76, 36, ['mauville-city', 'route-113', 'route-112', 'desert-ruins', 'mirage-tower']],
  ['route-112', '112번도로', 'Route 112', 'route', 60, 44, ['lavaridge-town', 'route-111', 'route-113', 'mt-chimney', 'fiery-path', 'jagged-pass']],
  ['route-113', '113번도로', 'Route 113', 'route', 52, 20, ['fallarbor-town', 'route-111', 'route-112']],
  ['route-114', '114번도로', 'Route 114', 'route', 20, 28, ['fallarbor-town', 'route-115', 'meteor-falls', 'desert-underpass', 'terra-cave']],
  ['route-115', '115번도로', 'Route 115', 'route', 12, 44, ['rustboro-city', 'route-114', 'meteor-falls', 'terra-cave']],
  ['route-116', '116번도로', 'Route 116', 'route', 28, 60, ['verdanturf-town', 'rustboro-city', 'rusturf-tunnel', 'terra-cave']],
  ['route-117', '117번도로', 'Route 117', 'route', 60, 68, ['verdanturf-town', 'mauville-city']],
  ['route-118', '118번도로', 'Route 118', 'route', 92, 68, ['mauville-city', 'route-119', 'route-123', 'terra-cave']],
  ['route-119', '119번도로', 'Route 119', 'route', 100, 36, ['fortree-city', 'route-118']],
  ['route-120', '120번도로', 'Route 120', 'route', 116, 28, ['fortree-city', 'route-121', 'ancient-tomb', 'scorched-slab']],
  ['route-121', '121번도로', 'Route 121', 'route', 132, 44, ['lilycove-city', 'route-120', 'route-122', 'hoenn-safari-zone']],
  ['route-122', '122번수로', 'Route 122', 'route', 140, 52, ['route-121', 'route-123', 'mt-pyre']],
  ['route-123', '123번도로', 'Route 123', 'route', 124, 68, ['route-118', 'route-122']],
  ['route-124', '124번수로', 'Route 124', 'route', 180, 52, ['lilycove-city', 'mossdeep-city', 'route-126', 'route-125', 'underwater-route-124']],
  ['route-125', '125번수로', 'Route 125', 'route', 204, 44, ['mossdeep-city', 'route-124', 'shoal-cave', 'marine-cave']],
  ['route-126', '126번수로', 'Route 126', 'route', 180, 68, ['route-124', 'route-127', 'underwater-route-126']],
  ['route-127', '127번수로', 'Route 127', 'route', 204, 76, ['mossdeep-city', 'route-126', 'route-128', 'marine-cave']],
  ['route-128', '128번수로', 'Route 128', 'route', 204, 92, ['ever-grande-city', 'route-127', 'route-129', 'seafloor-cavern']],
  ['route-129', '129번수로', 'Route 129', 'route', 204, 100, ['route-128', 'route-130', 'marine-cave']],
  ['route-130', '130번수로', 'Route 130', 'route', 188, 100, ['route-129', 'route-131', 'mirage-island']],
  ['route-131', '131번수로', 'Route 131', 'route', 164, 100, ['pacifidlog-town', 'route-130', 'sky-pillar']],
  ['route-132', '132번수로', 'Route 132', 'route', 132, 100, ['pacifidlog-town', 'route-133']],
  ['route-133', '133번수로', 'Route 133', 'route', 116, 100, ['route-132', 'route-134']],
  ['route-134', '134번수로', 'Route 134', 'route', 92, 100, ['slateport-city', 'route-133', 'sealed-chamber']],
  ['petalburg-woods', '등화숲', 'Petalburg Woods', 'dungeon', 12, 84, ['route-104']],
  ['rusturf-tunnel', '금잔터널', 'Rusturf Tunnel', 'dungeon', 28, 60, ['route-116', 'verdanturf-town']],
  ['granite-cave', '바위동굴', 'Granite Cave', 'dungeon', 20, 124, ['route-106']],
  ['abandoned-ship', '버려진배', 'Abandoned Ship', 'dungeon', 60, 132, ['route-108']],
  ['new-mauville', '뉴보라', 'New Mauville', 'dungeon', 76, 76, ['route-110']],
  ['mt-chimney', '굴뚝산', 'Mt. Chimney', 'dungeon', 60, 36, ['route-112', 'jagged-pass']],
  ['fiery-path', '불꽃샛길', 'Fiery Path', 'dungeon', 60, 44, ['route-112']],
  ['jagged-pass', '울퉁불퉁산길', 'Jagged Pass', 'dungeon', 60, 44, ['mt-chimney', 'route-112', 'magma-hideout']],
  ['meteor-falls', '유성의폭포', 'Meteor Falls', 'dungeon', 12, 44, ['route-114', 'route-115']],
  ['hoenn-safari-zone', '사파리존', 'Safari Zone', 'dungeon', 140, 36, ['route-121']],
  ['mt-pyre', '송화산', 'Mt. Pyre', 'dungeon', 140, 52, ['route-122']],
  ['aqua-hideout', '아쿠아단아지트', 'Aqua Hideout', 'dungeon', 164, 44, ['lilycove-city']],
  ['magma-hideout', '마그마단아지트', 'Magma Hideout', 'dungeon', 60, 44, ['jagged-pass']],
  ['shoal-cave', '여울의동굴', 'Shoal Cave', 'dungeon', 204, 52, ['route-125']],
  ['seafloor-cavern', '해저동굴', 'Seafloor Cavern', 'dungeon', 204, 92, ['route-128']],
  ['cave-of-origin', '각성의사당', 'Cave of Origin', 'dungeon', 180, 76, ['sootopolis-city']],
  ['sky-pillar', '하늘기둥', 'Sky Pillar', 'dungeon', 164, 100, ['route-131']],
  ['hoenn-victory-road', '챔피언로드', 'Victory Road', 'dungeon', 228, 92, ['ever-grande-city', 'hoenn-league']],
  ['hoenn-league', '포켓몬리그', 'Pokémon League', 'league', 228, 84, ['hoenn-victory-road']],
  ['underwater-route-124', '124번수로 해저', 'Underwater Route 124', 'dungeon', 184, 52, ['route-124', 'underwater-route-126']],
  ['underwater-route-126', '126번수로 해저', 'Underwater Route 126', 'dungeon', 172, 76, ['underwater-route-124', 'route-126', 'sootopolis-city']],
  ['desert-ruins', '사막유적', 'Desert Ruins', 'dungeon', 76, 44, ['route-111']],
  ['island-cave', '작은섬옆굴', 'Island Cave', 'dungeon', 12, 100, ['route-105']],
  ['ancient-tomb', '고대의무덤', 'Ancient Tomb', 'dungeon', 116, 36, ['route-120']],
  ['sealed-chamber', '고시의석실', 'Sealed Chamber', 'dungeon', 100, 100, ['route-134']],
  ['scorched-slab', '가뭄의암굴', 'Scorched Slab', 'dungeon', 116, 20, ['route-120']],
  ['mirage-tower', '환영탑', 'Mirage Tower', 'dungeon', 76, 36, ['route-111']],
  ['desert-underpass', '사막지하도', 'Desert Underpass', 'dungeon', 28, 20, ['route-114']],
  ['altering-cave', '변화동굴', 'Altering Cave', 'dungeon', 60, 84, ['route-103']],
  ['battle-frontier', '배틀프런티어', 'Battle Frontier', 'dungeon', 188, 116, ['slateport-city', 'lilycove-city', 'artisan-cave']],
  ['artisan-cave', '장인의동굴', 'Artisan Cave', 'dungeon', 188, 116, ['battle-frontier']],
  ['mirage-island', '환상섬', 'Mirage Island', 'dungeon', 188, 100, ['route-130']],
  ['terra-cave', '육지의동굴', 'Terra Cave', 'dungeon', 20, 28, ['route-114', 'route-115', 'route-116', 'route-118']],
  ['marine-cave', '바다의동굴', 'Marine Cave', 'dungeon', 212, 52, ['route-105', 'route-125', 'route-127', 'route-129']],
]

const gyms: Readonly<Partial<Record<string, KantoGym>>> = {
  'rustboro-city': { leader: '원규', type: 'rock', badge: '스톤배지' },
  'dewford-town': { leader: '철구', type: 'fighting', badge: '너클배지' },
  'mauville-city': { leader: '암페어', type: 'electric', badge: '다이나모배지' },
  'lavaridge-town': { leader: '민지', type: 'fire', badge: '히트배지' },
  'petalburg-city': { leader: '종길', type: 'normal', badge: '밸런스배지' },
  'fortree-city': { leader: '은송', type: 'flying', badge: '깃털배지' },
  'mossdeep-city': { leader: '풍&란', type: 'psychic', badge: '마인드배지' },
  'sootopolis-city': { leader: '아단', type: 'water', badge: '레인배지' },
}

function encounters(slots: readonly (readonly [string, number, number])[]): KantoEncounter[] {
  return slots.map(([speciesId, level, weight]) => ({ speciesId, level, weight }))
}

export const hoennLocations: readonly KantoLocation[] = locationRows.map(
  ([id, name, nameEn, kind, x, y, links]) => {
    const legends = hoennLegendSlots[id]
    return {
      id, name, nameEn, kind, x, y, links,
      encounters: encounters(hoennEncounterSlots[id] ?? []),
      legends: legends && encounters(legends),
      gym: gyms[id],
    }
  },
)

export const hoennLocationById: Readonly<Record<string, KantoLocation>> = Object.fromEntries(
  hoennLocations.map((location) => [location.id, location]),
)

export const hoennRegion = {
  id: 'hoenn',
  name: '호연지방',
  generation: 3,
  startLocationId: HOENN_START_LOCATION_ID,
  leagueLocationId: HOENN_LEAGUE_LOCATION_ID,
  gymLocationIds: Object.keys(gyms),
  locations: hoennLocations,
} as const
