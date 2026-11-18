import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import { UNOVA_LEAGUE_LOCATION_ID, unovaLocationById } from './unova'

// Black 2's Normal Mode first-challenge rosters, in party order (see assets/maps/unova/TRAINERS.md).
type TeamSlot = readonly [speciesId: string, level: number]

function team(...slots: TeamSlot[]): readonly KantoTrainerMember[] {
  return slots.map(([speciesId, level]) => ({ speciesId, level }))
}

function gym(id: string, locationId: string, roster: readonly KantoTrainerMember[]): KantoTrainer {
  const info = unovaLocationById[locationId]?.gym
  if (!info) throw new Error('Missing Unova gym: ' + locationId)
  return {
    id, locationId, name: info.leader, role: 'gym', team: roster,
    badge: info.badge, type: info.type,
  }
}

export const unovaGymTrainers: readonly KantoTrainer[] = [
  gym('unova-cheren', 'aspertia-city', team(['patrat', 11], ['lillipup', 13])),
  gym('unova-roxie', 'virbank-city', team(['koffing', 16], ['whirlipede', 18])),
  gym('unova-burgh', 'castelia-city', team(['swadloon', 22], ['dwebble', 22], ['leavanny', 24])),
  gym('unova-elesa', 'nimbasa-city', team(['emolga', 28], ['flaaffy', 28], ['zebstrika', 30])),
  gym('unova-clay', 'driftveil-city', team(['krokorok', 31], ['sandslash', 31], ['excadrill', 33])),
  gym('unova-skyla', 'mistralton-city', team(['swoobat', 37], ['skarmory', 37], ['swanna', 39])),
  gym('unova-drayden', 'opelucid-city', team(['druddigon', 46], ['flygon', 46], ['haxorus', 48])),
  gym('unova-marlon', 'humilau-city', team(['carracosta', 49], ['wailord', 49], ['jellicent', 51])),
]

export const unovaLeagueTrainers: readonly KantoTrainer[] = [
  {
    id: 'unova-shauntal', name: '망초', role: 'elite', locationId: UNOVA_LEAGUE_LOCATION_ID, type: 'ghost',
    team: team(['cofagrigus', 56], ['drifblim', 56], ['golurk', 56], ['chandelure', 58]),
  },
  {
    id: 'unova-grimsley', name: '블래리', role: 'elite', locationId: UNOVA_LEAGUE_LOCATION_ID, type: 'dark',
    team: team(['liepard', 56], ['scrafty', 56], ['krookodile', 56], ['bisharp', 58]),
  },
  {
    id: 'unova-caitlin', name: '카틀레야', role: 'elite', locationId: UNOVA_LEAGUE_LOCATION_ID, type: 'psychic',
    team: team(['musharna', 56], ['reuniclus', 56], ['sigilyph', 56], ['gothitelle', 58]),
  },
  {
    id: 'unova-marshal', name: '연무', role: 'elite', locationId: UNOVA_LEAGUE_LOCATION_ID, type: 'fighting',
    team: team(['throh', 56], ['sawk', 56], ['mienshao', 56], ['conkeldurr', 58]),
  },
  {
    id: 'unova-iris', name: '아이리스', role: 'champion', locationId: UNOVA_LEAGUE_LOCATION_ID,
    team: team(['hydreigon', 57], ['druddigon', 57], ['archeops', 57], ['aggron', 57], ['lapras', 57], ['haxorus', 59]),
  },
]

export const unovaGymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(unovaGymTrainers.map(trainer => [trainer.locationId, trainer])), null)

export const unovaTrainerById: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries([...unovaGymTrainers, ...unovaLeagueTrainers].map(trainer => [trainer.id, trainer])), null)
