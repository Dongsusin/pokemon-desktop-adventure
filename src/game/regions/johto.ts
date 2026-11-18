// Pokémon Gold Pokégear landmarks with the original map's pixel coordinates.
// Gold's Kanto panel contains the league approach, so its coordinates start at x=160.

import type { KantoEncounter, KantoGym, KantoLocation } from './kanto'
import { johtoEncounterSlots } from './johto-encounters'

export const JOHTO_MAP_WIDTH = 200
export const JOHTO_MAP_HEIGHT = 144
export const JOHTO_START_LOCATION_ID = 'new-bark-town'
export const JOHTO_LEAGUE_LOCATION_ID = 'johto-league'

type LocationRow = readonly [
  id: string,
  name: string,
  nameEn: string,
  kind: KantoLocation['kind'],
  x: number,
  y: number,
  links: readonly string[],
]

const locationRows: readonly LocationRow[] = [
  ['new-bark-town', '연두마을', 'New Bark Town', 'town', 140, 100, ['route-29', 'route-27']],
  ['route-29', '29번도로', 'Route 29', 'route', 128, 100, ['new-bark-town', 'cherrygrove-city', 'route-46']],
  ['cherrygrove-city', '무궁시티', 'Cherrygrove City', 'city', 100, 100, ['route-29', 'route-30']],
  ['route-30', '30번도로', 'Route 30', 'route', 100, 80, ['cherrygrove-city', 'route-31']],
  ['route-31', '31번도로', 'Route 31', 'route', 96, 60, ['route-30', 'violet-city', 'dark-cave']],
  ['violet-city', '도라지시티', 'Violet City', 'city', 84, 60, ['route-31', 'sprout-tower', 'route-32', 'route-36']],
  ['sprout-tower', '모다피의탑', 'Sprout Tower', 'dungeon', 85, 58, ['violet-city']],
  ['route-32', '32번도로', 'Route 32', 'route', 84, 92, ['violet-city', 'ruins-of-alph', 'union-cave']],
  ['ruins-of-alph', '알프의유적', 'Ruins of Alph', 'dungeon', 76, 76, ['route-32', 'route-36', 'union-cave']],
  ['union-cave', '연결동굴', 'Union Cave', 'dungeon', 84, 124, ['route-32', 'route-33', 'ruins-of-alph']],
  ['route-33', '33번도로', 'Route 33', 'route', 82, 124, ['union-cave', 'azalea-town']],
  ['azalea-town', '고동마을', 'Azalea Town', 'town', 68, 124, ['route-33', 'slowpoke-well', 'ilex-forest']],
  ['slowpoke-well', '야돈의우물', 'Slowpoke Well', 'dungeon', 70, 122, ['azalea-town']],
  ['ilex-forest', '너도밤나무숲', 'Ilex Forest', 'dungeon', 52, 120, ['azalea-town', 'route-34']],
  ['route-34', '34번도로', 'Route 34', 'route', 52, 112, ['ilex-forest', 'goldenrod-city']],
  ['goldenrod-city', '금빛시티', 'Goldenrod City', 'city', 52, 92, ['route-34', 'goldenrod-radio-tower', 'route-35']],
  ['goldenrod-radio-tower', '라디오타워', 'Radio Tower', 'dungeon', 50, 92, ['goldenrod-city']],
  ['route-35', '35번도로', 'Route 35', 'route', 52, 76, ['goldenrod-city', 'national-park']],
  ['national-park', '자연공원', 'National Park', 'dungeon', 52, 60, ['route-35', 'route-36']],
  ['route-36', '36번도로', 'Route 36', 'route', 64, 60, ['national-park', 'route-37', 'violet-city', 'ruins-of-alph']],
  ['route-37', '37번도로', 'Route 37', 'route', 68, 52, ['route-36', 'ecruteak-city']],
  ['ecruteak-city', '인주시티', 'Ecruteak City', 'city', 68, 44, ['route-37', 'tin-tower', 'burned-tower', 'route-38', 'route-42']],
  ['tin-tower', '방울탑', 'Tin Tower', 'dungeon', 70, 42, ['ecruteak-city']],
  ['burned-tower', '불탄탑', 'Burned Tower', 'dungeon', 66, 42, ['ecruteak-city']],
  ['route-38', '38번도로', 'Route 38', 'route', 52, 44, ['ecruteak-city', 'route-39']],
  ['route-39', '39번도로', 'Route 39', 'route', 36, 48, ['route-38', 'olivine-city']],
  ['olivine-city', '담청시티', 'Olivine City', 'city', 36, 60, ['route-39', 'olivine-lighthouse', 'route-40']],
  ['olivine-lighthouse', '빛남의등대', 'Olivine Lighthouse', 'dungeon', 38, 62, ['olivine-city']],
  ['route-40', '40번수로', 'Route 40', 'route', 28, 64, ['olivine-city', 'route-41']],
  ['whirl-islands', '소용돌이섬', 'Whirl Islands', 'dungeon', 28, 92, ['route-41']],
  ['route-41', '41번수로', 'Route 41', 'route', 28, 100, ['route-40', 'whirl-islands', 'cianwood-city']],
  ['cianwood-city', '진청시티', 'Cianwood City', 'city', 20, 100, ['route-41']],
  ['route-42', '42번도로', 'Route 42', 'route', 92, 44, ['ecruteak-city', 'mt-mortar', 'mahogany-town']],
  ['mt-mortar', '절구산', 'Mt. Mortar', 'dungeon', 84, 44, ['route-42']],
  ['mahogany-town', '황토마을', 'Mahogany Town', 'town', 108, 44, ['route-42', 'route-43', 'route-44']],
  ['route-43', '43번도로', 'Route 43', 'route', 108, 36, ['mahogany-town', 'lake-of-rage']],
  ['lake-of-rage', '분노의호수', 'Lake of Rage', 'dungeon', 108, 28, ['route-43']],
  ['route-44', '44번도로', 'Route 44', 'route', 120, 44, ['mahogany-town', 'ice-path']],
  ['ice-path', '얼음샛길', 'Ice Path', 'dungeon', 130, 38, ['route-44', 'blackthorn-city']],
  ['blackthorn-city', '검은먹시티', 'Blackthorn City', 'city', 132, 44, ['ice-path', 'dragons-den', 'route-45']],
  ['dragons-den', '용의굴', 'Dragon\'s Den', 'dungeon', 132, 36, ['blackthorn-city']],
  ['route-45', '45번도로', 'Route 45', 'route', 132, 64, ['blackthorn-city', 'dark-cave', 'route-46']],
  ['dark-cave', '어둠의동굴', 'Dark Cave', 'dungeon', 112, 72, ['route-31', 'route-45', 'route-46']],
  ['route-46', '46번도로', 'Route 46', 'route', 124, 88, ['route-45', 'dark-cave', 'route-29']],
  ['mt-silver', '은빛산', 'Mt. Silver', 'dungeon', 148, 68, ['route-28']],
  ['johto-victory-road', '챔피언로드', 'Victory Road', 'dungeon', 188, 52, ['route-26', 'johto-route-23', 'route-28']],
  ['johto-route-23', '23번도로', 'Route 23', 'route', 188, 44, ['johto-victory-road', 'johto-league']],
  ['johto-league', '석영고원', 'Indigo Plateau', 'league', 188, 36, ['johto-route-23']],
  ['route-26', '26번도로', 'Route 26', 'route', 188, 92, ['route-27', 'johto-victory-road']],
  ['route-27', '27번도로', 'Route 27', 'route', 180, 100, ['new-bark-town', 'tohjo-falls', 'route-26']],
  ['tohjo-falls', '동성폭포', 'Tohjo Falls', 'dungeon', 172, 100, ['route-27']],
  ['route-28', '28번도로', 'Route 28', 'route', 180, 68, ['johto-victory-road', 'mt-silver']],
]

const gyms: Readonly<Partial<Record<string, KantoGym>>> = {
  'violet-city': { leader: '비상', type: 'flying', badge: '윙배지' },
  'azalea-town': { leader: '호일', type: 'bug', badge: '인섹트배지' },
  'goldenrod-city': { leader: '꼭두', type: 'normal', badge: '레귤러배지' },
  'ecruteak-city': { leader: '유빈', type: 'ghost', badge: '팬텀배지' },
  'cianwood-city': { leader: '사도', type: 'fighting', badge: '쇼크배지' },
  'olivine-city': { leader: '규리', type: 'steel', badge: '스틸배지' },
  'mahogany-town': { leader: '류옹', type: 'ice', badge: '아이스배지' },
  'blackthorn-city': { leader: '이향', type: 'dragon', badge: '라이징배지' },
}

const legends: Readonly<Partial<Record<string, readonly KantoEncounter[]>>> = {
  'tin-tower': [{ speciesId: 'ho-oh', level: 40, weight: 1 }],
  'whirl-islands': [{ speciesId: 'lugia', level: 70, weight: 1 }],
}

export const johtoLocations: readonly KantoLocation[] = locationRows.map(
  ([id, name, nameEn, kind, x, y, links]) => ({
    id, name, nameEn, kind, x, y, links,
    encounters: (johtoEncounterSlots[id] ?? []).map(([speciesId, level, weight]) => ({ speciesId, level, weight })),
    gym: gyms[id],
    legends: legends[id],
  }),
)

export const johtoLocationById: Readonly<Record<string, KantoLocation>> = Object.fromEntries(
  johtoLocations.map((location) => [location.id, location]),
)

export const johtoRegion = {
  id: 'johto',
  name: '성도지방',
  generation: 2,
  startLocationId: JOHTO_START_LOCATION_ID,
  leagueLocationId: JOHTO_LEAGUE_LOCATION_ID,
  gymLocationIds: Object.keys(gyms),
  locations: johtoLocations,
} as const
