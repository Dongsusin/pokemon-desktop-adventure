import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { hoennEncounterSlots, hoennLegendSlots } from '../src/game/regions/hoenn-encounters'
import {
  HOENN_LEAGUE_LOCATION_ID, HOENN_MAP_HEIGHT, HOENN_MAP_WIDTH, HOENN_START_LOCATION_ID,
  hoennLocationById, hoennLocations,
} from '../src/game/regions/hoenn'
import { johtoLocationById } from '../src/game/regions/johto'
import { kantoLocationById } from '../src/game/regions/kanto'

describe('Emerald PokéNav geography', () => {
  it('places the field and league pins inside the native map raster', () => {
    const map = readFileSync('assets/maps/hoenn/town-map.png')
    expect([map.readUInt32BE(16), map.readUInt32BE(20)]).toEqual([HOENN_MAP_WIDTH, HOENN_MAP_HEIGHT])
    expect(hoennLocationById[HOENN_START_LOCATION_ID]).toMatchObject({ x: 44, y: 108, kind: 'town' })
    expect(hoennLocationById['route-101']).toMatchObject({ x: 44, y: 100 })
    expect(new Set(hoennLocationById['route-101'].links)).toEqual(new Set(['oldale-town', 'littleroot-town']))
    expect(hoennLocationById[HOENN_LEAGUE_LOCATION_ID]).toMatchObject({ x: 228, y: 84, kind: 'league' })
    for (const { id, x, y } of hoennLocations) {
      expect(x).toBeGreaterThan(0)
      expect(y).toBeGreaterThan(0)
      expect(x).toBeLessThan(HOENN_MAP_WIDTH)
      expect(y).toBeLessThan(HOENN_MAP_HEIGHT)
      expect(kantoLocationById[id]).toBeUndefined()
      expect(johtoLocationById[id]).toBeUndefined()
    }
  })

  it('connects every road, encounter area and landmark to Littleroot', () => {
    const reached = new Set([HOENN_START_LOCATION_ID])
    for (const id of reached) {
      for (const neighbor of hoennLocationById[id].links) {
        expect(hoennLocationById[neighbor]?.links).toContain(id)
        reached.add(neighbor)
      }
    }
    expect(reached.size).toBe(hoennLocations.length)
    expect(hoennLocations).toHaveLength(84)
    for (let number = 101; number <= 134; number++) {
      const route = hoennLocationById['route-' + number]
      expect(route.kind).toBe('route')
      expect(route.encounters.length).toBeGreaterThan(0)
    }
    for (const id of Object.keys(hoennEncounterSlots)) expect(hoennLocationById[id].encounters.length).toBeGreaterThan(0)
    for (const id of Object.keys(hoennLegendSlots)) expect(hoennLocationById[id].legends?.length).toBeGreaterThan(0)
  })
})
