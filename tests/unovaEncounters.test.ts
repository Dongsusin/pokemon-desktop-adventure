import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { unovaEncounterSlots, unovaLegendSlots } from '../src/game/regions/unova-encounters'

describe('Black 2 wild encounters', () => {
  it('preserves native level ranges, accounts for Surf and weights seasonal changes', () => {
    const coast = unovaEncounterSlots['unova-route-19']!
    const probability = (rows: typeof coast, id: string, level?: number) => {
      const sum = rows.reduce((total, [, , weight]) => total + weight, 0)
      return rows.reduce((total, [speciesId, lv, weight]) =>
        total + (speciesId === id && (level === undefined || lv === level) ? weight / sum : 0), 0)
    }

    expect(probability(coast, 'patrat')).toBeCloseTo(0.25)
    expect(probability(coast, 'purrloin', 3)).toBeCloseTo(0.05)
    for (let lv = 5; lv <= 15; lv++) expect(probability(coast, 'basculin', lv)).toBeCloseTo(0.5 / 11)
    const bay = unovaEncounterSlots['undella-bay']!
    expect(probability(bay, 'spheal')).toBeCloseTo(0.075)
    expect(probability(bay, 'mantyke')).toBeCloseTo(0.225)
    expect(unovaEncounterSlots['reversal-mountain']?.some(([id]) => id === 'spoink')).toBe(true)
    expect(unovaEncounterSlots['reversal-mountain']?.some(([id]) => id === 'numel')).toBe(false)
  })

  it('covers the accessible routes and Black 2 stationary legendary battles', () => {
    for (let route = 1; route <= 23; route++) {
      const pool = unovaEncounterSlots['unova-route-' + route]
      if (route === 10) expect(pool).toBeUndefined()
      else expect(pool?.length).toBeGreaterThan(0)
    }
    expect(unovaLegendSlots['dragonspiral-tower']).toEqual([['zekrom', 70, 1]])
    expect(unovaLegendSlots['giant-chasm']).toEqual([['kyurem', 70, 1]])
    expect(unovaLegendSlots.dreamyard).toEqual([['latios', 68, 1]])
    expect(unovaLegendSlots['iron-room']).toEqual([['registeel', 65, 1]])
    expect(unovaLegendSlots['unova-route-13']).toEqual([['cobalion', 45, 1]])

    const ordinary = Object.values(unovaEncounterSlots).flatMap(rows => rows ?? [])
    const rare = Object.values(unovaLegendSlots).flatMap(rows => rows ?? [])
    expect(Object.keys(unovaEncounterSlots)).toHaveLength(60)
    expect(new Set(ordinary.map(([id]) => id)).size).toBe(150)
    expect(new Set(rare.map(([id]) => id)).size).toBe(14)
    expect(rare.some(([id]) => ['latias', 'reshiram', 'regice'].includes(id))).toBe(false)
    for (const [id, lv, weight] of [...ordinary, ...rare]) {
      expect(species[id]?.pokedexNumber).toBeLessThanOrEqual(649)
      expect(Number.isInteger(lv) && lv > 0 && lv <= 100).toBe(true)
      expect(Number.isFinite(weight) && weight > 0).toBe(true)
    }
  })
})
