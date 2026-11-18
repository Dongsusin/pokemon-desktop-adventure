import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { KANTO_START_LOCATION_ID, kantoLocationById, kantoLocations } from '../src/game/regions/kanto'

function pngSize(file: string) {
  const bytes = readFileSync(file)
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('Kanto Town Map', () => {
  it('matches the original map coordinates, linked destinations and each area image', () => {
    expect(pngSize('assets/maps/kanto/town-map.png')).toEqual({ width: 160, height: 144 })
    expect(kantoLocations).toHaveLength(51)
    expect(kantoLocationById[KANTO_START_LOCATION_ID]).toMatchObject({ x: 36, y: 100 })
    const ids = new Set(kantoLocations.map(location => location.id))
    expect(ids.size).toBe(51)
    expect(readdirSync('assets/maps/kanto/areas').filter(file => file.endsWith('.png')).sort())
      .toEqual([...ids].map(id => id + '.png').sort())
    for (const location of kantoLocations) {
      expect(location.x).toBeGreaterThan(0)
      expect(location.x).toBeLessThan(160)
      expect(location.y).toBeGreaterThan(0)
      expect(location.y).toBeLessThan(144)
      expect(location.links.every(link => ids.has(link))).toBe(true)
      const size = pngSize('assets/maps/kanto/areas/' + location.id + '.png')
      expect(size.width).toBeGreaterThan(0)
      expect(size.height).toBeGreaterThan(0)
    }
    expect(kantoLocations.filter(location => location.gym)).toHaveLength(8)
    expect(Array.from({ length: 25 }, (_, i) => kantoLocationById['route-' + (i + 1)]?.kind))
      .toEqual(Array(25).fill('route'))
  })

  it('keeps ordinary encounters in Kanto and legendary Pokémon at their original sites', () => {
    const reserved = new Set(['articuno', 'zapdos', 'moltres', 'mewtwo', 'mew'])
    const legends = []
    for (const location of kantoLocations) {
      for (const slot of location.encounters) {
        expect(species[slot.speciesId]?.pokedexNumber).toBeLessThanOrEqual(151)
        expect(reserved.has(slot.speciesId)).toBe(false)
        expect(slot.weight).toBeGreaterThan(0)
        expect(slot.level).toBeGreaterThan(0)
      }
      legends.push(...(location.legends ?? []).map(slot => [location.id, slot.speciesId, slot.level].join(':')))
    }
    expect(legends.sort()).toEqual([
      'cerulean-cave:mewtwo:70',
      'power-plant:zapdos:50',
      'seafoam-islands:articuno:50',
      'victory-road:moltres:50',
    ])
    expect(kantoLocationById[KANTO_START_LOCATION_ID].encounters).toHaveLength(0)
    expect(new Set(kantoLocationById['route-1'].encounters.map(slot => slot.speciesId)))
      .toEqual(new Set(['pidgey', 'rattata']))
  })
})
