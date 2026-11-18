import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { kalosEncounterSlots, kalosLegendSlots } from '../src/game/regions/kalos-encounters'

function probability(place: string, speciesId: string, level?: number) {
  const slots = kalosEncounterSlots[place]!
  const total = slots.reduce((sum, [, , weight]) => sum + weight, 0)
  return slots.reduce((sum, [id, lv, weight]) =>
    sum + (id === speciesId && (level === undefined || lv === level) ? weight / total : 0), 0)
}

describe('Pokémon X wild encounters', () => {
  it('applies native slot weights and levels across grass, flowers, rough ground and Surf', () => {
    expect(kalosEncounterSlots['kalos-route-1']).toBeUndefined()
    for (let route = 2; route <= 22; route++) {
      expect(kalosEncounterSlots['kalos-route-' + route]?.length).toBeGreaterThan(0)
    }

    expect(probability('kalos-route-2', 'bunnelby')).toBeCloseTo(0.20)
    expect(probability('kalos-route-2', 'weedle', 4)).toBeCloseTo(0.01)
    expect(probability('kalos-route-4', 'flabebe')).toBeCloseTo(0.35)
    expect(probability('kalos-route-13', 'gible', 28)).toBeCloseTo(0.01)
    expect(probability('kalos-route-10', 'houndour')).toBeGreaterThan(0)
    expect(probability('kalos-route-10', 'electrike')).toBe(0)
    expect(probability('azure-bay', 'lapras', 27)).toBeCloseTo(0.005)
    expect(probability('kalos-victory-road', 'lombre', 57)).toBeCloseTo(0.125 / 3)
  })

  it('covers all 18 Friend Safari types with native level 30 candidates', () => {
    const safari = kalosEncounterSlots['friend-safari']!
    expect(new Set(safari.map(([id]) => id)).size).toBe(189)
    expect(safari.every(([, level]) => level === 30)).toBe(true)
    // One Normal Safari slot of four candidates, across 18 types and three slots.
    expect(probability('friend-safari', 'aipom')).toBeCloseTo(1 / (18 * 3 * 4), 9)
    const ordinary = Object.values(kalosEncounterSlots).flatMap(slots => slots ?? [])
    expect(Object.keys(kalosEncounterSlots)).toHaveLength(36)
    expect(new Set(ordinary.map(([id]) => id)).size).toBe(279)
    for (const [id, level, weight] of ordinary) {
      expect(species[id]?.pokedexNumber).toBeLessThanOrEqual(721)
      expect(Number.isInteger(level) && level > 0 && level <= 100).toBe(true)
      expect(Number.isFinite(weight) && weight > 0).toBe(true)
    }
  })

  it('records the X-exclusive mascot, postgame encounters and starter-dependent birds', () => {
    expect(kalosLegendSlots['team-flare-secret-hq']).toEqual([
      { speciesId: 'xerneas', level: 50, weight: 1 },
    ])
    expect(kalosLegendSlots['terminus-cave']).toEqual([
      { speciesId: 'zygarde', level: 70, weight: 1, championOnly: true },
    ])
    expect(kalosLegendSlots['unknown-dungeon']).toEqual([
      { speciesId: 'mewtwo', level: 70, weight: 1, championOnly: true },
    ])
    const birds = kalosLegendSlots['sea-spirits-den']!
    expect(birds.map(({ speciesId, starterType }) => [speciesId, starterType])).toEqual([
      ['articuno', 'grass'], ['zapdos', 'fire'], ['moltres', 'water'],
    ])
    expect(birds.every(slot => slot.level === 70 && slot.championOnly && slot.weight > 0)).toBe(true)
    const rare = Object.values(kalosLegendSlots).flatMap(slots => slots ?? [])
    expect(new Set(rare.map(slot => slot.speciesId)).size).toBe(6)
    expect(rare.every(slot => species[slot.speciesId])).toBe(true)
  })
})
