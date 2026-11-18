import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { kantoLocationById } from '../src/game/regions/kanto'
import {
  JOHTO_LEAGUE_LOCATION_ID,
  JOHTO_MAP_HEIGHT,
  JOHTO_MAP_WIDTH,
  JOHTO_START_LOCATION_ID,
  johtoLocationById,
  johtoLocations,
  johtoRegion,
} from '../src/game/regions/johto'

describe('Johto Pokégear map', () => {
  it('uses the native Gold map coordinates and includes a connected league approach', () => {
    const map = readFileSync('assets/maps/johto/town-map.png')
    expect(map.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    expect(map.readUInt32BE(16)).toBe(JOHTO_MAP_WIDTH)
    expect(map.readUInt32BE(20)).toBe(JOHTO_MAP_HEIGHT)
    expect(johtoLocationById[JOHTO_START_LOCATION_ID]).toMatchObject({ x: 140, y: 100, kind: 'town' })
    expect(johtoLocationById[JOHTO_LEAGUE_LOCATION_ID]).toMatchObject({ x: 188, y: 36, kind: 'league' })
    expect(johtoLocationById['tohjo-falls']).toMatchObject({ x: 172, y: 100 })
    expect(johtoRegion.gymLocationIds).toHaveLength(8)

    const ids = new Set(johtoLocations.map(location => location.id))
    expect(ids.size).toBe(52)
    expect(johtoLocations).toHaveLength(ids.size)
    for (const location of johtoLocations) {
      expect(kantoLocationById[location.id]).toBeUndefined()
      expect(location.x).toBeGreaterThan(0)
      expect(location.x).toBeLessThan(JOHTO_MAP_WIDTH)
      expect(location.y).toBeGreaterThan(0)
      expect(location.y).toBeLessThan(JOHTO_MAP_HEIGHT)
      for (const link of location.links) {
        expect(johtoLocationById[link]?.links).toContain(location.id)
      }
    }

    const reached = new Set([JOHTO_START_LOCATION_ID])
    // Sets iterate over newly added entries, so this follows the links from the start.
    for (const id of reached) {
      for (const link of johtoLocationById[id].links) reached.add(link)
    }
    expect(reached).toEqual(ids)
  })

  it('keeps native time-specific species, Surf levels and the two stationary legends', () => {
    for (let number = 29; number <= 46; number++) {
      const route = johtoLocationById['route-' + number]
      expect(route.kind).toBe('route')
      expect(route.encounters.length).toBeGreaterThan(0)
    }
    for (const { encounters } of johtoLocations) {
      for (const { speciesId, level, weight } of encounters) {
        expect(species[speciesId]?.pokedexNumber).toBeLessThanOrEqual(251)
        expect(level).toBeGreaterThan(0)
        expect(weight).toBeGreaterThan(0)
        expect(['ho-oh', 'lugia']).not.toContain(speciesId)
      }
    }
    expect(johtoLocationById['route-29'].encounters).toEqual(expect.arrayContaining([
      { speciesId: 'sentret', level: 3, weight: 600 },
      { speciesId: 'hoothoot', level: 3, weight: 500 },
    ]))
    expect(johtoLocationById['route-40'].encounters).toEqual([
      { speciesId: 'tentacool', level: 15, weight: 540 },
      { speciesId: 'tentacool', level: 20, weight: 1080 },
      { speciesId: 'tentacruel', level: 20, weight: 180 },
    ])
    expect(johtoLocationById['tin-tower'].legends).toEqual([{ speciesId: 'ho-oh', level: 40, weight: 1 }])
    expect(johtoLocationById['whirl-islands'].legends).toEqual([{ speciesId: 'lugia', level: 70, weight: 1 }])
    expect(johtoLocations.filter(location => location.legends)).toHaveLength(2)
  })
})
