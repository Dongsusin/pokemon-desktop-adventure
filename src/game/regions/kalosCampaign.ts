import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import { KALOS_LEAGUE_LOCATION_ID, kalosLocationById } from './kalos'

// Pokémon X first-challenge rosters, in party order (see assets/maps/kalos/TRAINERS.md).
type TeamSlot = readonly [speciesId: string, level: number]

function team(...slots: TeamSlot[]): readonly KantoTrainerMember[] {
  return slots.map(([speciesId, level]) => ({ speciesId, level }))
}

function gym(id: string, locationId: string, roster: readonly KantoTrainerMember[]): KantoTrainer {
  const info = kalosLocationById[locationId]?.gym
  if (!info) throw new Error('Missing Kalos gym: ' + locationId)
  return {
    id, locationId, name: info.leader, role: 'gym', team: roster,
    badge: info.badge, type: info.type,
  }
}

export const kalosGymTrainers: readonly KantoTrainer[] = [
  gym('kalos-viola', 'santalune-city', team(['surskit', 10], ['vivillon', 12])),
  gym('kalos-grant', 'cyllage-city', team(['amaura', 25], ['tyrunt', 25])),
  gym('kalos-korrina', 'shalour-city', team(['mienfoo', 29], ['machoke', 28], ['hawlucha', 32])),
  gym('kalos-ramos', 'coumarine-city', team(['jumpluff', 30], ['weepinbell', 31], ['gogoat', 34])),
  gym('kalos-clemont', 'lumiose-city', team(['emolga', 35], ['magneton', 35], ['heliolisk', 37])),
  gym('kalos-valerie', 'laverre-city', team(['mawile', 38], ['mr-mime', 39], ['sylveon', 42])),
  gym('kalos-olympia', 'anistar-city', team(['sigilyph', 44], ['slowking', 45], ['meowstic', 48])),
  gym('kalos-wulfric', 'snowbelle-city', team(['abomasnow', 56], ['cryogonal', 55], ['avalugg', 59])),
]

export const kalosLeagueTrainers: readonly KantoTrainer[] = [
  {
    id: 'kalos-malva', name: '파키라', role: 'elite', locationId: KALOS_LEAGUE_LOCATION_ID, type: 'fire',
    team: team(['pyroar', 63], ['torkoal', 63], ['chandelure', 63], ['talonflame', 65]),
  },
  {
    id: 'kalos-siebold', name: '즈미', role: 'elite', locationId: KALOS_LEAGUE_LOCATION_ID, type: 'water',
    team: team(['clawitzer', 63], ['gyarados', 63], ['starmie', 63], ['barbaracle', 65]),
  },
  {
    id: 'kalos-drasna', name: '드라세나', role: 'elite', locationId: KALOS_LEAGUE_LOCATION_ID, type: 'dragon',
    team: team(['dragalge', 63], ['druddigon', 63], ['altaria', 63], ['noivern', 65]),
  },
  {
    id: 'kalos-wikstrom', name: '간피', role: 'elite', locationId: KALOS_LEAGUE_LOCATION_ID, type: 'steel',
    team: team(['klefki', 63], ['scizor', 63], ['probopass', 63], ['aegislash', 65]),
  },
  {
    id: 'kalos-diantha', name: '카르네', role: 'champion', locationId: KALOS_LEAGUE_LOCATION_ID,
    team: team(['hawlucha', 64], ['tyrantrum', 65], ['aurorus', 65], ['gourgeist', 65], ['goodra', 66], ['gardevoir', 68]),
  },
]

export const kalosGymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(kalosGymTrainers.map(trainer => [trainer.locationId, trainer])), null)

export const kalosTrainerById: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries([...kalosGymTrainers, ...kalosLeagueTrainers].map(trainer => [trainer.id, trainer])), null)
