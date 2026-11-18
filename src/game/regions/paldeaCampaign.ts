import { species } from '../catalog'
import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'

type Slot = readonly [speciesId: string, level: number, formId?: string, abilityId?: KantoTrainerMember['abilityId']]

// The first-challenge parties Terastallize their final Pokémon.
function team(teraType: string, ...slots: Slot[]): readonly KantoTrainerMember[] {
  return slots.map(([speciesId, level, formId, abilityId], index) => ({
    speciesId, level, ...(formId && { formId }), ...(abilityId && { abilityId }), ...(index === slots.length - 1 && { teraType }),
  }))
}

export const paldeaGymTrainers: readonly KantoTrainer[] = [
  {
    id: 'paldea-katy', locationId: 'cortondo', name: '단풍', role: 'gym', type: 'bug', badge: '체육관 배지: 벌레',
    team: team('bug', ['nymble', 14], ['tarountula', 14], ['teddiursa', 15]),
  },
  {
    id: 'paldea-brassius', locationId: 'artazon', name: '콜사', role: 'gym', type: 'grass', badge: '체육관 배지: 풀',
    team: team('grass', ['petilil', 16], ['smoliv', 16], ['sudowoodo', 17]),
  },
  {
    id: 'paldea-iono', locationId: 'levincia', name: '모야모', role: 'gym', type: 'electric', badge: '체육관 배지: 전기',
    team: team('electric', ['wattrel', 23], ['bellibolt', 23], ['luxio', 23], ['mismagius', 24, undefined, 'levitate']),
  },
  {
    id: 'paldea-kofu', locationId: 'cascarrafa', name: '곤포', role: 'gym', type: 'water', badge: '체육관 배지: 물',
    team: team('water', ['veluza', 29], ['wugtrio', 29], ['crabominable', 30]),
  },
  {
    id: 'paldea-larry', locationId: 'medali', name: '청목', role: 'gym', type: 'normal', badge: '체육관 배지: 노말',
    team: team('normal', ['komala', 35], ['dudunsparce', 35], ['staraptor', 36]),
  },
  {
    id: 'paldea-ryme', locationId: 'montenevera', name: '라임', role: 'gym', type: 'ghost', badge: '체육관 배지: 고스트',
    team: team('ghost', ['banette', 41], ['mimikyu', 41], ['houndstone', 41], ['toxtricity', 42, 'toxtricity-low-key']),
  },
  {
    id: 'paldea-tulip', locationId: 'alfornada', name: '리파', role: 'gym', type: 'psychic', badge: '체육관 배지: 에스퍼',
    team: team('psychic', ['farigiraf', 44], ['gardevoir', 44], ['espathra', 44], ['florges', 45]),
  },
  {
    id: 'paldea-grusha', locationId: 'glaseado-gym', name: '그루샤', role: 'gym', type: 'ice', badge: '체육관 배지: 얼음',
    team: team('ice', ['frosmoth', 47], ['beartic', 47], ['cetitan', 47], ['altaria', 48]),
  },
]

const league = 'paldea-pokemon-league'
export const paldeaLeagueTrainers: readonly KantoTrainer[] = [
  {
    id: 'paldea-rika', locationId: league, name: '칠리', role: 'elite', type: 'ground',
    team: team('ground',
      ['whiscash', 57], ['camerupt', 57], ['donphan', 57],
      ['dugtrio', 57], ['clodsire', 58, undefined, 'water-absorb']),
  },
  {
    id: 'paldea-poppy', locationId: league, name: '뽀삐', role: 'elite', type: 'steel',
    team: team('steel',
      ['copperajah', 58], ['magnezone', 58], ['bronzong', 58],
      ['corviknight', 58], ['tinkaton', 59]),
  },
  {
    id: 'paldea-larry-elite', locationId: league, name: '청목', role: 'elite', type: 'flying',
    team: team('flying',
      ['tropius', 59], ['oricorio', 59, 'oricorio-pom-pom'], ['altaria', 59],
      ['staraptor', 59], ['flamigo', 60]),
  },
  {
    id: 'paldea-hassel', locationId: league, name: '팔자크', role: 'elite', type: 'dragon',
    team: team('dragon',
      ['noivern', 60], ['haxorus', 60], ['dragalge', 60],
      ['flapple', 60], ['baxcalibur', 61]),
  },
  {
    id: 'paldea-geeta', locationId: league, name: '테사', role: 'champion', cupRound: '치프 챔피언전',
    team: team('rock',
      ['espathra', 61], ['gogoat', 61], ['veluza', 61],
      ['avalugg', 61], ['kingambit', 61], ['glimmora', 62]),
  },
]

const nemonaParty: Slot[] = [
  ['lycanroc', 65], ['goodra', 65], ['dudunsparce', 65, 'dudunsparce-three-segment'],
  ['orthworm', 65], ['pawmot', 65],
]

export const paldeaNemona: KantoTrainer = {
  id: 'paldea-nemona', locationId: 'mesagoza', name: '네모', role: 'champion', cupRound: '챔피언 로드 최종전',
  team: team('water', ...nemonaParty, ['quaquaval', 66]),
}

export function paldeaTrainerForStarter(trainer: KantoTrainer, starterSpeciesId: string): KantoTrainer {
  if (trainer.id !== paldeaNemona.id) return trainer
  const type = species[starterSpeciesId]?.types?.[0]
  if (type === 'fire') return { ...paldeaNemona, team: team('grass', ...nemonaParty, ['meowscarada', 66]) }
  if (type === 'water') return { ...paldeaNemona, team: team('fire', ...nemonaParty, ['skeledirge', 66]) }
  return paldeaNemona
}

export const paldeaGymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(paldeaGymTrainers.map(trainer => [trainer.locationId, trainer])), null)

export const paldeaTrainerById: Readonly<Record<string, KantoTrainer | undefined>> = Object.setPrototypeOf(
  Object.fromEntries([...paldeaGymTrainers, ...paldeaLeagueTrainers, paldeaNemona].map(trainer => [trainer.id, trainer])), null,
)
