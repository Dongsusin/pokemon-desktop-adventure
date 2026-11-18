import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import { JOHTO_LEAGUE_LOCATION_ID, johtoLocationById } from './johto'

// Original Pokémon Gold and Silver teams, including their send-out order.
// https://github.com/pret/pokegold/blob/2bbfba60051acfbed96d68fb5e40173a06df67d8/data/trainers/parties.asm
// Korean trainer names follow the localized Pokémon series names.
// https://pokemonmasters-game.com/ko-KR/announcements/Other_8060_5W_1

type TeamSlot = readonly [speciesId: string, level: number]

function team(...slots: TeamSlot[]): readonly KantoTrainerMember[] {
  return slots.map(([speciesId, level]) => ({ speciesId, level }))
}

function gym(id: string, locationId: string, roster: readonly KantoTrainerMember[]): KantoTrainer {
  const info = johtoLocationById[locationId]?.gym
  if (!info) throw new Error('Missing Johto gym: ' + locationId)
  return {
    id, locationId, name: info.leader, role: 'gym', team: roster,
    badge: info.badge, type: info.type,
  }
}

export const johtoGymTrainers: readonly KantoTrainer[] = [
  gym('johto-falkner', 'violet-city', team(['pidgey', 7], ['pidgeotto', 9])),
  gym('johto-bugsy', 'azalea-town', team(['metapod', 14], ['kakuna', 14], ['scyther', 16])),
  gym('johto-whitney', 'goldenrod-city', team(['clefairy', 18], ['miltank', 20])),
  gym('johto-morty', 'ecruteak-city', team(['gastly', 21], ['haunter', 21], ['gengar', 25], ['haunter', 23])),
  gym('johto-chuck', 'cianwood-city', team(['primeape', 27], ['poliwrath', 30])),
  gym('johto-jasmine', 'olivine-city', team(['magnemite', 30], ['magnemite', 30], ['steelix', 35])),
  gym('johto-pryce', 'mahogany-town', team(['seel', 27], ['dewgong', 29], ['piloswine', 31])),
  gym('johto-clair', 'blackthorn-city', team(['dragonair', 37], ['dragonair', 37], ['dragonair', 37], ['kingdra', 40])),
]

export const johtoLeagueTrainers: readonly KantoTrainer[] = [
  {
    id: 'johto-will', name: '일목', role: 'elite', locationId: JOHTO_LEAGUE_LOCATION_ID, type: 'psychic',
    team: team(['xatu', 40], ['jynx', 41], ['exeggutor', 41], ['slowbro', 41], ['xatu', 42]),
  },
  {
    id: 'johto-koga', name: '독수', role: 'elite', locationId: JOHTO_LEAGUE_LOCATION_ID, type: 'poison',
    team: team(['ariados', 40], ['venomoth', 41], ['forretress', 43], ['muk', 42], ['crobat', 44]),
  },
  {
    id: 'johto-bruno', name: '시바', role: 'elite', locationId: JOHTO_LEAGUE_LOCATION_ID, type: 'fighting',
    team: team(['hitmontop', 42], ['hitmonlee', 42], ['hitmonchan', 42], ['onix', 43], ['machamp', 46]),
  },
  {
    id: 'johto-karen', name: '카렌', role: 'elite', locationId: JOHTO_LEAGUE_LOCATION_ID, type: 'dark',
    team: team(['umbreon', 42], ['vileplume', 42], ['gengar', 45], ['murkrow', 44], ['houndoom', 47]),
  },
  {
    id: 'johto-lance', name: '목호', role: 'champion', locationId: JOHTO_LEAGUE_LOCATION_ID, type: 'dragon',
    team: team(['gyarados', 44], ['dragonite', 47], ['dragonite', 47], ['aerodactyl', 46], ['charizard', 46], ['dragonite', 50]),
  },
]

export const johtoGymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(johtoGymTrainers.map(trainer => [trainer.locationId, trainer])), null)

export const johtoTrainerById: Readonly<Record<string, KantoTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries([...johtoGymTrainers, ...johtoLeagueTrainers].map(trainer => [trainer.id, trainer])), null)
