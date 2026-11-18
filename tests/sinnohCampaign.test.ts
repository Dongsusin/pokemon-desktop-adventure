import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { SINNOH_LEAGUE_LOCATION_ID, sinnohLocationById, sinnohRegion } from '../src/game/regions/sinnoh'
import { sinnohGymTrainerByLocationId, sinnohGymTrainers, sinnohLeagueTrainers, sinnohTrainerById } from '../src/game/regions/sinnohCampaign'

describe('Platinum first-challenge parties', () => {
  it('pairs the eight gyms with their original leaders, badges, and ace levels', () => {
    expect(sinnohGymTrainers.map(gym => gym.locationId)).toEqual(sinnohRegion.gymLocationIds)
    expect(sinnohGymTrainers.map(gym => gym.id)).toEqual([
      'sinnoh-roark', 'sinnoh-gardenia', 'sinnoh-fantina', 'sinnoh-maylene',
      'sinnoh-wake', 'sinnoh-byron', 'sinnoh-candice', 'sinnoh-volkner',
    ])
    expect(sinnohGymTrainers.map(gym => gym.team.at(-1)?.level)).toEqual([14, 22, 26, 32, 37, 41, 44, 50])
    expect(sinnohGymTrainers.map(gym => gym.badge)).toEqual([
      '콜배지', '포리스트배지', '레릭배지', '코블배지', '펜배지', '마인배지', '글레이셔배지', '비컨배지',
    ])
    for (const trainer of sinnohGymTrainers) {
      expect(sinnohGymTrainerByLocationId[trainer.locationId]).toBe(trainer)
      expect(sinnohLocationById[trainer.locationId].gym?.leader).toBe(trainer.name)
    }
  })

  it('fields the Platinum Elite Four followed by champion Cynthia at the Sinnoh League', () => {
    expect(sinnohLeagueTrainers.map(trainer => trainer.name)).toEqual(['충호', '들국화', '대엽', '오엽', '난천'])
    expect(sinnohLeagueTrainers.map(trainer => trainer.role)).toEqual(['elite', 'elite', 'elite', 'elite', 'champion'])
    expect(sinnohLeagueTrainers.every(trainer => trainer.locationId === SINNOH_LEAGUE_LOCATION_ID)).toBe(true)
    expect(sinnohTrainerById['sinnoh-cynthia']?.team).toEqual([
      { speciesId: 'spiritomb', level: 58 }, { speciesId: 'roserade', level: 58 },
      { speciesId: 'togekiss', level: 60 }, { speciesId: 'lucario', level: 60 },
      { speciesId: 'milotic', level: 58 }, { speciesId: 'garchomp', level: 62 },
    ])
    expect(Object.keys(sinnohTrainerById)).toHaveLength(13)
    for (const trainer of [...sinnohGymTrainers, ...sinnohLeagueTrainers]) {
      expect(sinnohTrainerById[trainer.id]).toBe(trainer)
      expect(trainer.team.every(member => Boolean(species[member.speciesId]))).toBe(true)
    }
  })
})
