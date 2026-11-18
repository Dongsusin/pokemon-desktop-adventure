import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { KALOS_LEAGUE_LOCATION_ID, kalosRegion } from '../src/game/regions/kalos'
import {
  kalosGymTrainerByLocationId, kalosGymTrainers, kalosLeagueTrainers, kalosTrainerById,
} from '../src/game/regions/kalosCampaign'

describe('Pokémon X first-challenge teams', () => {
  it('matches the eight badge cases, Korean gym names and ace levels in progression order', () => {
    expect(kalosGymTrainers.map(trainer => trainer.locationId)).toEqual(kalosRegion.gymLocationIds)
    expect(kalosGymTrainers.map(trainer => trainer.name)).toEqual([
      '비올라', '자크로', '코르니', '후쿠지', '시트론', '마슈', '고지카', '우르프',
    ])
    expect(kalosGymTrainers.map(trainer => trainer.badge)).toEqual([
      '버그배지', '월배지', '파이트배지', '플랜트배지', '볼티지배지', '페어리배지', '사이킥배지', '아이스버그배지',
    ])
    expect(kalosGymTrainers.map(trainer => trainer.team.at(-1)?.level)).toEqual([12, 25, 32, 34, 37, 42, 48, 59])
    for (const trainer of kalosGymTrainers) {
      expect(kalosGymTrainerByLocationId[trainer.locationId]).toBe(trainer)
    }

    const sheet = readFileSync('assets/maps/kalos/gym-badges.png')
    expect([sheet.readUInt32BE(16), sheet.readUInt32BE(20)]).toEqual([16, 16 * 2 * 8])
  })

  it('registers all four Elite Four teams and the six members of Diantha’s Champion party', () => {
    expect(kalosLeagueTrainers.map(trainer => trainer.name)).toEqual(['파키라', '즈미', '드라세나', '간피', '카르네'])
    expect(kalosLeagueTrainers.map(trainer => trainer.role)).toEqual(['elite', 'elite', 'elite', 'elite', 'champion'])
    expect(kalosLeagueTrainers.every(trainer => trainer.locationId === KALOS_LEAGUE_LOCATION_ID)).toBe(true)
    for (const elite of kalosLeagueTrainers.slice(0, 4)) {
      expect(elite.team.map(member => member.level)).toEqual([63, 63, 63, 65])
    }
    expect(kalosTrainerById['kalos-diantha']?.team).toEqual([
      { speciesId: 'hawlucha', level: 64 }, { speciesId: 'tyrantrum', level: 65 },
      { speciesId: 'aurorus', level: 65 }, { speciesId: 'gourgeist', level: 65 },
      { speciesId: 'goodra', level: 66 }, { speciesId: 'gardevoir', level: 68 },
    ])

    const trainers = [...kalosGymTrainers, ...kalosLeagueTrainers]
    expect(trainers.flatMap(trainer => trainer.team)).toHaveLength(44)
    for (const trainer of trainers) {
      expect(kalosTrainerById[trainer.id]).toBe(trainer)
      expect(trainer.team.every(member => Object.hasOwn(species, member.speciesId))).toBe(true)
    }
  })
})
