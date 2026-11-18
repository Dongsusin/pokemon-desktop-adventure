import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { alolaEncounterSlots, alolaLegendSlots } from '../src/game/regions/alola-encounters'

function probability(place: string, speciesId: string, level?: number) {
  const slots = alolaEncounterSlots[place]!
  const total = slots.reduce((sum, [, , weight]) => sum + weight, 0)
  return slots.reduce((sum, [id, lv, weight]) =>
    sum + (id === speciesId && (level === undefined || level === lv) ? weight / total : 0), 0)
}

describe('Pokémon Sun wild encounters', () => {
  it('preserves local levels, time variants and terrain-specific slot weights', () => {
    expect(probability('alola-route-1', 'yungoos')).toBeCloseTo(0.15)
    expect(probability('alola-route-1', 'rattata')).toBeCloseTo(0.15)
    expect(probability('alola-route-1', 'pikipek', 2)).toBeCloseTo(0.05)
    expect(probability('trainers-school', 'magnemite', 7)).toBeCloseTo(0.50 / 3)
    expect(probability('verdant-cavern', 'zubat')).toBeCloseTo(0.70)
    expect(probability('alola-route-13', 'bruxish')).toBeCloseTo(0.01)
    expect(probability('melemele-meadow', 'oricorio')).toBeCloseTo(0.20)
    expect(probability('abandoned-thrifty-megamart', 'mimikyu')).toBeCloseTo(0.05)
    expect(probability('alola-berry-fields', 'crabrawler')).toBe(1)
    expect(probability('ten-carat-hill', 'meowth')).toBe(0)
    expect(probability('alola-route-2', 'ekans')).toBe(0)
    expect(probability('mount-lanakila', 'golbat', 42)).toBe(0)
    expect(probability('mount-lanakila', 'golbat', 48)).toBeGreaterThan(0)
  })

  it('covers all 17 routes, keeps Sun exclusives, and excludes SOS-only and rare species from ordinary walks', () => {
    for (let route = 1; route <= 17; route++) {
      expect(alolaEncounterSlots['alola-route-' + route]?.length).toBeGreaterThan(0)
    }
    const ordinary = Object.values(alolaEncounterSlots).flatMap(slots => slots ?? [])
    const ids = new Set(ordinary.map(([id]) => id))
    expect(Object.keys(alolaEncounterSlots)).toHaveLength(59)
    expect(ids.size).toBe(148)
    for (const [id, level, weight] of ordinary) {
      expect(species[id]?.pokedexNumber).toBeLessThanOrEqual(802)
      expect(Number.isInteger(level) && level >= 2 && level <= 100 && Number.isFinite(weight) && weight > 0).toBe(true)
    }
    for (const id of ['cottonee', 'passimian', 'turtonator', 'vulpix']) expect(ids.has(id)).toBe(true)
    for (const id of ['petilil', 'oranguru', 'drampa', 'sandshrew', 'mareanie', 'kommo-o']) expect(ids.has(id)).toBe(false)
    for (const slot of Object.values(alolaLegendSlots).flatMap(slots => slots ?? [])) {
      expect(ids.has(slot.speciesId)).toBe(false)
    }
  })

  it('reserves the original Sun mascot, four island guardians and Sun Ultra Beasts for their native places', () => {
    expect(alolaLegendSlots['altar-of-the-sunne']).toEqual([{ speciesId: 'solgaleo', level: 55, weight: 1 }])
    const expected = [
      ['ruins-of-conflict', 'tapu-koko', 60], ['ruins-of-life', 'tapu-lele', 60],
      ['ruins-of-abundance', 'tapu-bulu', 60], ['ruins-of-hope', 'tapu-fini', 60],
      ['ten-carat-hill', 'necrozma', 75], ['melemele-meadow', 'buzzwole', 65],
      ['wela-volcano-park', 'nihilego', 55], ['digletts-tunnel', 'nihilego', 55],
      ['memorial-hill', 'xurkitree', 65], ['lush-jungle', 'xurkitree', 65],
      ['malie-garden', 'kartana', 60], ['alola-route-17', 'kartana', 60],
      ['resolution-cave', 'guzzlord', 70],
    ] as const
    for (const [place, speciesId, level] of expected) {
      expect(alolaLegendSlots[place]).toEqual([{ speciesId, level, weight: 1, championOnly: true }])
      expect(species[speciesId]).toBeDefined()
    }
    expect(Object.keys(alolaLegendSlots)).toHaveLength(expected.length + 1)
  })
})
