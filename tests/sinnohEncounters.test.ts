import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { sinnohEncounterSlots, sinnohLegendSlots } from '../src/game/regions/sinnoh-encounters'

describe('Platinum wild encounters', () => {
  it('weights Route 201 by hours of the day and retains Twinleaf Surf level ranges', () => {
    const route = sinnohEncounterSlots['route-201']!
    const total = route.reduce((sum, [, , weight]) => sum + weight, 0)
    const probability = (wanted: string, level: number) => route
      .filter(([id, lv]) => id === wanted && lv === level)
      .reduce((sum, [, , weight]) => sum + weight / total, 0)
    expect(probability('starly', 2)).toBeCloseTo(0.25)
    expect(probability('bidoof', 2)).toBeCloseTo(0.25)
    expect(probability('starly', 3)).toBeCloseTo(26 / 120)
    expect(probability('bidoof', 3)).toBeCloseTo(27 / 120)
    expect(probability('kricketot', 3)).toBeCloseTo(7 / 120)
    const water = sinnohEncounterSlots['twinleaf-town']!
    const golduck = water.filter(([id]) => id === 'golduck')
    expect(golduck.map(([, level]) => level)).toEqual(Array.from({ length: 21 }, (_, i) => i + 20))
    expect(golduck.every(([, , weight]) => weight === golduck[0][2])).toBe(true)
    expect(golduck.reduce((sum, [, , weight]) => sum + weight, 0) /
      water.reduce((sum, [, , weight]) => sum + weight, 0)).toBeCloseTo(0.1)
    expect(sinnohEncounterSlots['great-marsh']?.some(([id]) => id === 'carnivine')).toBe(true)
  })

  it('covers the thirty routes and keeps the native stationary battles in location-specific rare pools', () => {
    for (let route = 201; route <= 230; route++) {
      expect(sinnohEncounterSlots['route-' + route]?.length).toBeGreaterThan(0)
    }
    expect(sinnohLegendSlots['distortion-world']).toEqual([['giratina', 47, 1]])
    expect(sinnohLegendSlots['spear-pillar']).toEqual([['dialga', 70, 1], ['palkia', 70, 1]])
    expect(sinnohLegendSlots['snowpoint-temple']).toEqual([['regigigas', 1, 1]])
    const rare = Object.values(sinnohLegendSlots).flatMap(slots => slots ?? [])
    const ordinary = Object.values(sinnohEncounterSlots).flatMap(slots => slots ?? [])
    const ids = new Set(ordinary.map(([id]) => id))
    expect(ids.size).toBe(129)
    expect(new Set(rare.map(([id]) => id)).size).toBe(12)
    for (const [id] of rare) expect(ids.has(id)).toBe(false)
    for (const [id, level, weight] of [...ordinary, ...rare]) {
      expect(species[id]?.pokedexNumber).toBeLessThanOrEqual(493)
      expect(Number.isInteger(level) && level > 0 && level <= 100).toBe(true)
      expect(Number.isFinite(weight) && weight > 0).toBe(true)
    }
  })
})
