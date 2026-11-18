import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import { HOENN_LEAGUE_LOCATION_ID, hoennLocationById } from './hoenn'

// Emerald's first-challenge rosters, in party order (see assets/maps/hoenn/TRAINERS.md).
type TeamSlot = readonly [speciesId: string, level: number]

function team(...slots: TeamSlot[]): readonly KantoTrainerMember[] {
  return slots.map(([speciesId, level]) => ({ speciesId, level }))
}

function gym(id: string, locationId: string, roster: readonly KantoTrainerMember[]): KantoTrainer {
  const info = hoennLocationById[locationId]?.gym
  if (!info) throw new Error('Missing Hoenn gym: ' + locationId)
  return {
    id, locationId, name: info.leader, role: 'gym', team: roster,
    badge: info.badge, type: info.type,
  }
}

export const hoennGymTrainers: readonly KantoTrainer[] = [
  gym('hoenn-roxanne', 'rustboro-city', team(['geodude', 12], ['geodude', 12], ['nosepass', 15])),
  gym('hoenn-brawly', 'dewford-town', team(['machop', 16], ['meditite', 16], ['makuhita', 19])),
  gym('hoenn-wattson', 'mauville-city', team(['voltorb', 20], ['electrike', 20], ['magneton', 22], ['manectric', 24])),
  gym('hoenn-flannery', 'lavaridge-town', team(['numel', 24], ['slugma', 24], ['camerupt', 26], ['torkoal', 29])),
  gym('hoenn-norman', 'petalburg-city', team(['spinda', 27], ['vigoroth', 27], ['linoone', 29], ['slaking', 31])),
  gym('hoenn-winona', 'fortree-city', team(['swablu', 29], ['tropius', 29], ['pelipper', 30], ['skarmory', 31], ['altaria', 33])),
  gym('hoenn-tate-liza', 'mossdeep-city', team(['claydol', 41], ['xatu', 41], ['lunatone', 42], ['solrock', 42])),
  gym('hoenn-juan', 'sootopolis-city', team(['luvdisc', 41], ['whiscash', 41], ['sealeo', 43], ['crawdaunt', 43], ['kingdra', 46])),
]

export const hoennLeagueTrainers: readonly KantoTrainer[] = [
  {
    id: 'hoenn-sidney', name: '혁진', role: 'elite', locationId: HOENN_LEAGUE_LOCATION_ID, type: 'dark',
    team: team(['mightyena', 46], ['shiftry', 48], ['cacturne', 46], ['crawdaunt', 48], ['absol', 49]),
  },
  {
    id: 'hoenn-phoebe', name: '회연', role: 'elite', locationId: HOENN_LEAGUE_LOCATION_ID, type: 'ghost',
    team: team(['dusclops', 48], ['banette', 49], ['sableye', 50], ['banette', 49], ['dusclops', 51]),
  },
  {
    id: 'hoenn-glacia', name: '미혜', role: 'elite', locationId: HOENN_LEAGUE_LOCATION_ID, type: 'ice',
    team: team(['sealeo', 50], ['glalie', 50], ['sealeo', 52], ['glalie', 52], ['walrein', 53]),
  },
  {
    id: 'hoenn-drake', name: '권수', role: 'elite', locationId: HOENN_LEAGUE_LOCATION_ID, type: 'dragon',
    team: team(['shelgon', 52], ['altaria', 54], ['kingdra', 53], ['flygon', 53], ['salamence', 55]),
  },
  {
    id: 'hoenn-wallace', name: '윤진', role: 'champion', locationId: HOENN_LEAGUE_LOCATION_ID, type: 'water',
    team: team(['wailord', 57], ['tentacruel', 55], ['ludicolo', 56], ['whiscash', 56], ['gyarados', 56], ['milotic', 58]),
  },
]

export const hoennGymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(hoennGymTrainers.map(trainer => [trainer.locationId, trainer])), null)

export const hoennTrainerById: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries([...hoennGymTrainers, ...hoennLeagueTrainers].map(trainer => [trainer.id, trainer])), null)
