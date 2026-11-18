import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { HOENN_LEAGUE_LOCATION_ID, hoennLocationById, hoennRegion } from '../src/game/regions/hoenn'
import { hoennGymTrainerByLocationId, hoennGymTrainers, hoennLeagueTrainers, hoennTrainerById } from '../src/game/regions/hoennCampaign'

describe('Emerald first-challenge parties', () => {
  it('pairs the eight gyms with their original leaders, badges, and ace levels', () => {
    expect(hoennGymTrainers.map(gym => gym.locationId)).toEqual(hoennRegion.gymLocationIds)
    expect(hoennGymTrainers.map(gym => gym.id)).toEqual([
      'hoenn-roxanne', 'hoenn-brawly', 'hoenn-wattson', 'hoenn-flannery',
      'hoenn-norman', 'hoenn-winona', 'hoenn-tate-liza', 'hoenn-juan',
    ])
    expect(hoennGymTrainers.map(gym => gym.team.at(-1)?.level)).toEqual([15, 19, 24, 29, 31, 33, 42, 46])
    expect(new Set(hoennGymTrainers.map(gym => gym.badge)).size).toBe(8)
    for (const trainer of hoennGymTrainers) {
      expect(hoennGymTrainerByLocationId[trainer.locationId]).toBe(trainer)
      expect(hoennLocationById[trainer.locationId].gym?.leader).toBe(trainer.name)
    }
  })

  it('fields the Emerald Elite Four followed by champion Wallace at the Hoenn League', () => {
    expect(hoennLeagueTrainers.map(trainer => trainer.name)).toEqual(['혁진', '회연', '미혜', '권수', '윤진'])
    expect(hoennLeagueTrainers.map(trainer => trainer.role)).toEqual(['elite', 'elite', 'elite', 'elite', 'champion'])
    expect(hoennLeagueTrainers.every(trainer => trainer.locationId === HOENN_LEAGUE_LOCATION_ID)).toBe(true)
    expect(hoennTrainerById['hoenn-wallace']?.team).toEqual([
      { speciesId: 'wailord', level: 57 }, { speciesId: 'tentacruel', level: 55 },
      { speciesId: 'ludicolo', level: 56 }, { speciesId: 'whiscash', level: 56 },
      { speciesId: 'gyarados', level: 56 }, { speciesId: 'milotic', level: 58 },
    ])
    expect(Object.keys(hoennTrainerById)).toHaveLength(13)
    for (const trainer of [...hoennGymTrainers, ...hoennLeagueTrainers]) {
      expect(hoennTrainerById[trainer.id]).toBe(trainer)
      expect(trainer.team.every(member => Boolean(species[member.speciesId]))).toBe(true)
    }
  })
})
