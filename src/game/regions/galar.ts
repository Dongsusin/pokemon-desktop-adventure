// Pokémon Sword town map. Coordinates use pixels of the original game image.
import type { KantoLocation } from './kanto'
import { galarEncounterSlots, galarLegendSlots } from './galar-encounters'
import { galarGymTrainerByLocationId } from './galarCampaign'

export const GALAR_MAP_WIDTH = 1920
export const GALAR_MAP_HEIGHT = 4932
export const GALAR_START_LOCATION_ID = 'postwick'
export const GALAR_LEAGUE_LOCATION_ID = 'wyndon-stadium'

type LocationRow = readonly [
  id: string, name: string, nameEn: string, kind: KantoLocation['kind'],
  x: number, y: number, links: readonly string[],
]

const areas: ReadonlyArray<{ name: string; places: readonly LocationRow[] }> = [
  { name: '남부 가라르', places: [
    ['postwick', '펄롱마을', 'Postwick', 'town', 973, 4765, ['slumbering-weald', 'galar-route-1']],
    ['slumbering-weald', '꾸벅졸음숲', 'Slumbering Weald', 'dungeon', 659, 4804, ['slumbering-weald-interior', 'postwick']],
    ['slumbering-weald-interior', '꾸벅졸음숲 깊은 곳', 'Slumbering Weald (Interior)', 'dungeon', 563, 4701, ['slumbering-weald']],
    ['galar-route-1', '1번도로', 'Route 1', 'route', 973, 4618, ['postwick', 'wedgehurst']],
    ['wedgehurst', '브래시마을', 'Wedgehurst', 'town', 973, 4439, ['galar-route-1', 'galar-route-2', 'wedgehurst-lab', 'wedgehurst-station']],
    ['wedgehurst-station', '브래시마을역', 'Wedgehurst Station', 'dungeon', 902, 4477, ['wedgehurst', 'wild-area-station', 'motostoke-station', 'hulbury-station', 'hammerlocke-station', 'white-hill-station', 'wyndon-station']],
    ['wedgehurst-lab', '포켓몬 연구소', 'Pokémon Research Lab', 'dungeon', 1082, 4445, ['wedgehurst']],
    ['galar-route-2', '2번도로', 'Route 2', 'route', 1152, 4336, ['wedgehurst', 'magnolias-house', 'galar-route-2-lakeside']],
    ['galar-route-2-lakeside', '2번도로 호수 건너편', 'Route 2 (Lakeside)', 'route', 1165, 4215, ['galar-route-2']],
    ['magnolias-house', '박사의 집', 'Professor\'s House', 'dungeon', 1331, 4163, ['galar-route-2']],
  ] },
  { name: '와일드에리어 남부', places: [
    ['wild-area-station', '와일드에리어역', 'Wild Area Station', 'dungeon', 870, 3990, ['meetup-spot', 'wedgehurst-station', 'motostoke-station', 'hulbury-station', 'hammerlocke-station', 'white-hill-station', 'wyndon-station']],
    ['meetup-spot', '모임의 공터', 'Meetup Spot', 'town', 868.5, 4067.5, ['wild-area-station', 'rolling-fields']],
    ['rolling-fields', '화창한 초원', 'Rolling Fields', 'route', 769.5, 3891.5, ['meetup-spot', 'west-lake-axewell', 'dappled-grove', 'east-lake-axewell', 'south-lake-miloch']],
    ['dappled-grove', '햇살비추는숲', 'Dappled Grove', 'route', 639.5, 3921.5, ['watchtower-ruins', 'rolling-fields', 'west-lake-axewell']],
    ['watchtower-ruins', '감시탑 유적지', 'Watchtower Ruins', 'route', 699.5, 3534.5, ['dappled-grove', 'west-lake-axewell', 'east-lake-axewell']],
    ['east-lake-axewell', '터검니호 동쪽', 'East Lake Axewell', 'route', 909.5, 3531.5, ['west-lake-axewell', 'rolling-fields', 'watchtower-ruins', 'axews-eye', 'motostoke', 'north-lake-miloch', 'south-lake-miloch']],
    ['west-lake-axewell', '터검니호 서쪽', 'West Lake Axewell', 'route', 660.5, 3695.5, ['watchtower-ruins', 'rolling-fields', 'dappled-grove', 'east-lake-axewell']],
    ['axews-eye', '터검니호의 눈동자', 'Axew’s Eye', 'route', 824.5, 3711.5, ['east-lake-axewell']],
    ['south-lake-miloch', '밀로틱호 남쪽', 'South Lake Miloch', 'route', 1064.5, 3771.5, ['rolling-fields', 'east-lake-axewell', 'north-lake-miloch', 'giants-seat']],
    ['giants-seat', '거인의 의자', 'Giant’s Seat', 'route', 1169.5, 3811.5, ['south-lake-miloch', 'north-lake-miloch']],
    ['north-lake-miloch', '밀로틱호 북쪽', 'North Lake Miloch', 'route', 1129.5, 3501.5, ['east-lake-axewell', 'motostoke-riverbank', 'south-lake-miloch', 'giants-seat']],
  ] },
  { name: '엔진시티 일대', places: [
    ['motostoke', '엔진시티', 'Motostoke', 'city', 909, 3209, ['east-lake-axewell', 'galar-route-3', 'motostoke-outskirts', 'motostoke-station']],
    ['motostoke-station', '엔진시티역', 'Motostoke Station', 'dungeon', 685, 3286, ['motostoke', 'wedgehurst-station', 'wild-area-station', 'hulbury-station', 'hammerlocke-station', 'white-hill-station', 'wyndon-station']],
    ['galar-route-3', '3번도로', 'Route 3', 'route', 525, 3209, ['motostoke', 'galar-mine']],
    ['galar-mine', '가라르광산', 'Galar Mine', 'dungeon', 346, 3074, ['galar-route-3', 'galar-route-4']],
    ['galar-route-4', '4번도로', 'Route 4', 'route', 333, 2921, ['galar-mine', 'turffield']],
    ['turffield', '터프마을', 'Turffield', 'town', 435, 2831, ['galar-route-4', 'galar-route-5']],
    ['galar-route-5', '5번도로', 'Route 5', 'route', 698, 2831, ['turffield', 'hulbury']],
    ['hulbury', '바우마을', 'Hulbury', 'town', 1363, 2831, ['galar-route-5', 'galar-mine-no-2', 'hulbury-station']],
    ['hulbury-station', '바우마을역', 'Hulbury Station', 'dungeon', 1152, 2690, ['hulbury', 'wedgehurst-station', 'wild-area-station', 'motostoke-station', 'hammerlocke-station', 'white-hill-station', 'wyndon-station']],
    ['galar-mine-no-2', '제2광산', 'Galar Mine No. 2', 'dungeon', 1395, 3081, ['hulbury', 'motostoke-outskirts']],
    ['motostoke-outskirts', '엔진시티 변두리', 'Motostoke Outskirts', 'route', 1139, 3209, ['galar-mine-no-2', 'motostoke']],
  ] },
  { name: '와일드에리어 북부', places: [
    ['motostoke-riverbank', '엔진 리버사이드', 'Motostoke Riverbank', 'route', 1115.5, 3305.5, ['north-lake-miloch', 'bridge-field']],
    ['bridge-field', '다리아래 벌판', 'Bridge Field', 'route', 1069.5, 3046.5, ['motostoke-riverbank', 'stony-wilderness']],
    ['stony-wilderness', '스톤즈들판', 'Stony Wilderness', 'route', 1039.5, 2801.5, ['bridge-field', 'giants-mirror', 'giants-cap', 'dusty-bowl']],
    ['dusty-bowl', '모래먼지구덩이', 'Dusty Bowl', 'route', 959.5, 2701.5, ['stony-wilderness', 'giants-mirror', 'giants-cap', 'hammerlocke-hills']],
    ['giants-mirror', '거인의 거울 연못', 'Giant’s Mirror', 'route', 1051.5, 2701.5, ['stony-wilderness', 'hammerlocke-hills', 'dusty-bowl']],
    ['hammerlocke-hills', '너클 구릉', 'Hammerlocke Hills', 'route', 1019.5, 2561.5, ['giants-mirror', 'giants-cap', 'dusty-bowl', 'lake-of-outrage', 'hammerlocke']],
    ['giants-cap', '거인의 모자', 'Giant’s Cap', 'route', 833.5, 2701.5, ['hammerlocke-hills', 'stony-wilderness', 'dusty-bowl', 'lake-of-outrage']],
    ['lake-of-outrage', '역린호수', 'Lake of Outrage', 'route', 759.5, 2591.5, ['hammerlocke-hills', 'giants-cap']],
  ] },
  { name: '너클시티 일대', places: [
    ['hammerlocke', '너클시티', 'Hammerlocke', 'city', 934, 2428, ['hammerlocke-hills', 'energy-plant', 'hammerlocke-station', 'galar-route-6', 'galar-route-7']],
    ['hammerlocke-station', '너클시티역', 'Hammerlocke Station', 'dungeon', 1120, 2364, ['hammerlocke', 'wedgehurst-station', 'wild-area-station', 'motostoke-station', 'hulbury-station', 'white-hill-station', 'wyndon-station']],
    ['energy-plant', '에너지플랜트 · 타워톱', 'Energy Plant / Tower Summit', 'dungeon', 928, 2248, ['hammerlocke']],
    ['galar-route-6', '6번도로', 'Route 6', 'route', 544, 2338, ['hammerlocke', 'stow-on-side']],
    ['stow-on-side', '래터럴마을', 'Stow-on-Side', 'town', 448, 2203, ['galar-route-6', 'glimwood-tangle']],
    ['glimwood-tangle', '루미너스메이즈숲', 'Glimwood Tangle', 'dungeon', 454, 1806, ['stow-on-side', 'ballonlea']],
    ['ballonlea', '아라베스크마을', 'Ballonlea', 'town', 358, 1704, ['glimwood-tangle']],
    ['galar-route-7', '7번도로', 'Route 7', 'route', 1254, 2428, ['hammerlocke', 'galar-route-8', 'route-9-tunnel']],
    ['galar-route-8', '8번도로', 'Route 8', 'route', 1318, 2152, ['galar-route-7', 'steamdrift-way']],
    ['steamdrift-way', '모락모락 좁은 길', 'Steamdrift Way', 'route', 1376, 1909, ['galar-route-8', 'circhester']],
    ['circhester', '키르쿠스마을', 'Circhester', 'town', 1536, 1851, ['steamdrift-way', 'galar-route-9']],
    ['galar-route-9', '9번도로', 'Route 9', 'route', 1696, 1941, ['circhester', 'circhester-bay']],
    ['circhester-bay', '키르쿠스만', 'Circhester Bay', 'route', 1619, 2197, ['galar-route-9', 'outer-spikemuth']],
    ['outer-spikemuth', '스파이크마을 변두리', 'Outer Spikemuth', 'route', 1542, 2428, ['circhester-bay', 'spikemuth', 'route-9-tunnel']],
    ['spikemuth', '스파이크마을', 'Spikemuth', 'town', 1677, 2428, ['outer-spikemuth']],
    ['route-9-tunnel', '루트나인터널', 'Route 9 Tunnel', 'route', 1402, 2428, ['outer-spikemuth', 'galar-route-7']],
  ] },
  { name: '북부 가라르', places: [
    ['white-hill-station', '화이트힐역', 'White Hill Station', 'dungeon', 902, 1582, ['galar-route-10', 'wedgehurst-station', 'wild-area-station', 'motostoke-station', 'hulbury-station', 'hammerlocke-station', 'wyndon-station']],
    ['galar-route-10', '10번도로', 'Route 10', 'route', 1011, 1441, ['white-hill-station', 'wyndon']],
    ['wyndon', '슛시티', 'Wyndon', 'city', 928, 1095, ['galar-route-10', 'wyndon-stadium', 'wyndon-station', 'galar-rose-tower']],
    ['wyndon-station', '슛시티역', 'Wyndon Station', 'dungeon', 928, 980, ['wyndon', 'wedgehurst-station', 'wild-area-station', 'motostoke-station', 'hulbury-station', 'hammerlocke-station', 'white-hill-station']],
    ['wyndon-stadium', '슛스타디움', 'Wyndon Stadium', 'league', 1274, 807, ['wyndon']],
    ['galar-rose-tower', '로즈타워빌딩', 'Rose Tower', 'dungeon', 934, 231, ['wyndon']],
  ] },
]

export const galarAreaByLocationId: Readonly<Record<string, string>> = Object.fromEntries(
  areas.flatMap(area => area.places.map(([id]) => [id, area.name]))
)

export const galarLocations: readonly KantoLocation[] = areas.flatMap(area =>
  area.places.map(([id, name, nameEn, kind, x, y, links]) => {
    const trainer = galarGymTrainerByLocationId[id]
    return {
      id, name, nameEn, kind, x, y, links,
      encounters: (galarEncounterSlots[id] ?? []).map(([speciesId, level, weight]) => ({ speciesId, level, weight })),
      legends: galarLegendSlots[id],
      gym: trainer?.badge && trainer.type
        ? { leader: trainer.name, type: trainer.type, badge: trainer.badge }
        : undefined,
    }
  })
)

export const galarLocationById: Readonly<Record<string, KantoLocation>> = Object.fromEntries(
  galarLocations.map(location => [location.id, location])
)

export const galarRegion = {
  id: 'galar',
  name: '가라르지방',
  generation: 8,
  startLocationId: GALAR_START_LOCATION_ID,
  leagueLocationId: GALAR_LEAGUE_LOCATION_ID,
  locations: galarLocations,
} as const
