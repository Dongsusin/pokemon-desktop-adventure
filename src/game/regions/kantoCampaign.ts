import { species } from '../catalog'
import { kantoLocationById, kantoRegion } from './kanto'

// Original Pokémon Red and Blue party composition and send-out order.
// https://github.com/pret/pokered/blob/ba9c0568f64ae602fadda577a08c66639f93082a/data/trainers/parties.asm
// https://github.com/pret/pokered/blob/ba9c0568f64ae602fadda577a08c66639f93082a/scripts/ChampionsRoom.asm

export interface KantoTrainerMember {
  readonly speciesId: string
  readonly formId?: string
  readonly teraType?: string
  readonly abilityId?: 'levitate' | 'water-absorb'
  readonly dynamax?: 'dynamax' | 'gigantamax'
  readonly level: number
}

export interface KantoTrainer {
  readonly id: string
  readonly locationId: string
  readonly name: string
  readonly role: 'gym' | 'elite' | 'champion'
  readonly cupRound?: string
  readonly trialKind?: 'totem' | 'kahuna'
  readonly totemAura?: { stat: 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed' | 'all'; stages: 1 | 2 }
  readonly team: readonly KantoTrainerMember[]
  readonly badge?: string
  readonly type?: string
}

type TeamSlot = readonly [speciesId: string, level: number]

function team(...slots: TeamSlot[]): readonly KantoTrainerMember[] {
  return slots.map(([speciesId, level]) => ({ speciesId, level }))
}

function gym(id: string, locationId: string, roster: readonly KantoTrainerMember[]): KantoTrainer {
  const info = kantoLocationById[locationId]?.gym
  if (!info) throw new Error('Missing Kanto gym: ' + locationId)
  return {
    id, locationId, name: info.leader, role: 'gym', team: roster,
    badge: info.badge, type: info.type,
  }
}

export const kantoGymTrainers: readonly KantoTrainer[] = [
  gym('brock', 'pewter-city', team(['geodude', 12], ['onix', 14])),
  gym('misty', 'cerulean-city', team(['staryu', 18], ['starmie', 21])),
  gym('lt-surge', 'vermilion-city', team(['voltorb', 21], ['pikachu', 18], ['raichu', 24])),
  gym('erika', 'celadon-city', team(['victreebel', 29], ['tangela', 24], ['vileplume', 29])),
  gym('koga', 'fuchsia-city', team(['koffing', 37], ['muk', 39], ['koffing', 37], ['weezing', 43])),
  gym('sabrina', 'saffron-city', team(['kadabra', 38], ['mr-mime', 37], ['venomoth', 38], ['alakazam', 43])),
  gym('blaine', 'cinnabar-island', team(['growlithe', 42], ['ponyta', 40], ['rapidash', 42], ['arcanine', 47])),
  gym('giovanni', 'viridian-city', team(
    ['rhyhorn', 45], ['dugtrio', 42], ['nidoqueen', 44], ['nidoking', 45], ['rhydon', 50],
  )),
]

const leagueLocationId = kantoRegion.leagueLocationId

const championLead = team(['pidgeot', 61], ['alakazam', 59], ['rhydon', 61])
const championTeams = {
  fire: [...championLead, ...team(['arcanine', 61], ['exeggutor', 63], ['blastoise', 65])],
  water: [...championLead, ...team(['gyarados', 61], ['arcanine', 63], ['venusaur', 65])],
  grass: [...championLead, ...team(['exeggutor', 61], ['gyarados', 63], ['charizard', 65])],
}

const champion: KantoTrainer = {
  id: 'blue', name: '그린', role: 'champion', locationId: leagueLocationId, team: championTeams.fire,
}

export const kantoLeagueTrainers: readonly KantoTrainer[] = [
  {
    id: 'lorelei', name: '칸나', role: 'elite', locationId: leagueLocationId, type: 'ice',
    team: team(['dewgong', 54], ['cloyster', 53], ['slowbro', 54], ['jynx', 56], ['lapras', 56]),
  },
  {
    id: 'bruno', name: '시바', role: 'elite', locationId: leagueLocationId, type: 'fighting',
    team: team(['onix', 53], ['hitmonchan', 55], ['hitmonlee', 55], ['onix', 56], ['machamp', 58]),
  },
  {
    id: 'agatha', name: '국화', role: 'elite', locationId: leagueLocationId, type: 'ghost',
    team: team(['gengar', 56], ['golbat', 56], ['haunter', 55], ['arbok', 58], ['gengar', 60]),
  },
  {
    id: 'lance', name: '목호', role: 'elite', locationId: leagueLocationId, type: 'dragon',
    team: team(['gyarados', 58], ['dragonair', 56], ['dragonair', 56], ['aerodactyl', 60], ['dragonite', 62]),
  },
  champion,
]

export const kantoGymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(kantoGymTrainers.map((trainer) => [trainer.locationId, trainer])), null)

export const kantoTrainerById: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries([...kantoGymTrainers, ...kantoLeagueTrainers].map((trainer) => [trainer.id, trainer])), null)

export function kantoLeagueChampionForStarter(starterSpeciesId: string): KantoTrainer {
  // Existing starters from later regions use the Red and Blue branch of their primary type.
  const starterType = species[starterSpeciesId]?.types?.[0]
  if (starterType === 'grass' || starterType === 'water') {
    return { ...champion, team: championTeams[starterType] }
  }
  return champion
}
