import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { UNOVA_LEAGUE_LOCATION_ID, unovaLocationById, unovaRegion } from '../src/game/regions/unova'
import { unovaGymTrainerByLocationId, unovaGymTrainers, unovaLeagueTrainers, unovaTrainerById } from '../src/game/regions/unovaCampaign'

describe('Black 2 Normal Mode first-challenge parties', () => {
  it('places all eight gym leader teams and badges in Black 2 order', () => {
    expect(unovaGymTrainers.map(gym => gym.locationId)).toEqual(unovaRegion.gymLocationIds)
    expect(unovaGymTrainers.map(gym => gym.name)).toEqual(['체렌', '보미카', '아티', '카밀레', '야콘', '풍란', '사간', '시즈'])
    expect(unovaGymTrainers.map(gym => gym.badge)).toEqual([
      '베이직배지', '톡식배지', '비틀배지', '볼트배지', '퀘이크배지', '제트배지', '레전드배지', '웨이브배지',
    ])
    expect(unovaGymTrainers.map(gym => gym.team.at(-1)?.level)).toEqual([13, 18, 24, 30, 33, 39, 48, 51])
    for (const trainer of unovaGymTrainers) {
      expect(unovaGymTrainerByLocationId[trainer.locationId]).toBe(trainer)
      expect(unovaLocationById[trainer.locationId].gym?.leader).toBe(trainer.name)
    }
  })

  it('registers the four Unova specialists and all six of Iris’s original Pokémon', () => {
    expect(unovaLeagueTrainers.map(trainer => trainer.name)).toEqual(['망초', '블래리', '카틀레야', '연무', '아이리스'])
    expect(unovaLeagueTrainers.map(trainer => trainer.role)).toEqual(['elite', 'elite', 'elite', 'elite', 'champion'])
    expect(unovaLeagueTrainers.every(trainer => trainer.locationId === UNOVA_LEAGUE_LOCATION_ID)).toBe(true)
    expect(unovaTrainerById['unova-iris']?.team).toEqual([
      { speciesId: 'hydreigon', level: 57 }, { speciesId: 'druddigon', level: 57 },
      { speciesId: 'archeops', level: 57 }, { speciesId: 'aggron', level: 57 },
      { speciesId: 'lapras', level: 57 }, { speciesId: 'haxorus', level: 59 },
    ])
    const trainers = [...unovaGymTrainers, ...unovaLeagueTrainers]
    expect(trainers.flatMap(trainer => trainer.team)).toHaveLength(44)
    for (const trainer of trainers) {
      expect(unovaTrainerById[trainer.id]).toBe(trainer)
      expect(trainer.team.every(member => Object.hasOwn(species, member.speciesId))).toBe(true)
    }
  })
})
