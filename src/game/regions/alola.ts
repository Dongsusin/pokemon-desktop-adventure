// Map pins use pixels of the Sun/Moon regional illustration. See assets/maps/alola/SOURCES.md.
import type { KantoLocation } from './kanto'
import { alolaEncounterSlots, alolaLegendSlots } from './alola-encounters'
import { alolaGymTrainerByLocationId } from './alolaCampaign'

export const ALOLA_MAP_WIDTH = 1800
export const ALOLA_MAP_HEIGHT = 1273
export const ALOLA_START_LOCATION_ID = 'alola-route-1'
export const ALOLA_LEAGUE_LOCATION_ID = 'alola-pokemon-league'

type LocationRow = readonly [
  id: string, name: string, nameEn: string, kind: KantoLocation['kind'],
  x: number, y: number, links: readonly string[],
]

const islands: ReadonlyArray<{ name: string; places: readonly LocationRow[] }> = [
  { name: '멜레멜레섬', places: [
    ['alola-route-1', '1번도로', 'Route 1', 'route', 634, 312, ['iki-town', 'alola-route-3', 'hauoli-outskirts']],
    ['hauoli-outskirts', '하우올리시티 변두리', 'Hau’oli Outskirts', 'route', 622, 366, ['alola-route-1', 'trainers-school', 'ten-carat-hill', 'melemele-sea']],
    ['trainers-school', '트레이너스쿨', 'Trainers’ School', 'dungeon', 620, 338, ['hauoli-outskirts', 'hauoli-city']],
    ['hauoli-city', '하우올리시티', 'Hau’oli City', 'city', 510, 388, ['trainers-school', 'alola-route-2', 'melemele-sea', 'heahea-city', 'aether-paradise', 'malie-city', 'seafolk-village']],
    ['iki-town', '릴리마을', 'Iki Town', 'town', 534, 296, ['alola-route-1', 'mahalo-trail']],
    ['mahalo-trail', '마할로 산길', 'Mahalo Trail', 'route', 528, 270, ['iki-town', 'ruins-of-conflict']],
    ['ruins-of-conflict', '전쟁의 유적', 'Ruins of Conflict', 'dungeon', 520, 250, ['mahalo-trail']],
    ['alola-route-2', '2번도로', 'Route 2', 'route', 422, 314, ['hauoli-city', 'alola-route-3', 'hauoli-cemetery', 'alola-berry-fields', 'verdant-cavern']],
    ['hauoli-cemetery', '하우올리 묘원', 'Hau’oli Cemetery', 'dungeon', 452, 312, ['alola-route-2']],
    ['alola-berry-fields', '나무열매 밭', 'Berry Fields', 'dungeon', 430, 286, ['alola-route-2']],
    ['verdant-cavern', '우거진 동굴', 'Verdant Cavern', 'dungeon', 492, 272, ['alola-route-2']],
    ['alola-route-3', '3번도로', 'Route 3', 'route', 608, 270, ['alola-route-1', 'alola-route-2', 'melemele-meadow']],
    ['melemele-meadow', '멜레멜레 화원', 'Melemele Meadow', 'dungeon', 568, 248, ['alola-route-3', 'seaward-cave']],
    ['seaward-cave', '바다연결동굴', 'Seaward Cave', 'dungeon', 598, 260, ['melemele-meadow', 'kalae-bay']],
    ['kalae-bay', '칼라에만', 'Kala’e Bay', 'route', 664, 248, ['seaward-cave']],
    ['melemele-sea', '멜레멜레해', 'Melemele Sea', 'route', 762, 424, ['ten-carat-hill', 'hauoli-outskirts', 'hauoli-city']],
    ['ten-carat-hill', '텐캐럿힐', 'Ten Carat Hill', 'dungeon', 692, 370, ['hauoli-outskirts', 'melemele-sea']],
  ] },
  { name: '아칼라섬', places: [
    ['heahea-city', '환대시티', 'Heahea City', 'city', 1028, 474, ['hauoli-city', 'alola-route-4', 'alola-route-6', 'hano-grand-resort', 'digletts-tunnel', 'aether-paradise', 'malie-city', 'seafolk-village']],
    ['alola-route-4', '4번도로', 'Route 4', 'route', 1044, 408, ['heahea-city', 'paniola-town']],
    ['paniola-town', '오하나마을', 'Paniola Town', 'town', 1074, 358, ['alola-route-4', 'paniola-ranch']],
    ['paniola-ranch', '오하나목장', 'Paniola Ranch', 'dungeon', 1082, 326, ['paniola-town', 'alola-route-5', 'alola-route-6']],
    ['alola-route-5', '5번도로', 'Route 5', 'route', 1060, 306, ['paniola-ranch', 'brooklet-hill', 'alola-route-8', 'lush-jungle']],
    ['brooklet-hill', '잔잔한물가언덕', 'Brooklet Hill', 'dungeon', 972, 304, ['alola-route-5']],
    ['alola-route-6', '6번도로', 'Route 6', 'route', 1096, 390, ['paniola-ranch', 'heahea-city', 'royal-avenue']],
    ['royal-avenue', '로열 애버뉴', 'Royal Avenue', 'city', 1180, 386, ['alola-route-6', 'battle-royal-dome', 'alola-route-7']],
    ['battle-royal-dome', '로열돔', 'Battle Royal Dome', 'dungeon', 1176, 342, ['royal-avenue']],
    ['alola-route-7', '7번도로', 'Route 7', 'route', 1252, 350, ['royal-avenue', 'wela-volcano-park', 'alola-route-8']],
    ['wela-volcano-park', '벨라화산공원', 'Wela Volcano Park', 'dungeon', 1170, 282, ['alola-route-7']],
    ['alola-route-8', '8번도로', 'Route 8', 'route', 1064, 276, ['alola-route-7', 'alola-route-5', 'lush-jungle']],
    ['lush-jungle', '셰이드정글', 'Lush Jungle', 'dungeon', 1108, 282, ['alola-route-5', 'alola-route-8']],
    ['hano-grand-resort', '하노하노리조트', 'Hano Grand Resort', 'dungeon', 1240, 436, ['heahea-city', 'hano-beach']],
    ['hano-beach', '하노하노비치', 'Hano Beach', 'route', 1294, 472, ['hano-grand-resort']],
    ['digletts-tunnel', '디그다터널', 'Diglett’s Tunnel', 'dungeon', 1030, 522, ['heahea-city', 'alola-route-9']],
    ['alola-route-9', '9번도로', 'Route 9', 'route', 1018, 566, ['digletts-tunnel', 'konikoni-city', 'memorial-hill']],
    ['konikoni-city', '코니코니시티', 'Konikoni City', 'city', 978, 550, ['alola-route-9']],
    ['memorial-hill', '메모리얼힐', 'Memorial Hill', 'dungeon', 1044, 578, ['alola-route-9', 'akala-outskirts']],
    ['akala-outskirts', '아칼라외곽', 'Akala Outskirts', 'route', 1078, 594, ['memorial-hill', 'ruins-of-life']],
    ['ruins-of-life', '생명의 유적', 'Ruins of Life', 'dungeon', 1084, 562, ['akala-outskirts']],
  ] },
  { name: '울라울라섬', places: [
    ['malie-city', '말리에시티', 'Malie City', 'city', 1598, 704, ['aether-paradise', 'malie-garden', 'malie-outer-cape', 'alola-route-10', 'alola-route-11', 'hauoli-city', 'heahea-city', 'seafolk-village']],
    ['malie-garden', '말리에 정원', 'Malie Garden', 'dungeon', 1622, 698, ['malie-city']],
    ['malie-outer-cape', '말리에시티 외곽해안가', 'Malie City (Outer Cape)', 'route', 1566, 642, ['malie-city']],
    ['alola-route-10', '10번도로', 'Route 10', 'route', 1518, 672, ['malie-city', 'mount-hokulani']],
    ['mount-hokulani', '호쿠라니큰산', 'Mount Hokulani', 'dungeon', 1446, 664, ['alola-route-10', 'hokulani-observatory']],
    ['hokulani-observatory', '호쿠라니천문대', 'Hokulani Observatory', 'dungeon', 1478, 608, ['mount-hokulani']],
    ['alola-route-11', '11번도로', 'Route 11', 'route', 1674, 752, ['malie-city', 'alola-route-12']],
    ['alola-route-12', '12번도로', 'Route 12', 'route', 1706, 890, ['alola-route-11', 'alola-route-13', 'blush-mountain', 'secluded-shore']],
    ['blush-mountain', '화끈산', 'Blush Mountain', 'dungeon', 1656, 808, ['alola-route-12']],
    ['secluded-shore', '울라울라 뒤쪽 해안', 'Secluded Shore', 'route', 1754, 926, ['alola-route-12']],
    ['alola-route-13', '13번도로', 'Route 13', 'route', 1580, 1030, ['alola-route-12', 'tapu-village', 'haina-desert']],
    ['haina-desert', '하이나사막', 'Haina Desert', 'dungeon', 1582, 890, ['alola-route-13', 'ruins-of-abundance']],
    ['ruins-of-abundance', '결실의 유적', 'Ruins of Abundance', 'dungeon', 1582, 812, ['haina-desert']],
    ['tapu-village', '카푸마을', 'Tapu Village', 'town', 1490, 1064, ['alola-route-13', 'alola-route-14', 'alola-route-15', 'mount-lanakila']],
    ['alola-route-14', '14번도로', 'Route 14', 'route', 1484, 1156, ['tapu-village', 'abandoned-thrifty-megamart']],
    ['abandoned-thrifty-megamart', '슈퍼・메가싸네 철거지', 'Thrifty Megamart (Abandoned Site)', 'dungeon', 1548, 1122, ['alola-route-14']],
    ['alola-route-15', '15번수로', 'Route 15', 'route', 1286, 1014, ['tapu-village', 'alola-route-16', 'aether-house']],
    ['alola-route-16', '16번도로', 'Route 16', 'route', 1272, 820, ['alola-route-15', 'ulaula-meadow']],
    ['ulaula-meadow', '울라울라 화원', 'Ula’ula Meadow', 'dungeon', 1328, 738, ['alola-route-16', 'alola-route-17', 'lake-of-the-moone']],
    ['lake-of-the-moone', '월륜의 호수', 'Lake of the Moone', 'dungeon', 1364, 770, ['ulaula-meadow']],
    ['alola-route-17', '17번도로', 'Route 17', 'route', 1322, 688, ['ulaula-meadow', 'po-town']],
    ['po-town', '포마을', 'Po Town', 'town', 1352, 612, ['alola-route-17', 'shady-house']],
    ['shady-house', '수상한 저택', 'Shady House', 'dungeon', 1326, 578, ['po-town']],
    ['mount-lanakila', '라나키라마운틴', 'Mount Lanakila', 'dungeon', 1488, 816, ['tapu-village', 'alola-pokemon-league']],
    ['alola-pokemon-league', '포켓몬리그', 'Pokémon League', 'league', 1482, 722, ['mount-lanakila']],
    ['aether-house', '에테르하우스', 'Aether House', 'dungeon', 1436, 1026, ['alola-route-15']],
  ] },
  { name: '포니섬', places: [
    ['seafolk-village', '바다민족의 마을', 'Seafolk Village', 'town', 264, 828, ['aether-paradise', 'poni-wilds', 'exeggutor-island', 'hauoli-city', 'heahea-city', 'malie-city']],
    ['poni-wilds', '포니들판', 'Poni Wilds', 'route', 190, 748, ['seafolk-village', 'ancient-poni-path']],
    ['ancient-poni-path', '포니옛길', 'Ancient Poni Path', 'route', 322, 728, ['poni-wilds', 'poni-breaker-coast', 'vast-poni-canyon-entrance', 'poni-grove']],
    ['poni-breaker-coast', '포니의 거친 해안', 'Poni Breaker Coast', 'route', 410, 710, ['ancient-poni-path', 'ruins-of-hope']],
    ['ruins-of-hope', '피안의 유적', 'Ruins of Hope', 'dungeon', 470, 700, ['poni-breaker-coast']],
    ['exeggutor-island', '나시・아일랜드', 'Exeggutor Island', 'dungeon', 86, 902, ['seafolk-village']],
    ['vast-poni-canyon-entrance', '포니대협곡 입구', 'Vast Poni Canyon (Entrance)', 'dungeon', 314, 704, ['ancient-poni-path', 'vast-poni-canyon']],
    ['vast-poni-canyon', '포니대협곡', 'Vast Poni Canyon', 'dungeon', 278, 642, ['vast-poni-canyon-entrance', 'altar-of-the-sunne']],
    ['altar-of-the-sunne', '일륜의 제단', 'Altar of the Sunne', 'dungeon', 292, 588, ['vast-poni-canyon', 'ultra-space']],
    ['poni-grove', '포니수림', 'Poni Grove', 'route', 400, 670, ['ancient-poni-path', 'poni-plains']],
    ['poni-plains', '포니광야', 'Poni Plains', 'route', 452, 618, ['poni-grove', 'poni-meadow', 'poni-coast']],
    ['poni-meadow', '포니 화원', 'Poni Meadow', 'dungeon', 396, 570, ['poni-plains', 'resolution-cave']],
    ['resolution-cave', '엔드케이브', 'Resolution Cave', 'dungeon', 366, 560, ['poni-meadow']],
    ['poni-coast', '포니해안', 'Poni Coast', 'route', 484, 582, ['poni-plains', 'poni-gauntlet']],
    ['poni-gauntlet', '포니험로', 'Poni Gauntlet', 'route', 290, 540, ['poni-coast', 'battle-tree']],
    ['battle-tree', '배틀트리', 'Battle Tree', 'dungeon', 190, 502, ['poni-gauntlet']],
    ['ultra-space', '울트라스페이스', 'Ultra Space', 'dungeon', 292, 588, ['altar-of-the-sunne']],
  ] },
  { name: '에테르파라다이스', places: [
    ['aether-paradise', '에테르파라다이스', 'Aether Paradise', 'dungeon', 790, 580, ['heahea-city', 'malie-city', 'hauoli-city', 'seafolk-village']],
  ] },
]

export const alolaIslandByLocationId: Readonly<Record<string, string>> = Object.fromEntries(
  islands.flatMap(island => island.places.map(([id]) => [id, island.name]))
)

export const alolaLocations: readonly KantoLocation[] = islands.flatMap(island =>
  island.places.map(([id, name, nameEn, kind, x, y, links]) => {
    const challenge = alolaGymTrainerByLocationId[id]
    return {
      id, name, nameEn, kind, x, y, links,
      encounters: (alolaEncounterSlots[id] ?? []).map(([speciesId, level, weight]) => ({ speciesId, level, weight })),
      legends: alolaLegendSlots[id],
      gym: challenge?.badge && challenge.type
        ? { leader: challenge.name, type: challenge.type, badge: challenge.badge }
        : undefined,
    }
  })
)

export const alolaLocationById: Readonly<Record<string, KantoLocation>> = Object.fromEntries(
  alolaLocations.map(location => [location.id, location])
)

export const alolaRegion = {
  id: 'alola',
  name: '알로라지방',
  generation: 7,
  startLocationId: ALOLA_START_LOCATION_ID,
  leagueLocationId: ALOLA_LEAGUE_LOCATION_ID,
  locations: alolaLocations,
} as const
