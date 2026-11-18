import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { sinnohEncounterSlots, sinnohLegendSlots } from '../src/game/regions/sinnoh-encounters'
import {
  SINNOH_LEAGUE_LOCATION_ID, SINNOH_MAP_HEIGHT, SINNOH_MAP_WIDTH, SINNOH_START_LOCATION_ID,
  sinnohLocationById, sinnohLocations,
} from '../src/game/regions/sinnoh'
import { hoennLocationById } from '../src/game/regions/hoenn'
import { johtoLocationById } from '../src/game/regions/johto'
import { kantoLocationById } from '../src/game/regions/kanto'

describe('Platinum Town Map geography', () => {
  it('places the field and league pins inside the native map raster', () => {
    const map = readFileSync('assets/maps/sinnoh/town-map.png')
    expect([map.readUInt32BE(16), map.readUInt32BE(20)]).toEqual([SINNOH_MAP_WIDTH, SINNOH_MAP_HEIGHT])
    expect(sinnohLocationById[SINNOH_START_LOCATION_ID]).toMatchObject({ x: 26, y: 155, kind: 'town' })
    expect(sinnohLocationById['route-201']).toMatchObject({ x: 26, y: 148 })
    expect(new Set(sinnohLocationById['route-201'].links)).toEqual(new Set(['twinleaf-town', 'sandgem-town', 'verity-lakefront']))
    expect(sinnohLocationById[SINNOH_LEAGUE_LOCATION_ID]).toMatchObject({ x: 187, y: 85, kind: 'league' })
    for (const { id, x, y } of sinnohLocations) {
      expect(x).toBeGreaterThan(0)
      expect(y).toBeGreaterThan(0)
      expect(x).toBeLessThan(SINNOH_MAP_WIDTH)
      expect(y).toBeLessThan(SINNOH_MAP_HEIGHT)
      expect(kantoLocationById[id]).toBeUndefined()
      expect(johtoLocationById[id]).toBeUndefined()
      expect(hoennLocationById[id]).toBeUndefined()
    }
  })

  it('connects every road, encounter area and landmark to Twinleaf', () => {
    const reached = new Set([SINNOH_START_LOCATION_ID])
    for (const id of reached) {
      for (const neighbor of sinnohLocationById[id].links) {
        expect(sinnohLocationById[neighbor]?.links).toContain(id)
        reached.add(neighbor)
      }
    }
    expect(reached.size).toBe(sinnohLocations.length)
    expect(sinnohLocations).toHaveLength(90)
    for (let number = 201; number <= 230; number++) {
      const route = sinnohLocationById['route-' + number]
      expect(route.kind).toBe('route')
      expect(route.encounters.length).toBeGreaterThan(0)
    }
    for (const id of Object.keys(sinnohEncounterSlots)) expect(sinnohLocationById[id].encounters.length).toBeGreaterThan(0)
    for (const id of Object.keys(sinnohLegendSlots)) expect(sinnohLocationById[id].legends?.length).toBeGreaterThan(0)
  })
})
