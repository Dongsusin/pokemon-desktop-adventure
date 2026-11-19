// Black 2 Town Map cursor coordinates and field connections. See assets/maps/unova/SOURCES.md.
import type { KantoEncounter, KantoGym, KantoLocation } from './kanto'
import { unovaEncounterSlots, unovaLegendSlots } from './unova-encounters'

export const UNOVA_MAP_WIDTH = 256
export const UNOVA_MAP_HEIGHT = 168
export const UNOVA_START_LOCATION_ID = 'aspertia-city'
export const UNOVA_LEAGUE_LOCATION_ID = 'unova-league'

type LocationRow = readonly [
  id: string, name: string, nameEn: string, kind: KantoLocation['kind'],
  x: number, y: number, links: readonly string[],
]

const locationRows: readonly LocationRow[] = [
  ['aspertia-city', '부채시티', 'Aspertia City', 'city', 14, 153, ['unova-route-19']],
  ['black-city', '블랙시티', 'Black City', 'city', 190, 91, ['unova-route-14', 'unova-route-15', 'black-tower']],
  ['castelia-city', '구름시티', 'Castelia City', 'city', 132, 130, ['skyarrow-bridge', 'unova-route-4', 'virbank-city', 'castelia-sewers', 'liberty-garden', 'unity-tower']],
  ['driftveil-city', '물풍경시티', 'Driftveil City', 'city', 74, 91, ['driftveil-drawbridge', 'unova-route-6', 'pwt', 'clay-tunnel']],
  ['humilau-city', '기하시티', 'Humilau City', 'city', 235, 36, ['unova-route-22', 'marine-tube', 'unova-route-21']],
  ['icirrus-city', '설화시티', 'Icirrus City', 'city', 74, 43, ['twist-mountain', 'unova-route-8', 'dragonspiral-tower']],
  ['mistralton-city', '궐수시티', 'Mistralton City', 'city', 40, 67, ['chargestone-cave', 'unova-route-7', 'lentimas-town', 'nature-sanctuary']],
  ['nacrene-city', '칠보시티', 'Nacrene City', 'city', 203, 118, ['unova-route-3', 'pinwheel-forest']],
  ['nimbasa-city', '뇌문시티', 'Nimbasa City', 'city', 132, 91, ['join-avenue', 'unova-route-5', 'unova-route-16', 'battle-subway', 'entralink']],
  ['opelucid-city', '쌍용시티', 'Opelucid City', 'city', 132, 43, ['unova-route-9', 'unova-route-11']],
  ['striaton-city', '성신시티', 'Striaton City', 'city', 228, 118, ['unova-route-2', 'unova-route-3', 'dreamyard']],
  ['virbank-city', '모란만시티', 'Virbank City', 'city', 69, 127, ['unova-route-20', 'castelia-city', 'virbank-complex', 'pokestar-studios']],
  ['accumula-town', '넝쿨마을', 'Accumula Town', 'town', 232, 138, ['unova-route-1', 'unova-route-2']],
  ['anville-town', '가륜마을', 'Anville Town', 'town', 7, 30, ['battle-subway']],
  ['floccesy-town', '산가지마을', 'Floccesy Town', 'town', 33, 127, ['unova-route-19', 'unova-route-20', 'pledge-grove']],
  ['lacunosa-town', '보배마을', 'Lacunosa Town', 'town', 190, 43, ['unova-route-12', 'unova-route-13']],
  ['lentimas-town', '산로마을', 'Lentimas Town', 'town', 187, 67, ['mistralton-city', 'reversal-mountain']],
  ['nuvema-town', '마름꽃마을', 'Nuvema Town', 'town', 232, 158, ['unova-route-1']],
  ['undella-town', '물결마을', 'Undella Town', 'town', 224, 67, ['unova-route-13', 'unova-route-14', 'marine-tube', 'undella-bay', 'reversal-mountain']],
  ['unova-route-1', '1번도로', 'Route 1', 'route', 232, 148, ['nuvema-town', 'accumula-town', 'unova-route-17']],
  ['unova-route-2', '2번도로', 'Route 2', 'route', 231, 127, ['accumula-town', 'striaton-city']],
  ['unova-route-3', '3번도로', 'Route 3', 'route', 214, 118, ['striaton-city', 'nacrene-city', 'wellspring-cave']],
  ['unova-route-4', '4번도로', 'Route 4', 'route', 132, 117, ['castelia-city', 'join-avenue', 'desert-resort']],
  ['unova-route-5', '5번도로', 'Route 5', 'route', 118, 91, ['nimbasa-city', 'driftveil-drawbridge']],
  ['unova-route-6', '6번도로', 'Route 6', 'route', 57, 80, ['driftveil-city', 'chargestone-cave', 'mistralton-cave']],
  ['unova-route-7', '7번도로', 'Route 7', 'route', 57, 55, ['mistralton-city', 'twist-mountain', 'celestial-tower']],
  ['unova-route-8', '8번도로', 'Route 8', 'route', 87, 44, ['icirrus-city', 'tubeline-bridge', 'moor-of-icirrus']],
  ['unova-route-9', '9번도로', 'Route 9', 'route', 120, 44, ['tubeline-bridge', 'opelucid-city']],
  ['unova-route-11', '11번도로', 'Route 11', 'route', 143, 43, ['opelucid-city', 'village-bridge']],
  ['unova-route-12', '12번도로', 'Route 12', 'route', 177, 42, ['village-bridge', 'lacunosa-town']],
  ['unova-route-13', '13번도로', 'Route 13', 'route', 206, 54, ['lacunosa-town', 'undella-town', 'giant-chasm']],
  ['unova-route-14', '14번도로', 'Route 14', 'route', 207, 80, ['undella-town', 'black-city', 'abundant-shrine']],
  ['unova-route-15', '15번도로', 'Route 15', 'route', 176, 91, ['black-city', 'marvelous-bridge', 'poke-transfer-lab']],
  ['unova-route-16', '16번도로', 'Route 16', 'route', 144, 92, ['marvelous-bridge', 'nimbasa-city', 'lostlorn-forest']],
  ['unova-route-17', '17번수로', 'Route 17', 'route', 216, 159, ['unova-route-1', 'unova-route-18', 'p2-laboratory']],
  ['unova-route-18', '18번도로', 'Route 18', 'route', 204, 159, ['unova-route-17']],
  ['unova-route-19', '19번도로', 'Route 19', 'route', 12, 135, ['aspertia-city', 'floccesy-town']],
  ['unova-route-20', '20번도로', 'Route 20', 'route', 51, 129, ['floccesy-town', 'virbank-city', 'floccesy-ranch', 'cave-of-being']],
  ['unova-route-21', '21번수로', 'Route 21', 'route', 234, 48, ['humilau-city', 'seaside-cave']],
  ['unova-route-22', '22번도로', 'Route 22', 'route', 219, 36, ['giant-chasm', 'humilau-city']],
  ['unova-route-23', '23번도로', 'Route 23', 'route', 195, 30, ['giant-chasm', 'unova-victory-road']],
  ['abundant-shrine', '풍요의 사당', 'Abundant Shrine', 'dungeon', 197, 77, ['unova-route-14']],
  ['abyssal-ruins', '해저유적', 'Abyssal Ruins', 'dungeon', 242, 63, ['undella-bay']],
  ['battle-subway', '배틀서브웨이', 'Battle Subway', 'dungeon', 132, 91, ['nimbasa-city', 'anville-town']],
  ['black-tower', '흑의 마천루', 'Black Tower', 'dungeon', 190, 91, ['black-city']],
  ['castelia-sewers', '구름하수도', 'Castelia Sewers', 'dungeon', 156, 143, ['relic-passage', 'castelia-city']],
  ['cave-of-being', '마음의 공동', 'Cave of Being', 'dungeon', 41, 138, ['unova-route-20']],
  ['celestial-tower', '타워오브해븐', 'Celestial Tower', 'dungeon', 54, 50, ['unova-route-7']],
  ['chargestone-cave', '전기돌동굴', 'Chargestone Cave', 'dungeon', 42, 80, ['unova-route-6', 'mistralton-city']],
  ['clay-tunnel', '야콘로드', 'Clay Tunnel', 'dungeon', 72, 77, ['driftveil-city', 'twist-mountain', 'mistralton-cave', 'underground-ruins']],
  ['desert-resort', '리조트데저트', 'Desert Resort', 'dungeon', 124, 104, ['unova-route-4', 'relic-castle']],
  ['dragonspiral-tower', '용나선탑', 'Dragonspiral Tower', 'dungeon', 66, 31, ['icirrus-city']],
  ['dreamyard', '꿈터', 'Dreamyard', 'dungeon', 239, 118, ['striaton-city']],
  ['driftveil-drawbridge', '물풍경도개교', 'Driftveil Drawbridge', 'dungeon', 103, 89, ['unova-route-5', 'driftveil-city']],
  ['entralink', '하일링크', 'Entralink', 'dungeon', 132, 67, ['nimbasa-city', 'entree-forest']],
  ['entree-forest', '하일링크의 숲', 'Entree Forest', 'dungeon', 132, 67, ['entralink']],
  ['floccesy-ranch', '산가지목장', 'Floccesy Ranch', 'dungeon', 41, 118, ['unova-route-20']],
  ['giant-chasm', '자이언트홀', 'Giant Chasm', 'dungeon', 208, 36, ['unova-route-13', 'unova-route-22', 'unova-route-23']],
  ['guidance-chamber', '길잡이의 공간', 'Guidance Chamber', 'dungeon', 64, 71, ['mistralton-cave']],
  ['iron-room', '쇠철의 방', 'Iron Chamber', 'dungeon', 72, 77, ['underground-ruins']],
  ['join-avenue', '조인애버뉴', 'Join Avenue', 'dungeon', 132, 104, ['unova-route-4', 'nimbasa-city']],
  ['liberty-garden', '리버티가든섬', 'Liberty Garden', 'dungeon', 74, 145, ['castelia-city']],
  ['lostlorn-forest', '미혹의 숲', 'Lostlorn Forest', 'dungeon', 146, 84, ['unova-route-16']],
  ['marine-tube', '마린튜브', 'Marine Tube', 'dungeon', 251, 53, ['humilau-city', 'undella-town']],
  ['marvelous-bridge', '원더 브리지', 'Marvelous Bridge', 'dungeon', 159, 89, ['unova-route-15', 'unova-route-16']],
  ['mistralton-cave', '궐수의 동굴', 'Mistralton Cave', 'dungeon', 64, 71, ['clay-tunnel', 'unova-route-6', 'guidance-chamber']],
  ['moor-of-icirrus', '설화의 습지초원', 'Moor of Icirrus', 'dungeon', 88, 36, ['unova-route-8']],
  ['nature-sanctuary', '자연보호구역', 'Nature Preserve', 'dungeon', 40, 67, ['mistralton-city']],
  ['ns-castle', 'N의 성', 'N\'s Castle', 'dungeon', 182, 6, ['unova-victory-road']],
  ['p2-laboratory', 'P2랩', 'P2 Laboratory', 'dungeon', 214, 151, ['unova-route-17', 'plasma-frigate']],
  ['pinwheel-forest', '바람개비숲', 'Pinwheel Forest', 'dungeon', 194, 125, ['nacrene-city', 'skyarrow-bridge']],
  // The Frigate can be boarded from Seaside Cave during the campaign and from P2 Lab later.
  ['plasma-frigate', '플라스마 프리깃', 'Plasma Frigate', 'dungeon', 222, 151, ['p2-laboratory', 'seaside-cave']],
  ['pledge-grove', '맹세의 숲', 'Pledge Grove', 'dungeon', 33, 127, ['floccesy-town']],
  ['poke-transfer-lab', '시프트팩토리', 'Poké Transfer Lab', 'dungeon', 177, 84, ['unova-route-15']],
  ['pokestar-studios', '포켓우드', 'Pokéstar Studios', 'dungeon', 64, 115, ['virbank-city']],
  ['pwt', 'PWT', 'PWT', 'dungeon', 77, 103, ['driftveil-city', 'relic-passage']],
  ['relic-castle', '고대의 성', 'Relic Castle', 'dungeon', 115, 104, ['desert-resort', 'relic-passage']],
  ['relic-passage', '고대샛길', 'Relic Passage', 'dungeon', 105, 118, ['relic-castle', 'castelia-sewers', 'pwt']],
  ['reversal-mountain', '리버스마운틴', 'Reversal Mountain', 'dungeon', 206, 67, ['lentimas-town', 'undella-town', 'strange-house']],
  ['rocky-mountain-room', '바위산의 방', 'Rock Peak Chamber', 'dungeon', 72, 77, ['underground-ruins']],
  ['seaside-cave', '해변동혈', 'Seaside Cave', 'dungeon', 235, 53, ['unova-route-21', 'undella-bay', 'plasma-frigate']],
  ['skyarrow-bridge', '스카이애로 브리지', 'Skyarrow Bridge', 'dungeon', 163, 121, ['pinwheel-forest', 'castelia-city']],
  ['strange-house', '스트레인저 하우스', 'Strange House', 'dungeon', 198, 59, ['reversal-mountain']],
  ['tubeline-bridge', '실린더 브리지', 'Tubeline Bridge', 'dungeon', 104, 41, ['unova-route-8', 'unova-route-9']],
  ['twist-mountain', '태엽산', 'Twist Mountain', 'dungeon', 72, 55, ['unova-route-7', 'icirrus-city', 'clay-tunnel']],
  ['undella-bay', '물결만', 'Undella Bay', 'dungeon', 230, 61, ['seaside-cave', 'undella-town', 'abyssal-ruins']],
  ['underground-ruins', '땅밑유적', 'Underground Ruins', 'dungeon', 72, 77, ['clay-tunnel', 'rocky-mountain-room', 'iron-room']],
  ['unity-tower', '유나이티드타워', 'Unity Tower', 'dungeon', 99, 157, ['castelia-city']],
  ['unova-victory-road', '챔피언로드', 'Victory Road', 'dungeon', 184, 16, ['unova-route-23', 'unova-league', 'ns-castle']],
  ['village-bridge', '빌리지 브리지', 'Village Bridge', 'dungeon', 161, 41, ['unova-route-11', 'unova-route-12']],
  ['virbank-complex', '모란만콤비나트', 'Virbank Complex', 'dungeon', 64, 138, ['virbank-city']],
  ['wellspring-cave', '지하수맥굴', 'Wellspring Cave', 'dungeon', 215, 110, ['unova-route-3']],
  ['unova-league', '포켓몬리그', 'Pokémon League', 'league', 170, 15, ['unova-victory-road']],
]

const gyms: Readonly<Partial<Record<string, KantoGym>>> = {
  'aspertia-city': { leader: '체렌', type: 'normal', badge: '베이직배지' },
  'virbank-city': { leader: '보미카', type: 'poison', badge: '톡식배지' },
  'castelia-city': { leader: '아티', type: 'bug', badge: '비틀배지' },
  'nimbasa-city': { leader: '카밀레', type: 'electric', badge: '볼트배지' },
  'driftveil-city': { leader: '야콘', type: 'ground', badge: '퀘이크배지' },
  'mistralton-city': { leader: '풍란', type: 'flying', badge: '제트배지' },
  'opelucid-city': { leader: '사간', type: 'dragon', badge: '레전드배지' },
  'humilau-city': { leader: '시즈', type: 'water', badge: '웨이브배지' },
}

function encounters(slots: readonly (readonly [string, number, number])[]): KantoEncounter[] {
  return slots.map(([speciesId, level, weight]) => ({ speciesId, level, weight }))
}

export const unovaLocations: readonly KantoLocation[] = locationRows.map(
  ([id, name, nameEn, kind, x, y, links]) => {
    const legends = unovaLegendSlots[id]
    return {
      id, name, nameEn, kind, x, y, links,
      encounters: encounters(unovaEncounterSlots[id] ?? []),
      legends: legends && encounters(legends),
      gym: gyms[id],
    }
  },
)

export const unovaLocationById: Readonly<Record<string, KantoLocation>> = Object.fromEntries(
  unovaLocations.map((location) => [location.id, location]),
)

export const unovaRegion = {
  id: 'unova',
  name: '하나지방',
  generation: 5,
  startLocationId: UNOVA_START_LOCATION_ID,
  leagueLocationId: UNOVA_LEAGUE_LOCATION_ID,
  gymLocationIds: Object.keys(gyms),
  locations: unovaLocations,
} as const
