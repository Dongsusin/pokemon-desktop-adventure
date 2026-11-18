import { species } from '../catalog'
import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'

type TeamSlot = readonly [speciesId: string, level: number, formId?: string]

function team(...slots: TeamSlot[]): readonly KantoTrainerMember[] {
  return slots.map(([speciesId, level, formId]) => formId ? { speciesId, level, formId } : { speciesId, level })
}

// Pokémon Sun's seven trials and four grand trials in first-play order.
export const alolaGymTrainers: readonly KantoTrainer[] = [
  {
    id: 'alola-gumshoos', locationId: 'verdant-cavern', name: '주인 형사구스',
    role: 'gym', trialKind: 'totem', type: 'normal', badge: '노말Z',
    totemAura: { stat: 'defense', stages: 1 },
    team: team(['gumshoos', 12]),
  },
  {
    id: 'alola-hala', locationId: 'iki-town', name: '할라',
    role: 'gym', trialKind: 'kahuna', type: 'fighting', badge: '격투Z',
    team: team(['mankey', 14], ['makuhita', 14], ['crabrawler', 15]),
  },
  {
    id: 'alola-wishiwashi', locationId: 'brooklet-hill', name: '주인 약어리',
    role: 'gym', trialKind: 'totem', type: 'water', badge: '물Z',
    totemAura: { stat: 'defense', stages: 1 },
    team: team(['wishiwashi', 20, 'wishiwashi-school']),
  },
  {
    id: 'alola-salazzle', locationId: 'wela-volcano-park', name: '주인 염뉴트',
    role: 'gym', trialKind: 'totem', type: 'fire', badge: '불꽃Z',
    totemAura: { stat: 'spDefense', stages: 1 },
    team: team(['salazzle', 22]),
  },
  {
    id: 'alola-lurantis', locationId: 'lush-jungle', name: '주인 라란티스',
    role: 'gym', trialKind: 'totem', type: 'grass', badge: '풀Z',
    totemAura: { stat: 'speed', stages: 2 },
    team: team(['lurantis', 24]),
  },
  {
    id: 'alola-olivia', locationId: 'ruins-of-life', name: '라이치',
    role: 'gym', trialKind: 'kahuna', type: 'rock', badge: '바위Z',
    team: team(['nosepass', 26], ['boldore', 26], ['lycanroc', 27, 'lycanroc-midnight']),
  },
  {
    id: 'alola-vikavolt', locationId: 'hokulani-observatory', name: '주인 투구뿌논',
    role: 'gym', trialKind: 'totem', type: 'electric', badge: '전기Z',
    totemAura: { stat: 'all', stages: 1 },
    team: team(['vikavolt', 29]),
  },
  {
    id: 'alola-mimikyu', locationId: 'abandoned-thrifty-megamart', name: '주인 따라큐',
    role: 'gym', trialKind: 'totem', type: 'ghost', badge: '고스트Z',
    totemAura: { stat: 'all', stages: 1 },
    team: team(['mimikyu', 33]),
  },
  {
    id: 'alola-nanu', locationId: 'malie-city', name: '나누',
    role: 'gym', trialKind: 'kahuna', type: 'dark', badge: '악Z',
    team: team(['sableye', 38], ['krokorok', 38], ['persian', 39]),
  },
  {
    id: 'alola-hapu', locationId: 'vast-poni-canyon-entrance', name: '하푸우',
    role: 'gym', trialKind: 'kahuna', type: 'ground', badge: '땅Z',
    team: team(['dugtrio', 47], ['gastrodon', 47, 'gastrodon-east'], ['flygon', 47], ['mudsdale', 48]),
  },
  {
    id: 'alola-kommo-o', locationId: 'vast-poni-canyon', name: '주인 짜랑고우거',
    role: 'gym', trialKind: 'totem', type: 'dragon', badge: '드래곤Z',
    totemAura: { stat: 'all', stages: 1 },
    team: team(['kommo-o', 45]),
  },
]

const leagueId = 'alola-pokemon-league'
const kukuiLead = team(['lycanroc', 57], ['ninetales', 56], ['braviary', 56], ['magnezone', 56], ['snorlax', 56])
const champion: KantoTrainer = {
  id: 'alola-kukui', name: '쿠쿠이', role: 'champion', locationId: leagueId,
  team: [...kukuiLead, ...team(['incineroar', 58])],
}

export const alolaLeagueTrainers: readonly KantoTrainer[] = [
  {
    id: 'alola-hala-elite', name: '할라', role: 'elite', type: 'fighting', locationId: leagueId,
    team: team(['hariyama', 54], ['primeape', 54], ['bewear', 54], ['poliwrath', 54], ['crabominable', 55]),
  },
  {
    id: 'alola-olivia-elite', name: '라이치', role: 'elite', type: 'rock', locationId: leagueId,
    team: team(['relicanth', 54], ['carbink', 54], ['golem', 54], ['probopass', 54], ['lycanroc', 55, 'lycanroc-midnight']),
  },
  {
    id: 'alola-acerola', name: '아세로라', role: 'elite', type: 'ghost', locationId: leagueId,
    team: team(['sableye', 54], ['drifblim', 54], ['dhelmise', 54], ['froslass', 54], ['palossand', 55]),
  },
  {
    id: 'alola-kahili', name: '카일리', role: 'elite', type: 'flying', locationId: leagueId,
    team: team(['skarmory', 54], ['crobat', 54], ['oricorio', 54], ['mandibuzz', 54], ['toucannon', 55]),
  },
  champion,
]

export function alolaChampionForStarter(starterSpeciesId: string): KantoTrainer {
  const starterType = species[starterSpeciesId]?.types[0]
  if (starterType === 'fire') return { ...champion, team: [...kukuiLead, ...team(['primarina', 58])] }
  if (starterType === 'water') return { ...champion, team: [...kukuiLead, ...team(['decidueye', 58])] }
  return champion
}

export const alolaGymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(alolaGymTrainers.map(trainer => [trainer.locationId, trainer])), null)

export const alolaTrainerById: Readonly<Record<string, KantoTrainer | undefined>> = Object.setPrototypeOf(
  Object.fromEntries([...alolaGymTrainers, ...alolaLeagueTrainers].map(trainer => [trainer.id, trainer])), null,
)
