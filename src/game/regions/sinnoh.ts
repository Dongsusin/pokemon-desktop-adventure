// Platinum Town Map cursor coordinates and field connections. See assets/maps/sinnoh/SOURCES.md.
import type { KantoEncounter, KantoGym, KantoLocation } from './kanto'
import { sinnohEncounterSlots, sinnohLegendSlots } from './sinnoh-encounters'

export const SINNOH_MAP_WIDTH = 216
export const SINNOH_MAP_HEIGHT = 168
export const SINNOH_START_LOCATION_ID = 'twinleaf-town'
export const SINNOH_LEAGUE_LOCATION_ID = 'sinnoh-league'

type LocationRow = readonly [
  id: string, name: string, nameEn: string, kind: KantoLocation['kind'],
  x: number, y: number, links: readonly string[],
]

const locationRows: readonly LocationRow[] = [
  ['twinleaf-town', '떡잎마을', 'Twinleaf Town', 'town', 26, 155, ['route-201']],
  ['sandgem-town', '잔모래마을', 'Sandgem Town', 'town', 40, 148, ['route-201', 'route-202', 'route-219']],
  ['floaroma-town', '꽃향기마을', 'Floaroma Town', 'town', 40, 102, ['route-204', 'route-205', 'floaroma-meadow']],
  ['solaceon-town', '신수마을', 'Solaceon Town', 'town', 127, 106, ['route-209', 'route-210', 'solaceon-ruins']],
  ['celestic-town', '봉신마을', 'Celestic Town', 'town', 103, 78, ['route-210', 'route-211']],
  ['survival-area', '서바이벌에리어', 'Survival Area', 'town', 145, 36, ['route-225', 'route-226']],
  ['resort-area', '리조트에리어', 'Resort Area', 'town', 180, 64, ['route-229']],
  ['jubilife-city', '축복시티', 'Jubilife City', 'city', 36, 130, ['route-202', 'route-203', 'route-204', 'route-218']],
  ['canalave-city', '운하시티', 'Canalave City', 'city', 12, 123, ['route-218', 'iron-island', 'fullmoon-island', 'newmoon-island']],
  ['oreburgh-city', '무쇠시티', 'Oreburgh City', 'city', 65, 130, ['oreburgh-gate', 'route-207', 'oreburgh-mine']],
  ['eterna-city', '영원시티', 'Eterna City', 'city', 71, 81, ['eterna-forest', 'route-211', 'route-205', 'route-206']],
  ['hearthome-city', '연고시티', 'Hearthome City', 'city', 106, 116, ['route-208', 'route-209', 'amity-square', 'route-212']],
  ['pastoria-city', '들판시티', 'Pastoria City', 'city', 134, 144, ['route-213', 'route-212', 'great-marsh']],
  ['veilstone-city', '장막시티', 'Veilstone City', 'city', 155, 95, ['route-215', 'route-214', 'galactic-hq']],
  ['sunyshore-city', '물가시티', 'Sunyshore City', 'city', 190, 130, ['route-222', 'route-223']],
  ['snowpoint-city', '선단시티', 'Snowpoint City', 'city', 82, 11, ['acuity-lakefront', 'snowpoint-temple', 'fight-area']],
  ['fight-area', '파이트에리어', 'Fight Area', 'town', 142, 57, ['snowpoint-city', 'sinnoh-battle-frontier', 'route-225', 'route-230']],
  ['route-201', '201번도로', 'Route 201', 'route', 26, 148, ['twinleaf-town', 'sandgem-town', 'verity-lakefront']],
  ['route-202', '202번도로', 'Route 202', 'route', 40, 141, ['sandgem-town', 'jubilife-city']],
  ['route-203', '203번도로', 'Route 203', 'route', 47, 127, ['jubilife-city', 'oreburgh-gate']],
  ['route-204', '204번도로', 'Route 204', 'route', 40, 113, ['jubilife-city', 'ravaged-path', 'floaroma-town']],
  ['route-205', '205번도로', 'Route 205', 'route', 47, 92, ['floaroma-town', 'eterna-forest', 'fuego-ironworks', 'valley-windworks', 'eterna-city']],
  ['route-206', '206번도로', 'Route 206', 'route', 68, 99, ['eterna-city', 'route-207', 'wayward-cave']],
  ['route-207', '207번도로', 'Route 207', 'route', 68, 120, ['oreburgh-city', 'mt-coronet', 'route-206']],
  ['route-208', '208번도로', 'Route 208', 'route', 89, 120, ['mt-coronet', 'hearthome-city']],
  ['route-209', '209번도로', 'Route 209', 'route', 124, 120, ['hearthome-city', 'solaceon-town', 'lost-tower']],
  ['route-210', '210번도로', 'Route 210', 'route', 124, 85, ['solaceon-town', 'celestic-town', 'route-215']],
  ['route-211', '211번도로', 'Route 211', 'route', 82, 78, ['celestic-town', 'mt-coronet', 'eterna-city']],
  ['route-212', '212번도로', 'Route 212', 'route', 110, 148, ['pastoria-city', 'hearthome-city', 'sinnoh-pokemon-mansion']],
  ['route-213', '213번도로', 'Route 213', 'route', 152, 141, ['valor-lakefront', 'pastoria-city']],
  ['route-214', '214번도로', 'Route 214', 'route', 159, 113, ['ruin-maniac-cave', 'veilstone-city', 'valor-lakefront', 'spring-path']],
  ['route-215', '215번도로', 'Route 215', 'route', 138, 92, ['route-210', 'veilstone-city']],
  ['route-216', '216번도로', 'Route 216', 'route', 75, 50, ['mt-coronet', 'route-217']],
  ['route-217', '217번도로', 'Route 217', 'route', 68, 29, ['route-216', 'acuity-lakefront']],
  ['route-218', '218번도로', 'Route 218', 'route', 19, 127, ['jubilife-city', 'canalave-city']],
  ['route-219', '219번도로', 'Route 219', 'route', 40, 155, ['sandgem-town', 'route-220']],
  ['route-220', '220번수로', 'Route 220', 'route', 40, 162, ['route-219', 'route-221']],
  ['route-221', '221번도로', 'Route 221', 'route', 61, 162, ['route-220', 'pal-park']],
  ['route-222', '222번도로', 'Route 222', 'route', 173, 134, ['valor-lakefront', 'sunyshore-city']],
  ['route-223', '223번수로', 'Route 223', 'route', 187, 106, ['sunyshore-city', 'sinnoh-victory-road']],
  ['route-224', '224번도로', 'Route 224', 'route', 194, 78, ['sinnoh-victory-road', 'seabreak-path']],
  ['route-225', '225번도로', 'Route 225', 'route', 138, 43, ['fight-area', 'survival-area']],
  ['route-226', '226번수로', 'Route 226', 'route', 159, 36, ['survival-area', 'route-227', 'route-228']],
  ['route-227', '227번도로', 'Route 227', 'route', 166, 22, ['route-226', 'stark-mountain']],
  ['route-228', '228번도로', 'Route 228', 'route', 173, 43, ['route-226', 'route-229', 'rock-peak-ruins']],
  ['route-229', '229번도로', 'Route 229', 'route', 173, 57, ['route-228', 'resort-area', 'route-230']],
  ['route-230', '230번수로', 'Route 230', 'route', 159, 57, ['route-229', 'fight-area']],
  ['sinnoh-league', '포켓몬리그', 'Pokémon League', 'league', 187, 85, ['sinnoh-victory-road']],
  ['sinnoh-victory-road', '챔피언로드', 'Victory Road', 'dungeon', 187, 92, ['route-223', 'sinnoh-league', 'route-224']],
  ['verity-lakefront', '진실호수근처', 'Verity Lakefront', 'dungeon', 12, 141, ['route-201', 'lake-verity']],
  ['valor-lakefront', '입지호수근처', 'Valor Lakefront', 'dungeon', 152, 127, ['route-214', 'route-213', 'lake-valor', 'route-222']],
  ['acuity-lakefront', '예지호수근처', 'Acuity Lakefront', 'dungeon', 68, 8, ['route-217', 'snowpoint-city', 'lake-acuity']],
  ['spring-path', '숨겨진 샘의 길', 'Spring Path', 'dungeon', 166, 113, ['route-214', 'sendoff-spring']],
  ['valley-windworks', '골짜기발전소', 'Valley Windworks', 'dungeon', 54, 106, ['route-205']],
  ['eterna-forest', '영원의 숲', 'Eterna Forest', 'dungeon', 47, 78, ['route-205', 'eterna-city', 'old-chateau']],
  ['fuego-ironworks', '골풀무제철소', 'Fuego Ironworks', 'dungeon', 40, 92, ['floaroma-meadow', 'route-205']],
  ['mt-coronet', '천관산', 'Mt. Coronet', 'dungeon', 89, 85, ['route-207', 'route-208', 'route-211', 'route-216', 'spear-pillar', 'iceberg-ruins']],
  ['fullmoon-island', '만월섬', 'Fullmoon Island', 'dungeon', 12, 22, ['canalave-city']],
  ['stark-mountain', '하드마운틴', 'Stark Mountain', 'dungeon', 166, 15, ['route-227']],
  ['flower-paradise', '꽃의 낙원', 'Flower Paradise', 'dungeon', 201, 8, ['seabreak-path']],
  ['iron-island', '강철섬', 'Iron Island', 'dungeon', 26, 71, ['canalave-city', 'iron-ruins']],
  ['newmoon-island', '신월섬', 'Newmoon Island', 'dungeon', 33, 22, ['canalave-city']],
  ['sinnoh-battle-frontier', '배틀프런티어', 'Battle Frontier', 'dungeon', 145, 50, ['fight-area']],
  ['seabreak-path', '갈라진 바닷길', 'Seabreak Path', 'dungeon', 201, 36, ['route-224', 'flower-paradise']],
  ['lake-verity', '진실호수', 'Lake Verity', 'dungeon', 19, 148, ['verity-lakefront']],
  ['lake-valor', '입지호수', 'Lake Valor', 'dungeon', 159, 127, ['valor-lakefront']],
  ['lake-acuity', '예지호수', 'Lake Acuity', 'dungeon', 75, 15, ['acuity-lakefront']],
  ['oreburgh-gate', '무쇠게이트', 'Oreburgh Gate', 'dungeon', 54, 127, ['route-203', 'oreburgh-city']],
  ['ravaged-path', '험한 샛길', 'Ravaged Path', 'dungeon', 40, 120, ['route-204']],
  ['wayward-cave', '미혹의 동굴', 'Wayward Cave', 'dungeon', 68, 99, ['route-206']],
  ['lost-tower', '로스트타워', 'Lost Tower', 'dungeon', 124, 113, ['route-209']],
  ['trophy-garden', '자랑의 뒷마당', 'Trophy Garden', 'dungeon', 103, 134, ['sinnoh-pokemon-mansion']],
  ['sinnoh-pokemon-mansion', '포켓몬저택', 'Pokémon Mansion', 'dungeon', 103, 134, ['route-212', 'trophy-garden']],
  ['ruin-maniac-cave', '유적마니아굴', 'Ruin Maniac Cave', 'dungeon', 159, 106, ['solaceon-ruins', 'route-214']],
  ['pal-park', '팔파크', 'Pal Park', 'dungeon', 68, 162, ['route-221']],
  ['floaroma-meadow', '꽃향기의 꽃밭', 'Floaroma Meadow', 'dungeon', 40, 99, ['floaroma-town', 'fuego-ironworks']],
  ['solaceon-ruins', '신수유적', 'Solaceon Ruins', 'dungeon', 131, 106, ['solaceon-town', 'ruin-maniac-cave']],
  ['oreburgh-mine', '무쇠탄갱', 'Oreburgh Mine', 'dungeon', 68, 134, ['oreburgh-city']],
  ['amity-square', '상호교류광장', 'Amity Square', 'dungeon', 103, 113, ['hearthome-city']],
  ['great-marsh', '대습초원', 'Great Marsh', 'dungeon', 138, 141, ['pastoria-city']],
  ['galactic-hq', '갤럭시단아지트', 'Galactic HQ', 'dungeon', 159, 92, ['veilstone-city']],
  ['snowpoint-temple', '선단신전', 'Snowpoint Temple', 'dungeon', 82, 8, ['snowpoint-city']],
  ['turnback-cave', '귀혼동굴', 'Turnback Cave', 'dungeon', 166, 120, ['sendoff-spring', 'distortion-world']],
  ['old-chateau', '숲의 양옥집', 'Old Chateau', 'dungeon', 54, 78, ['eterna-forest']],
  ['spear-pillar', '창기둥', 'Spear Pillar', 'dungeon', 82, 99, ['distortion-world', 'mt-coronet']],
  ['distortion-world', '깨어진 세계', 'Distortion World', 'dungeon', 82, 99, ['turnback-cave', 'spear-pillar']],
  ['sendoff-spring', '송별의 샘', 'Sendoff Spring', 'dungeon', 166, 120, ['spring-path', 'turnback-cave']],
  ['iron-ruins', '무쇠의 유적', 'Iron Ruins', 'dungeon', 26, 71, ['iron-island']],
  ['iceberg-ruins', '빙산의 유적', 'Iceberg Ruins', 'dungeon', 89, 50, ['mt-coronet']],
  ['rock-peak-ruins', '바위산의 유적', 'Rock Peak Ruins', 'dungeon', 173, 36, ['route-228']],
]

const gyms: Readonly<Partial<Record<string, KantoGym>>> = {
  'oreburgh-city': { leader: '강석', type: 'rock', badge: '콜배지' },
  'eterna-city': { leader: '유채', type: 'grass', badge: '포리스트배지' },
  'hearthome-city': { leader: '멜리사', type: 'ghost', badge: '레릭배지' },
  'veilstone-city': { leader: '자두', type: 'fighting', badge: '코블배지' },
  'pastoria-city': { leader: '맥실러', type: 'water', badge: '펜배지' },
  'canalave-city': { leader: '동관', type: 'steel', badge: '마인배지' },
  'snowpoint-city': { leader: '무청', type: 'ice', badge: '글레이셔배지' },
  'sunyshore-city': { leader: '전진', type: 'electric', badge: '비컨배지' },
}

function encounters(slots: readonly (readonly [string, number, number])[]): KantoEncounter[] {
  return slots.map(([speciesId, level, weight]) => ({ speciesId, level, weight }))
}

export const sinnohLocations: readonly KantoLocation[] = locationRows.map(
  ([id, name, nameEn, kind, x, y, links]) => {
    const legends = sinnohLegendSlots[id]
    return {
      id, name, nameEn, kind, x, y, links,
      encounters: encounters(sinnohEncounterSlots[id] ?? []),
      legends: legends && encounters(legends),
      gym: gyms[id],
    }
  },
)

export const sinnohLocationById: Readonly<Record<string, KantoLocation>> = Object.fromEntries(
  sinnohLocations.map((location) => [location.id, location]),
)

export const sinnohRegion = {
  id: 'sinnoh',
  name: '신오지방',
  generation: 4,
  startLocationId: SINNOH_START_LOCATION_ID,
  leagueLocationId: SINNOH_LEAGUE_LOCATION_ID,
  gymLocationIds: Object.keys(gyms),
  locations: sinnohLocations,
} as const
