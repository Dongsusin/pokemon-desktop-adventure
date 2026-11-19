import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { locationForm } from '../src/game/forms'
import { isSpeciesMotionSupported } from '../src/game/motionEligibility'
import { fieldTrainerById, fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { regionOrder, worldRegions } from '../src/game/regions/world'

describe('regional field trainers', () => {
  it('offers six distinct opponents at separate mapped places in each region', () => {
    expect(Object.keys(fieldTrainersByRegion).sort()).toEqual([...regionOrder].sort())
    const ids = new Set<string>()
    for (const regionId of regionOrder) {
      const region = worldRegions[regionId]
      const trainers = fieldTrainersByRegion[regionId]
      expect(trainers).toHaveLength(6)
      expect(new Set(trainers.map(t => t.locationId)).size).toBe(trainers.length)
      for (const trainer of trainers) {
        expect(trainer.role).toBe('field')
        expect(trainer.name).toMatch(/[가-힣]|^N$/)
        expect(ids.has(trainer.id)).toBe(false)
        ids.add(trainer.id)
        expect(fieldTrainerById[trainer.id]).toBe(trainer)
        expect(region.locationById[trainer.locationId], trainer.id).toBeDefined()
        expect(region.trainerById[trainer.id]).toBeUndefined()
      }
    }
    expect(Object.keys(fieldTrainerById).sort()).toEqual([...ids].sort())
    expect(fieldTrainerById['__proto__']).toBeUndefined()
  })

  it('places an early opponent and a stronger later opponent below their reachable regional caps', () => {
    for (const regionId of regionOrder) {
      const trainers = fieldTrainersByRegion[regionId]
      const caps = worldRegions[regionId].levelCaps
      expect(trainers.some(t => t.requiredBadges === 0 && t.team.every(m => m.level <= 10)), regionId).toBe(true)
      expect(trainers.some(t => t.requiredBadges >= 4 && t.team.some(m => m.level >= 35)), regionId).toBe(true)
      expect(trainers.some(t => t.kind === 'villain'), regionId).toBe(true)
      for (const trainer of trainers) {
        expect(Number.isInteger(trainer.requiredBadges)).toBe(true)
        expect(trainer.requiredBadges).toBeGreaterThanOrEqual(0)
        expect(trainer.requiredBadges).toBeLessThan(caps.length)
        expect(trainer.team.length).toBeGreaterThan(0)
        expect(trainer.team.length).toBeLessThanOrEqual(6)
        for (const mon of trainer.team) {
          expect(Number.isInteger(mon.level)).toBe(true)
          expect(mon.level).toBeGreaterThan(0)
          expect(mon.level, trainer.id).toBeLessThanOrEqual(caps[trainer.requiredBadges])
          expect(species[mon.speciesId], trainer.id).toBeDefined()
          const formId = mon.formId ?? locationForm(regionId, trainer.locationId, mon.speciesId)
          expect(isSpeciesMotionSupported(mon.speciesId, formId), trainer.id + '/' + mon.speciesId).toBe(true)
        }
      }
    }
  })

  it('preserves the specific party and setting used when an anime or game character is introduced', () => {
    expect(fieldTrainerById['field-kanto-ash']).toMatchObject({
      locationId: 'viridian-forest', series: 'anime', team: [{ speciesId: 'caterpie' }, { speciesId: 'pikachu' }],
    })
    expect(fieldTrainerById['field-kanto-rocket-duo']).toMatchObject({
      name: '로사·로이', series: 'both', team: [{ speciesId: 'ekans' }, { speciesId: 'meowth' }, { speciesId: 'koffing' }],
    })
    expect(fieldTrainerById['field-kanto-blue']?.venue).toBe('ship')
    expect(fieldTrainerById['field-hoenn-maxie']?.venue).toBe('volcano')
    expect(fieldTrainerById['field-kanto-hiker']?.kind).toBe('trainer')
    expect(fieldTrainerById['field-sinnoh-dawn']?.team.at(-1)?.speciesId).toBe('piplup')
    expect(fieldTrainerById['field-kalos-alain']).toMatchObject({ locationId: 'lumiose-city', series: 'anime' })
    expect(fieldTrainerById['field-kalos-alain']?.team.at(-1)?.speciesId).toBe('charizard')
    expect(fieldTrainerById['field-alola-lusamine']?.venue).toBe('aether-lab')
    expect(fieldTrainerById['field-paldea-arven']).toMatchObject({ venue: 'desert', team: [{ speciesId: 'scovillain' }] })
  })
})
