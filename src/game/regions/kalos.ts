// Pokémon X Town Map. Original bitmap and coordinate references: assets/maps/kalos/SOURCES.md.
import type { KantoEncounter, KantoGym, KantoLocation } from './kanto'
import { kalosEncounterSlots, kalosLegendSlots } from './kalos-encounters'

export const KALOS_MAP_WIDTH = 320
export const KALOS_MAP_HEIGHT = 210
export const KALOS_START_LOCATION_ID = 'vaniville-town'
export const KALOS_LEAGUE_LOCATION_ID = 'kalos-pokemon-league'

type LocationRow = readonly [
  id: string, name: string, nameEn: string, kind: KantoLocation['kind'],
  x: number, y: number, links: readonly string[],
]

const locationRows: readonly LocationRow[] = [
  ['vaniville-town', '조아마을', 'Vaniville Town', 'town', 212, 180, ['kalos-route-1']],
  ['aquacorde-town', '수미마을', 'Aquacorde Town', 'town', 212, 156, ['kalos-route-1', 'kalos-route-2']],
  ['santalune-city', '백단시티', 'Santalune City', 'city', 196, 118, ['kalos-route-3', 'kalos-route-4', 'kalos-route-22']],
  ['lumiose-city', '미르시티', 'Lumiose City', 'city', 166, 78, ['kalos-route-4', 'kalos-route-5', 'kalos-route-13', 'kalos-route-14', 'kalos-route-16', 'kiloude-city', 'lysandre-labs', 'prism-tower']],
  ['camphrier-town', '고목내마을', 'Camphrier Town', 'town', 130, 120, ['kalos-route-5', 'kalos-route-7', 'shabboneau-castle']],
  ['ambrette-town', '가라마을', 'Ambrette Town', 'town', 72, 158, ['kalos-route-8', 'kalos-route-9']],
  ['cyllage-city', '삼채시티', 'Cyllage City', 'city', 56, 120, ['kalos-route-8', 'kalos-route-10', 'connecting-cave']],
  ['geosenge-town', '옥유마을', 'Geosenge Town', 'town', 28, 100, ['kalos-route-10', 'kalos-route-11', 'team-flare-secret-hq']],
  ['shalour-city', '사라시티', 'Shalour City', 'city', 48, 76, ['reflection-cave', 'kalos-route-12', 'tower-of-mastery']],
  ['coumarine-city', '비익시티', 'Coumarine City', 'city', 110, 62, ['kalos-route-12', 'kalos-route-13']],
  ['laverre-city', '후늬시티', 'Laverre City', 'city', 164, 24, ['kalos-route-14', 'kalos-route-15', 'poke-ball-factory']],
  ['dendemille-town', '버들비마을', 'Dendemille Town', 'town', 218, 62, ['kalos-route-15', 'kalos-route-17', 'frost-cavern']],
  ['anistar-city', '향전시티', 'Anistar City', 'city', 280, 80, ['kalos-route-17', 'kalos-route-18']],
  ['couriway-town', '배롱마을', 'Couriway Town', 'town', 298, 96, ['kalos-route-18', 'kalos-route-19']],
  ['snowbelle-city', '이설시티', 'Snowbelle City', 'city', 270, 116, ['kalos-route-19', 'kalos-route-20', 'kalos-route-21']],
  ['kiloude-city', '기남시티', 'Kiloude City', 'city', 240, 194, ['lumiose-city', 'friend-safari', 'battle-maison']],
  ['kalos-route-1', '1번도로', 'Route 1', 'route', 212, 168, ['vaniville-town', 'aquacorde-town']],
  ['kalos-route-2', '2번도로', 'Route 2', 'route', 212, 145, ['aquacorde-town', 'santalune-forest']],
  ['kalos-route-3', '3번도로', 'Route 3', 'route', 205, 128, ['santalune-forest', 'santalune-city']],
  ['kalos-route-4', '4번도로', 'Route 4', 'route', 183, 102, ['santalune-city', 'lumiose-city']],
  ['kalos-route-5', '5번도로', 'Route 5', 'route', 145, 103, ['lumiose-city', 'camphrier-town']],
  ['kalos-route-6', '6번도로', 'Route 6', 'route', 112, 106, ['kalos-route-7', 'parfum-palace']],
  ['kalos-route-7', '7번도로', 'Route 7', 'route', 100, 121, ['camphrier-town', 'connecting-cave', 'kalos-route-6', 'battle-chateau']],
  ['kalos-route-8', '8번도로', 'Route 8', 'route', 63, 140, ['connecting-cave', 'ambrette-town', 'cyllage-city']],
  ['kalos-route-9', '9번도로', 'Route 9', 'route', 94, 159, ['ambrette-town', 'glittering-cave']],
  ['kalos-route-10', '10번도로', 'Route 10', 'route', 42, 111, ['cyllage-city', 'geosenge-town']],
  ['kalos-route-11', '11번도로', 'Route 11', 'route', 34, 91, ['geosenge-town', 'reflection-cave']],
  ['kalos-route-12', '12번도로', 'Route 12', 'route', 78, 69, ['shalour-city', 'coumarine-city', 'azure-bay']],
  ['kalos-route-13', '13번도로', 'Route 13', 'route', 133, 69, ['coumarine-city', 'lumiose-city', 'kalos-power-plant']],
  ['kalos-route-14', '14번도로', 'Route 14', 'route', 165, 47, ['lumiose-city', 'laverre-city']],
  ['kalos-route-15', '15번도로', 'Route 15', 'route', 192, 43, ['laverre-city', 'dendemille-town', 'kalos-route-16', 'lost-hotel']],
  ['kalos-route-16', '16번도로', 'Route 16', 'route', 196, 70, ['kalos-route-15', 'lumiose-city', 'lost-hotel']],
  ['kalos-route-17', '17번도로', 'Route 17', 'route', 250, 72, ['dendemille-town', 'anistar-city']],
  ['kalos-route-18', '18번도로', 'Route 18', 'route', 290, 88, ['anistar-city', 'couriway-town', 'terminus-cave']],
  ['kalos-route-19', '19번도로', 'Route 19', 'route', 284, 107, ['couriway-town', 'snowbelle-city']],
  ['kalos-route-20', '20번도로', 'Route 20', 'route', 264, 139, ['snowbelle-city', 'pokemon-village']],
  ['kalos-route-21', '21번도로', 'Route 21', 'route', 253, 117, ['snowbelle-city', 'kalos-victory-road']],
  ['kalos-route-22', '22번도로', 'Route 22', 'route', 216, 117, ['santalune-city', 'kalos-victory-road', 'chamber-of-emptiness']],
  ['santalune-forest', '백단숲', 'Santalune Forest', 'dungeon', 211, 134, ['kalos-route-2', 'kalos-route-3']],
  ['parfum-palace', '파르팽 궁전', 'Parfum Palace', 'dungeon', 94, 93, ['kalos-route-6']],
  ['connecting-cave', '땅이음의 동굴', 'Connecting Cave', 'dungeon', 70, 120, ['kalos-route-7', 'kalos-route-8', 'cyllage-city']],
  ['glittering-cave', '반짝임의 동굴', 'Glittering Cave', 'dungeon', 115, 158, ['kalos-route-9']],
  ['reflection-cave', '비춤의 동굴', 'Reflection Cave', 'dungeon', 39, 83, ['kalos-route-11', 'shalour-city']],
  ['azure-bay', '아쥐르만', 'Azure Bay', 'dungeon', 95, 50, ['kalos-route-12', 'sea-spirits-den']],
  ['sea-spirits-den', '해신의 굴', 'Sea Spirit’s Den', 'dungeon', 80, 38, ['azure-bay']],
  ['kalos-power-plant', '칼로스발전소', 'Kalos Power Plant', 'dungeon', 122, 84, ['kalos-route-13']],
  ['poke-ball-factory', '볼 공장', 'Poké Ball Factory', 'dungeon', 165, 12, ['laverre-city']],
  ['lost-hotel', '황폐해진 호텔', 'Lost Hotel', 'dungeon', 190, 54, ['kalos-route-15', 'kalos-route-16']],
  ['frost-cavern', '프로스트케이브', 'Frost Cavern', 'dungeon', 231, 48, ['dendemille-town']],
  ['terminus-cave', '끝의 동굴', 'Terminus Cave', 'dungeon', 307, 78, ['kalos-route-18']],
  ['pokemon-village', '포켓몬마을', 'Pokémon Village', 'dungeon', 258, 158, ['kalos-route-20', 'unknown-dungeon']],
  ['chamber-of-emptiness', '공허의 방', 'Chamber of Emptiness', 'dungeon', 221, 125, ['kalos-route-22']],
  ['kalos-victory-road', '챔피언로드', 'Victory Road', 'dungeon', 234, 115, ['kalos-route-21', 'kalos-pokemon-league', 'kalos-route-22']],
  ['kalos-pokemon-league', '포켓몬리그', 'Pokémon League', 'league', 234, 92, ['kalos-victory-road']],
  ['team-flare-secret-hq', '플레어단 비밀기지', 'Team Flare Secret HQ', 'dungeon', 28, 100, ['geosenge-town']],
  ['unknown-dungeon', '이름없는 동굴', 'Unknown Dungeon', 'dungeon', 258, 158, ['pokemon-village']],
  ['friend-safari', '프렌드사파리', 'Friend Safari', 'dungeon', 240, 194, ['kiloude-city']],
  ['tower-of-mastery', '마스터타워', 'Tower of Mastery', 'dungeon', 48, 76, ['shalour-city']],
  ['battle-maison', '배틀하우스', 'Battle Maison', 'dungeon', 240, 194, ['kiloude-city']],
  ['battle-chateau', '배틀샤토', 'Battle Chateau', 'dungeon', 100, 121, ['kalos-route-7']],
  ['lysandre-labs', '플라드리 래버러토리', 'Lysandre Labs', 'dungeon', 166, 78, ['lumiose-city']],
  ['shabboneau-castle', '침울한 성', 'Shabboneau Castle', 'dungeon', 130, 120, ['camphrier-town']],
  ['prism-tower', '프리즘타워', 'Prism Tower', 'dungeon', 166, 78, ['lumiose-city']],
]

const gyms: Readonly<Partial<Record<string, KantoGym>>> = {
  'santalune-city': { leader: '비올라', type: 'bug', badge: '버그배지' },
  'cyllage-city': { leader: '자크로', type: 'rock', badge: '월배지' },
  'shalour-city': { leader: '코르니', type: 'fighting', badge: '파이트배지' },
  'coumarine-city': { leader: '후쿠지', type: 'grass', badge: '플랜트배지' },
  'lumiose-city': { leader: '시트론', type: 'electric', badge: '볼티지배지' },
  'laverre-city': { leader: '마슈', type: 'fairy', badge: '페어리배지' },
  'anistar-city': { leader: '고지카', type: 'psychic', badge: '사이킥배지' },
  'snowbelle-city': { leader: '우르프', type: 'ice', badge: '아이스버그배지' },
}

function encounters(slots: readonly (readonly [string, number, number])[]): KantoEncounter[] {
  return slots.map(([speciesId, level, weight]) => ({ speciesId, level, weight }))
}

export const kalosLocations: readonly KantoLocation[] = locationRows.map(
  ([id, name, nameEn, kind, x, y, links]) => {
    return {
      id, name, nameEn, kind, x, y, links,
      encounters: encounters(kalosEncounterSlots[id] ?? []),
      legends: kalosLegendSlots[id],
      gym: gyms[id],
    }
  },
)

export const kalosLocationById: Readonly<Record<string, KantoLocation>> = Object.fromEntries(
  kalosLocations.map((location) => [location.id, location]),
)

export const kalosRegion = {
  id: 'kalos',
  name: '칼로스지방',
  generation: 6,
  startLocationId: KALOS_START_LOCATION_ID,
  leagueLocationId: KALOS_LEAGUE_LOCATION_ID,
  gymLocationIds: Object.keys(gyms),
  locations: kalosLocations,
} as const
