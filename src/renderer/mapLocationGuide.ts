import { useMemo } from 'react'
import { eligibleLegends, regionalWeather, type GameSave } from '../game/engine'
import { formLabel } from '../game/forms'
import { fieldTrainersByRegion } from '../game/regions/fieldTrainers'
import type { KantoLocation, LegendaryEncounter } from '../game/regions/kanto'
import { galarWildAreaIds } from '../game/regions/galar-encounters'
import { supportedWildForms } from '../game/regions/motionEncounters'
import { worldRegions, type RegionId, type WorldRegion } from '../game/regions/world'

export const locationKinds = { town: '마을', city: '도시', route: '도로', dungeon: '동굴·시설', league: '리그' }

export function placeKind(regionId: RegionId, place: KantoLocation) {
  if ((regionId === 'paldea' && place.kind === 'route') || (regionId === 'galar' && galarWildAreaIds.has(place.id))) return '야생 구역'
  if (place.kind === 'dungeon' && /숲$/.test(place.name)) return '숲'
  return locationKinds[place.kind]
}

const landmarks: Record<string, string> = {
  'route-1': '태초마을을 나서 상록시티로 향하는 첫 풀숲길입니다.',
  'viridian-forest': '2번도로에서 나무 그늘로 들어서면 벌레 포켓몬이 사는 숲길이 펼쳐집니다.',
  'mt-moon': '3번도로와 4번도로 사이를 잇는 산속 동굴입니다.',
  'cerulean-cave': '블루시티 곁의 깊은 동굴로, 높은 레벨의 야생 포켓몬이 서식합니다.',
  'goldenrod-radio-tower': '금빛시티 한가운데 자리한 성도지방의 방송국입니다.',
  'petalburg-woods': '호연 104번도로를 걷다 보면 빽빽한 나무 사이로 등화숲의 길이 이어집니다.',
  'mt-coronet': '신오지방 한가운데 솟은 산으로, 여러 도로에서 등산로로 들어설 수 있습니다.',
  'giant-chasm': '하나지방 북동쪽에 자리한 거대한 분화구입니다.',
  'friend-safari': '다양한 포켓몬을 한 장소에서 만날 수 있는 칼로스의 사파리입니다.',
  'brooklet-hill': '잔잔한 물길이 이어지는 아칼라섬의 시련터입니다.',
  'rolling-fields': '가라르 와일드에리어에 펼쳐진 초원으로, 날씨에 따라 만나는 포켓몬이 달라집니다.',
  'area-zero': '팔데아 대공의 안쪽으로 내려가며 포켓몬을 만나는 탐사 구역입니다.',
}

export function describePlace(game: GameSave, place: KantoLocation) {
  const region = worldRegions[game.regionId]
  if (landmarks[place.id]) return landmarks[place.id]
  if (place.id === region.leagueLocationId) {
    return region.id === 'galar' ? '챔피언컵의 라이벌과 단델이 기다리는 슛스타디움입니다.'
      : region.id === 'paldea' ? '사천왕과 치프 챔피언에게 도전하는 챔피언 테스트의 무대입니다.'
      : '지방의 시련을 마친 트레이너가 사천왕과 챔피언 결정전에 도전하는 곳입니다.'
  }
  const leader = region.gymTrainerByLocationId[place.id]
  if (leader) {
    if (leader.trialKind === 'totem') return '이곳의 시련에서는 ' + leader.name + ' 앞에 서게 됩니다.'
    if (leader.trialKind === 'kahuna') return '섬의 대표 ' + leader.name + '에게 큰 시련을 받는 곳입니다.'
    return '이곳의 체육관에서는 관장 ' + leader.name + '에게 배지를 걸고 도전할 수 있습니다.'
  }
  if (region.startLocationId === place.id) return region.name + '에서 첫걸음을 내딛는 모험의 출발지입니다.'
  const links = place.links.map(id => region.locationById[id]?.name).filter(Boolean).slice(0, 2)
  if (place.kind === 'route') return links.join(' · ') + ' 방면으로 이어지는 길입니다.'
  if (place.kind === 'city' || place.kind === 'town') return '이곳에서 여정을 정비하고 ' + links.join(' · ') + ' 방면으로 떠날 수 있습니다.'
  return links.join(' · ') + ' 방면에서 이곳으로 들어올 수 있습니다.'
}

export function placeTrainers(region: WorldRegion, place: KantoLocation) {
  const names = new Map<string, Set<string>>()
  function add(name: string, role: string) {
    const roles = names.get(name) ?? new Set<string>()
    roles.add(role)
    names.set(name, roles)
  }
  const gym = region.gymTrainerByLocationId[place.id]
  if (gym && gym.trialKind !== 'totem') add(gym.name, gym.trialKind === 'kahuna' ? '섬의 대표' : '관장')
  for (const t of region.leagueTrainers.filter(t => t.locationId === place.id)) {
    add(t.name, t.role === 'champion' ? '챔피언' : region.id === 'galar' ? '챔피언컵' : '사천왕')
  }
  if (region.finaleTrainer?.locationId === place.id) add(region.finaleTrainer.name, '최종전')
  for (const t of fieldTrainersByRegion[region.id]) {
    if (t.locationId === place.id) add(t.name, '지역 대결')
  }
  return [...names].map(([name, roles]) => roles.size === 1 && roles.has('지역 대결')
    ? name : name + '(' + [...roles].join('·') + ')')
}

export function rareCondition(game: GameSave, place: KantoLocation, entry: LegendaryEncounter) {
  if (place.afterFinale && !game.campaign.finaleWon) return '네모에게 승리 후 출현'
  if (entry.championOnly) return '리그 우승 후 출현'
  return '배지 ' + entry.minBadges + '개 필요'
}

export function levelLabel(values: ReadonlySet<number>) {
  const levels = [...values].sort((a, b) => a - b)
  if (levels.length === 1) return 'Lv. ' + levels[0]
  const first = levels[0]
  const last = levels[levels.length - 1]
  return 'Lv. ' + (last - first + 1 === levels.length ? first + '–' + last : levels.join(' · '))
}

function poolSummary(entries: KantoLocation['encounters']) {
  const grouped = new Map<string, { id: string; levels: Set<number>; weight: number }>()
  for (const entry of entries) {
    let current = grouped.get(entry.speciesId)
    if (!current) {
      current = { id: entry.speciesId, levels: new Set(), weight: 0 }
      grouped.set(entry.speciesId, current)
    }
    current.levels.add(entry.level)
    current.weight += entry.weight
  }
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  return [...grouped.values()].sort((a, b) => b.weight - a.weight)
    .map(entry => ({ ...entry, percent: Math.round(entry.weight * 1000 / total) / 10 }))
}

export function usePlaceEncounters(game: GameSave, place: KantoLocation) {
  const forecast = regionalWeather(game, place.id)
  const slots = forecast?.encounters ?? place.encounters
  const entries = useMemo(() => poolSummary(slots).map(entry => {
    const forms = new Set([...entry.levels].flatMap(level =>
      supportedWildForms(game.regionId, place.id, entry.id, level).map(choice => choice.formId)))
    const formId = [...forms][0]
    const description = forms.size === 1 ? formLabel(formId) : [...forms].map(id => formLabel(id) ?? '기본 모습').join(' · ')
    return { ...entry, formId, description }
  }), [slots, game.regionId, place.id])
  const rareEntries = eligibleLegends(place, game.starterSpeciesId, true)
  const available = place.afterFinale && !game.campaign.finaleWon ? [] :
    eligibleLegends(place, game.starterSpeciesId, game.campaign.champion, game.campaign.badges.length)
  return { entries, weather: forecast?.weather, rareEntries, available }
}
