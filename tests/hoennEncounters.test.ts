import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { hoennEncounterSlots, hoennLegendSlots } from '../src/game/regions/hoenn-encounters'

describe('Emerald wild encounters', () => {
  it('retains Route 101 slots, the underwater level roll and Mirage Island grass', () => {
    const firstRoute = hoennEncounterSlots['route-101'] ?? []
    const total = (id: string) => firstRoute.filter(([speciesId]) => speciesId === id)
      .reduce((sum, [, , weight]) => sum + weight, 0)
    expect([total('wurmple'), total('poochyena'), total('zigzagoon')]).toEqual([900, 900, 200])
    expect([...new Set(firstRoute.map(([, level]) => level))].sort()).toEqual([2, 3])

    const relicanth = hoennEncounterSlots['underwater-route-124']?.filter(([id]) => id === 'relicanth')
    expect(relicanth?.map(([, level]) => level)).toEqual([30, 31, 32, 33, 34, 35])
    expect(relicanth?.reduce((sum, [, , weight]) => sum + weight, 0)).toBeCloseTo(20)
    const island = hoennEncounterSlots['mirage-island'] ?? []
    expect([...new Set(island.map(([id]) => id))]).toEqual(['wynaut'])
    expect(hoennEncounterSlots['route-130']?.some(([id]) => id === 'wynaut')).toBe(false)
    expect([...new Set(hoennEncounterSlots['altering-cave']?.map(([id]) => id))]).toEqual(['zubat'])
  })

  it('covers every numbered route and keeps stationary legendaries in their own pools', () => {
    for (let route = 101; route <= 134; route++) {
      expect(hoennEncounterSlots['route-' + route]?.length).toBeGreaterThan(0)
    }

    expect(hoennLegendSlots).toEqual({
      'ancient-tomb': [['registeel', 40, 1]],
      'desert-ruins': [['regirock', 40, 1]],
      'island-cave': [['regice', 40, 1]],
      'marine-cave': [['kyogre', 70, 1]],
      'terra-cave': [['groudon', 70, 1]],
      'sky-pillar': [['rayquaza', 70, 1]],
    })
    const legends = new Set(Object.values(hoennLegendSlots).flatMap(slots => slots?.map(([id]) => id) ?? []))
    const ordinary = new Set<string>()
    for (const slots of Object.values(hoennEncounterSlots)) {
      for (const [id, level, weight] of slots ?? []) {
        ordinary.add(id)
        expect(level).toBeGreaterThan(0)
        expect(weight).toBeGreaterThan(0)
      }
    }
    expect(ordinary.size).toBe(116)
    for (const id of ordinary) {
      expect(species[id]?.pokedexNumber).toBeLessThanOrEqual(386)
      expect(legends.has(id)).toBe(false)
    }
  })
})
