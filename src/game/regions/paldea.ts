// Pixel coordinates on the original Scarlet mainland map; see assets/maps/paldea/SOURCES.md.
import type { KantoLocation } from './kanto'
import { paldeaEncounterSlots, paldeaLegendSlots } from './paldea-encounters'
import { paldeaGymTrainerByLocationId } from './paldeaCampaign'

export const PALDEA_MAP_WIDTH = 2048
export const PALDEA_MAP_HEIGHT = 2048
export const PALDEA_START_LOCATION_ID = 'cabo-poco'
export const PALDEA_LEAGUE_LOCATION_ID = 'paldea-pokemon-league'

type LocationRow = readonly [
  id: string, name: string, nameEn: string, kind: KantoLocation['kind'],
  x: number, y: number, links: readonly string[],
]

const areas: ReadonlyArray<{ name: string; places: readonly LocationRow[] }> = [
  { name: '남부 팔데아', places: [
    ['cabo-poco', '티스푼마을', 'Cabo Poco', 'town', 1008, 1953, ['poco-path']],
    ['poco-path', '티스푼 오솔길', 'Poco Path', 'route', 1001, 1908, ['cabo-poco', 'inlet-grotto', 'poco-path-lighthouse', 'south-province-area-one']],
    ['inlet-grotto', '후미진 동굴', 'Inlet Grotto', 'dungeon', 1015, 1880, ['poco-path', 'poco-path-lighthouse']],
    ['poco-path-lighthouse', '티스푼 오솔길 등대', 'Poco Path Lighthouse', 'dungeon', 1056, 1877, ['poco-path', 'inlet-grotto']],
    ['los-platos', '플라토마을', 'Los Platos', 'town', 980, 1785, ['south-province-area-one', 'mesagoza']],
    ['mesagoza', '테이블시티', 'Mesagoza', 'city', 982, 1545, ['los-platos', 'naranja-academy', 'paldea-pokemon-league', 'south-province-area-two', 'south-province-area-three']],
    ['naranja-academy', '오렌지 아카데미', 'Naranja Academy', 'dungeon', 980, 1471, ['mesagoza']],
    ['paldea-pokemon-league', '포켓몬리그', 'Pokémon League', 'league', 791, 1380, ['mesagoza']],
    ['cortondo', '세르클마을', 'Cortondo', 'town', 584, 1584, ['south-province-area-two']],
    ['south-province-area-one', '남부 에리어 1', 'South Province (Area One)', 'route', 969, 1720, ['poco-path', 'los-platos', 'south-province-area-four', 'south-province-area-five', 'south-paldean-sea']],
    ['south-province-area-two', '남부 에리어 2', 'South Province (Area Two)', 'route', 698, 1539, ['mesagoza', 'cortondo', 'west-province-area-one', 'south-province-area-four']],
    ['south-province-area-three', '남부 에리어 3', 'South Province (Area Three)', 'route', 1271, 1510, ['mesagoza', 'artazon', 'south-province-area-five']],
    ['south-province-area-four', '남부 에리어 4', 'South Province (Area Four)', 'route', 721, 1791, ['south-province-area-one', 'south-province-area-two', 'south-province-area-six', 'south-paldean-sea', 'west-province-area-one']],
    ['south-province-area-five', '남부 에리어 5', 'South Province (Area Five)', 'route', 1320, 1713, ['south-province-area-one', 'south-province-area-three', 'grasswither-shrine', 'south-paldean-sea', 'east-province-area-one']],
    ['south-province-area-six', '남부 에리어 6', 'South Province (Area Six)', 'route', 428, 1839, ['south-province-area-four', 'alfornada', 'alfornada-cavern', 'south-paldean-sea', 'west-paldean-sea']],
    ['alfornada-cavern', '베이크 공동', 'Alfornada Cavern', 'dungeon', 351, 1757, ['south-province-area-six', 'west-province-area-one', 'alfornada']],
    ['alfornada', '베이크마을', 'Alfornada', 'town', 373, 1803, ['south-province-area-six', 'alfornada-cavern']],
    ['grasswither-shrine', '후목의 사당', 'Grasswither Shrine', 'dungeon', 1272, 1880, ['south-province-area-five']],
    ['south-paldean-sea', '남팔데아해', 'South Paldean Sea', 'route', 1147, 1982, ['south-province-area-one', 'south-province-area-four', 'south-province-area-five', 'south-province-area-six', 'east-paldean-sea', 'west-paldean-sea']],
  ] },
  { name: '서부 팔데아', places: [
    ['west-province-area-one', '서부 에리어 1', 'West Province (Area One)', 'route', 404, 1354, ['south-province-area-two', 'south-province-area-four', 'alfornada-cavern', 'icerend-shrine', 'segin-squad', 'asado-desert', 'west-paldean-sea']],
    ['west-province-area-two', '서부 에리어 2', 'West Province (Area Two)', 'route', 376, 920, ['asado-desert', 'porto-marinada', 'west-province-area-three', 'casseroya-lake', 'west-paldean-sea']],
    ['west-province-area-three', '서부 에리어 3', 'West Province (Area Three)', 'route', 798, 875, ['cascarrafa', 'west-province-area-two', 'medali', 'casseroya-lake', 'dalizapa-passage', 'zero-gate']],
    ['cascarrafa', '카라프시티', 'Cascarrafa', 'city', 625, 1110, ['segin-squad', 'asado-desert', 'west-province-area-three']],
    ['asado-desert', '로스트 사막', 'Asado Desert', 'route', 382, 1088, ['west-province-area-one', 'cascarrafa', 'porto-marinada', 'west-province-area-two', 'west-paldean-sea']],
    ['porto-marinada', '마리네이드마을', 'Porto Marinada', 'town', 198, 1005, ['asado-desert', 'west-province-area-two']],
    ['medali', '참푸르마을', 'Medali', 'town', 814, 929, ['west-province-area-three', 'zero-gate']],
    ['segin-squad', '악 군단 아지트', 'Dark Crew’s Base', 'dungeon', 620, 1214, ['west-province-area-one', 'cascarrafa']],
    ['icerend-shrine', '동파의 사당', 'Icerend Shrine', 'dungeon', 159, 1322, ['west-province-area-one']],
    ['west-paldean-sea', '서팔데아해', 'West Paldean Sea', 'route', 87, 1280, ['south-province-area-six', 'west-province-area-one', 'asado-desert', 'west-province-area-two', 'casseroya-lake', 'south-paldean-sea', 'north-paldean-sea']],
  ] },
  { name: '동부 팔데아', places: [
    ['east-province-area-one', '동부 에리어 1', 'East Province (Area One)', 'route', 1526, 1394, ['south-province-area-five', 'artazon', 'east-province-area-two', 'schedar-squad', 'east-paldean-sea']],
    ['east-province-area-two', '동부 에리어 2', 'East Province (Area Two)', 'route', 1584, 1243, ['east-province-area-one', 'levincia', 'east-paldean-sea']],
    ['east-province-area-three', '동부 에리어 3', 'East Province (Area Three)', 'route', 1562, 1013, ['levincia', 'zapapico', 'tagtree-thicket', 'east-paldean-sea', 'north-province-area-two', 'dalizapa-passage']],
    ['artazon', '보울마을', 'Artazon', 'town', 1527, 1551, ['south-province-area-three', 'east-province-area-one']],
    ['levincia', '누룩스시티', 'Levincia', 'city', 1666, 1211, ['east-province-area-two', 'east-province-area-three', 'east-paldean-sea']],
    ['zapapico', '피케마을', 'Zapapico', 'town', 1287, 1101, ['east-province-area-three', 'dalizapa-passage']],
    ['tagtree-thicket', '표식의 나무숲', 'Tagtree Thicket', 'route', 1368, 867, ['east-province-area-three', 'navi-squad']],
    ['schedar-squad', '불꽃 군단 아지트', 'Fire Crew’s Base', 'dungeon', 1443, 1459, ['east-province-area-one']],
    ['navi-squad', '독 군단 아지트', 'Poison Crew’s Base', 'dungeon', 1248, 944, ['tagtree-thicket']],
    ['east-paldean-sea', '동팔데아해', 'East Paldean Sea', 'route', 1966, 1308, ['east-province-area-one', 'east-province-area-two', 'levincia', 'east-province-area-three', 'north-province-area-two', 'south-paldean-sea', 'north-paldean-sea']],
  ] },
  { name: '북부 팔데아', places: [
    ['north-province-area-one', '북부 에리어 1', 'North Province (Area One)', 'route', 1470, 553, ['glaseado-mountain', 'north-province-area-two', 'north-paldean-sea']],
    ['north-province-area-two', '북부 에리어 2', 'North Province (Area Two)', 'route', 1645, 853, ['east-province-area-three', 'north-province-area-one', 'firescourge-shrine', 'caph-squad', 'east-paldean-sea']],
    ['north-province-area-three', '북부 에리어 3', 'North Province (Area Three)', 'route', 906, 373, ['glaseado-mountain', 'ruchbah-squad', 'north-paldean-sea', 'casseroya-lake']],
    ['dalizapa-passage', '푸르피케 산길', 'Dalizapa Passage', 'route', 1073, 907, ['east-province-area-three', 'zapapico', 'west-province-area-three', 'glaseado-mountain']],
    ['glaseado-mountain', '나페산', 'Glaseado Mountain', 'route', 1096, 616, ['dalizapa-passage', 'glaseado-gym', 'montenevera', 'casseroya-lake', 'north-province-area-one', 'north-province-area-three']],
    ['glaseado-gym', '나페산체육관', 'Glaseado Gym', 'dungeon', 1161, 716, ['glaseado-mountain']],
    ['montenevera', '프리지마을', 'Montenevera', 'town', 1138, 598, ['glaseado-mountain']],
    ['casseroya-lake', '오야 호수', 'Casseroya Lake', 'route', 490, 598, ['west-province-area-two', 'west-province-area-three', 'glaseado-mountain', 'north-province-area-three', 'socarrat-trail', 'north-paldean-sea', 'west-paldean-sea']],
    ['socarrat-trail', '누룽지 숲길', 'Socarrat Trail', 'route', 426, 426, ['casseroya-lake', 'groundblight-shrine', 'north-paldean-sea']],
    ['ruchbah-squad', '페어리 군단 아지트', 'Fairy Crew’s Base', 'dungeon', 918, 275, ['north-province-area-three']],
    ['caph-squad', '격투 군단 아지트', 'Fighting Crew’s Base', 'dungeon', 1842, 766, ['north-province-area-two']],
    ['groundblight-shrine', '진토의 사당', 'Groundblight Shrine', 'dungeon', 469, 410, ['socarrat-trail']],
    ['firescourge-shrine', '화마의 사당', 'Firescourge Shrine', 'dungeon', 1677, 801, ['north-province-area-two']],
    ['north-paldean-sea', '북팔데아해', 'North Paldean Sea', 'route', 793, 232, ['north-province-area-one', 'north-province-area-three', 'casseroya-lake', 'socarrat-trail', 'east-paldean-sea', 'west-paldean-sea']],
  ] },
  { name: '팔데아의 대공', places: [
    ['zero-gate', '제로게이트', 'Zero Gate', 'dungeon', 881, 1033, ['west-province-area-three', 'medali', 'area-zero']],
    ['area-zero', '에리어 제로', 'Area Zero', 'dungeon', 988, 1240, ['zero-gate', 'area-zero-cavern']],
    ['area-zero-cavern', '에리어 제로 동굴', 'Area Zero (Cavern)', 'dungeon', 988, 1240, ['area-zero', 'zero-lab']],
    ['zero-lab', '제로랩', 'Zero Lab', 'dungeon', 988, 1240, ['area-zero-cavern']],
  ] },
]

export const paldeaAreaByLocationId: Readonly<Record<string, string>> = Object.fromEntries(
  areas.flatMap(area => area.places.map(([id]) => [id, area.name]))
)

export const paldeaLocations: readonly KantoLocation[] = areas.flatMap(area =>
  area.places.map(([id, name, nameEn, kind, x, y, links]) => {
    const trainer = paldeaGymTrainerByLocationId[id]
    const afterFinale = id === 'area-zero' || id === 'area-zero-cavern' || id === 'zero-lab'
    return {
      id, name, nameEn, kind, x, y, links,
      encounters: (paldeaEncounterSlots[id] ?? []).map(([speciesId, level, weight]) => ({ speciesId, level, weight })),
      legends: paldeaLegendSlots[id],
      ...(afterFinale && { afterFinale }),
      gym: trainer?.badge && trainer.type
        ? { leader: trainer.name, type: trainer.type, badge: trainer.badge }
        : undefined,
    }
  })
)

export const paldeaLocationById: Readonly<Record<string, KantoLocation>> = Object.fromEntries(
  paldeaLocations.map(location => [location.id, location])
)

export const paldeaRegion = {
  id: 'paldea',
  name: '팔데아지방',
  generation: 9,
  startLocationId: PALDEA_START_LOCATION_ID,
  leagueLocationId: PALDEA_LEAGUE_LOCATION_ID,
  locations: paldeaLocations,
} as const
