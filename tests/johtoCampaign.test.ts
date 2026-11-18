import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { JOHTO_LEAGUE_LOCATION_ID, johtoLocationById, johtoRegion } from '../src/game/regions/johto'
import { johtoGymTrainerByLocationId, johtoGymTrainers, johtoLeagueTrainers, johtoTrainerById } from '../src/game/regions/johtoCampaign'
import { kantoTrainerById } from '../src/game/regions/kantoCampaign'

describe('original Johto trainers', () => {
  it('follows the original gym order and uses location badge metadata', () => {
    expect(johtoGymTrainers.map(trainer => trainer.locationId)).toEqual(johtoRegion.gymLocationIds)
    expect(johtoGymTrainers.map(trainer => trainer.name)).toEqual(['비상', '호일', '꼭두', '유빈', '사도', '규리', '류옹', '이향'])
    expect(new Set(johtoGymTrainers.map(trainer => trainer.badge)).size).toBe(8)

    for (const trainer of johtoGymTrainers) {
      const gym = johtoLocationById[trainer.locationId]?.gym
      expect(trainer.role).toBe('gym')
      expect(trainer.badge).toBe(gym?.badge)
      expect(johtoGymTrainerByLocationId[trainer.locationId]).toBe(trainer)
    }
  })

  it('keeps the Elite Four and champion in Gold order with independent trainer IDs', () => {
    expect(johtoLeagueTrainers.map(trainer => trainer.name)).toEqual(['일목', '독수', '시바', '카렌', '목호'])
    expect(johtoLeagueTrainers.map(trainer => trainer.role)).toEqual(['elite', 'elite', 'elite', 'elite', 'champion'])
    expect(johtoLeagueTrainers.every(trainer => trainer.locationId === JOHTO_LEAGUE_LOCATION_ID)).toBe(true)
    expect(johtoTrainerById['johto-lance']?.team).toEqual([
      { speciesId: 'gyarados', level: 44 },
      { speciesId: 'dragonite', level: 47 },
      { speciesId: 'dragonite', level: 47 },
      { speciesId: 'aerodactyl', level: 46 },
      { speciesId: 'charizard', level: 46 },
      { speciesId: 'dragonite', level: 50 },
    ])
    expect(Object.keys(johtoTrainerById)).toHaveLength(13)
    expect(johtoTrainerById.constructor).toBeUndefined()
    for (const [id, trainer] of Object.entries(johtoTrainerById)) {
      expect(kantoTrainerById[id]).toBeUndefined()
      expect(trainer?.team.length).toBeGreaterThanOrEqual(2)
      expect(trainer?.team.length).toBeLessThanOrEqual(6)
      expect(trainer?.team.every(member => Boolean(species[member.speciesId]))).toBe(true)
    }
  })
})
