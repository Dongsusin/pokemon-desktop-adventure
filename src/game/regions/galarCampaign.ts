import { species } from '../catalog'
import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'

type Slot = readonly [speciesId: string, level: number, options?: Pick<KantoTrainerMember, 'formId' | 'dynamax'>]

function team(...slots: Slot[]): readonly KantoTrainerMember[] {
  return slots.map(([speciesId, level, options]) => ({ speciesId, level, ...options }))
}

const dynamax = { dynamax: 'dynamax' } as const
const gigantamax = { dynamax: 'gigantamax' } as const

// First Gym Challenge in Pokémon Sword. Piers's stadium has no Power Spot.
export const galarGymTrainers: readonly KantoTrainer[] = [
  {
    id: 'galar-milo', locationId: 'turffield', name: '아킬', role: 'gym', type: 'grass', badge: '풀배지',
    team: team(['gossifleur', 19], ['eldegoss', 20, dynamax]),
  },
  {
    id: 'galar-nessa', locationId: 'hulbury', name: '야청', role: 'gym', type: 'water', badge: '물배지',
    team: team(['goldeen', 22], ['arrokuda', 23], ['drednaw', 24, dynamax]),
  },
  {
    id: 'galar-kabu', locationId: 'motostoke', name: '순무', role: 'gym', type: 'fire', badge: '불꽃배지',
    team: team(['ninetales', 25], ['arcanine', 25], ['centiskorch', 27, gigantamax]),
  },
  {
    id: 'galar-bea', locationId: 'stow-on-side', name: '채두', role: 'gym', type: 'fighting', badge: '격투배지',
    team: team(['hitmontop', 34], ['pangoro', 34], ['sirfetchd', 35], ['machamp', 36, gigantamax]),
  },
  {
    id: 'galar-opal', locationId: 'ballonlea', name: '포플러', role: 'gym', type: 'fairy', badge: '페어리배지',
    team: team(['weezing', 36, { formId: 'weezing-galar' }], ['mawile', 36], ['togekiss', 37],
      ['alcremie', 38, { ...gigantamax, formId: 'alcremie-ruby-cream' }]),
  },
  {
    id: 'galar-gordie', locationId: 'circhester', name: '마쿠와', role: 'gym', type: 'rock', badge: '바위배지',
    team: team(['barbaracle', 40], ['shuckle', 40], ['stonjourner', 41], ['coalossal', 42, gigantamax]),
  },
  {
    id: 'galar-piers', locationId: 'spikemuth', name: '두송', role: 'gym', type: 'dark', badge: '악배지',
    team: team(['scrafty', 44], ['malamar', 45], ['skuntank', 45], ['obstagoon', 46]),
  },
  {
    id: 'galar-raihan', locationId: 'hammerlocke', name: '금랑', role: 'gym', type: 'dragon', badge: '드래곤배지',
    team: team(['gigalith', 46], ['flygon', 47], ['sandaconda', 46], ['duraludon', 48, gigantamax]),
  },
]

const stadium = 'wyndon-stadium'
const hopLead = team(['dubwool', 48], ['corviknight', 48], ['pincurchin', 47], ['snorlax', 47])
const leonLead = team(['aegislash', 62], ['dragapult', 62], ['haxorus', 63])

const hop: KantoTrainer = {
  id: 'galar-hop', locationId: stadium, name: '호브', role: 'elite', cupRound: '세미파이널 결승',
  team: [...hopLead, ...team(['inteleon', 49, dynamax])],
}

type StarterType = 'grass' | 'fire' | 'water'
const leonVariants: Record<StarterType, readonly Slot[]> = {
  grass: [['seismitoad', 64], ['cinderace', 64]],
  fire: [['mr-rime', 64], ['inteleon', 64]],
  water: [['rhyperior', 64], ['rillaboom', 64]],
}

function leonTeam(type: StarterType) {
  return [...leonLead, ...team(...leonVariants[type], ['charizard', 65, gigantamax])]
}

const leon: KantoTrainer = {
  id: 'galar-leon', locationId: stadium, name: '단델', role: 'champion', cupRound: '챔피언매치',
  team: leonTeam('grass'),
}

export const galarLeagueTrainers: readonly KantoTrainer[] = [
  {
    id: 'galar-marnie', locationId: stadium, name: '마리', role: 'elite', type: 'dark', cupRound: '세미파이널 1회전',
    team: team(['liepard', 47], ['toxicroak', 47], ['scrafty', 47], ['morpeko', 48], ['grimmsnarl', 49, gigantamax]),
  },
  hop,
  {
    id: 'galar-bede', locationId: stadium, name: '비트', role: 'elite', type: 'fairy', cupRound: '비트의 난입',
    team: team(['mawile', 51], ['gardevoir', 51], ['rapidash', 52, { formId: 'rapidash-galar' }], ['hatterene', 53, gigantamax]),
  },
  {
    id: 'galar-nessa-cup', locationId: stadium, name: '야청', role: 'elite', type: 'water', cupRound: '파이널 1회전',
    team: team(['golisopod', 51], ['pelipper', 51], ['barraskewda', 52], ['seaking', 52], ['drednaw', 53, gigantamax]),
  },
  {
    id: 'galar-bea-cup', locationId: stadium, name: '채두', role: 'elite', type: 'fighting', cupRound: '파이널 준결승',
    team: team(['hawlucha', 52], ['grapploct', 52], ['sirfetchd', 53], ['falinks', 53], ['machamp', 54, gigantamax]),
  },
  {
    id: 'galar-raihan-cup', locationId: stadium, name: '금랑', role: 'elite', type: 'dragon', cupRound: '파이널 결승',
    team: team(['torkoal', 53], ['goodra', 54], ['turtonator', 54], ['flygon', 54], ['duraludon', 55, gigantamax]),
  },
  leon,
]

export function galarTrainerForStarter(trainer: KantoTrainer, starterSpeciesId: string): KantoTrainer {
  if (trainer.id !== hop.id && trainer.id !== leon.id) return trainer
  const type = species[starterSpeciesId]?.types?.[0]
  if (type !== 'fire' && type !== 'water') return trainer.id === hop.id ? hop : leon
  if (trainer.id === leon.id) return { ...leon, team: leonTeam(type) }
  const partner = type === 'fire' ? 'rillaboom' : 'cinderace'
  return { ...hop, team: [...hopLead, ...team([partner, 49, dynamax])] }
}

export const galarGymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(galarGymTrainers.map(trainer => [trainer.locationId, trainer])), null)

export const galarTrainerById: Readonly<Record<string, KantoTrainer | undefined>> = Object.setPrototypeOf(
  Object.fromEntries([...galarGymTrainers, ...galarLeagueTrainers].map(trainer => [trainer.id, trainer])), null,
)
