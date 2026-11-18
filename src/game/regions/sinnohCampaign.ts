import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import { SINNOH_LEAGUE_LOCATION_ID, sinnohLocationById } from './sinnoh'

// Platinum's first-challenge rosters, in party order (see assets/maps/sinnoh/TRAINERS.md).
type TeamSlot = readonly [speciesId: string, level: number]

function team(...slots: TeamSlot[]): readonly KantoTrainerMember[] {
  return slots.map(([speciesId, level]) => ({ speciesId, level }))
}

function gym(id: string, locationId: string, roster: readonly KantoTrainerMember[]): KantoTrainer {
  const info = sinnohLocationById[locationId]?.gym
  if (!info) throw new Error('Missing Sinnoh gym: ' + locationId)
  return {
    id, locationId, name: info.leader, role: 'gym', team: roster,
    badge: info.badge, type: info.type,
  }
}

export const sinnohGymTrainers: readonly KantoTrainer[] = [
  gym('sinnoh-roark', 'oreburgh-city', team(['geodude', 12], ['onix', 12], ['cranidos', 14])),
  gym('sinnoh-gardenia', 'eterna-city', team(['turtwig', 20], ['cherrim', 20], ['roserade', 22])),
  gym('sinnoh-fantina', 'hearthome-city', team(['duskull', 24], ['haunter', 24], ['mismagius', 26])),
  gym('sinnoh-maylene', 'veilstone-city', team(['meditite', 28], ['machoke', 29], ['lucario', 32])),
  gym('sinnoh-wake', 'pastoria-city', team(['gyarados', 33], ['quagsire', 34], ['floatzel', 37])),
  gym('sinnoh-byron', 'canalave-city', team(['magneton', 37], ['steelix', 38], ['bastiodon', 41])),
  gym('sinnoh-candice', 'snowpoint-city', team(['sneasel', 40], ['piloswine', 40], ['abomasnow', 42], ['froslass', 44])),
  gym('sinnoh-volkner', 'sunyshore-city', team(['jolteon', 46], ['raichu', 46], ['luxray', 48], ['electivire', 50])),
]

export const sinnohLeagueTrainers: readonly KantoTrainer[] = [
  {
    id: 'sinnoh-aaron', name: '충호', role: 'elite', locationId: SINNOH_LEAGUE_LOCATION_ID, type: 'bug',
    team: team(['yanmega', 49], ['scizor', 49], ['vespiquen', 50], ['heracross', 51], ['drapion', 53]),
  },
  {
    id: 'sinnoh-bertha', name: '들국화', role: 'elite', locationId: SINNOH_LEAGUE_LOCATION_ID, type: 'ground',
    team: team(['whiscash', 50], ['gliscor', 53], ['hippowdon', 52], ['golem', 52], ['rhyperior', 55]),
  },
  {
    id: 'sinnoh-flint', name: '대엽', role: 'elite', locationId: SINNOH_LEAGUE_LOCATION_ID, type: 'fire',
    team: team(['houndoom', 52], ['flareon', 55], ['rapidash', 53], ['infernape', 55], ['magmortar', 57]),
  },
  {
    id: 'sinnoh-lucian', name: '오엽', role: 'elite', locationId: SINNOH_LEAGUE_LOCATION_ID, type: 'psychic',
    team: team(['mr-mime', 53], ['espeon', 55], ['bronzong', 54], ['alakazam', 56], ['gallade', 59]),
  },
  {
    id: 'sinnoh-cynthia', name: '난천', role: 'champion', locationId: SINNOH_LEAGUE_LOCATION_ID,
    team: team(['spiritomb', 58], ['roserade', 58], ['togekiss', 60], ['lucario', 60], ['milotic', 58], ['garchomp', 62]),
  },
]

export const sinnohGymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(sinnohGymTrainers.map(trainer => [trainer.locationId, trainer])), null)

export const sinnohTrainerById: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries([...sinnohGymTrainers, ...sinnohLeagueTrainers].map(trainer => [trainer.id, trainer])), null)
