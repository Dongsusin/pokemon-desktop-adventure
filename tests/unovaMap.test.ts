import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { kantoLocationById } from '../src/game/regions/kanto'
import { johtoLocationById } from '../src/game/regions/johto'
import { hoennLocationById } from '../src/game/regions/hoenn'
import { sinnohLocationById } from '../src/game/regions/sinnoh'
import { unovaEncounterSlots, unovaLegendSlots } from '../src/game/regions/unova-encounters'
import {
  UNOVA_START_LOCATION_ID, UNOVA_LEAGUE_LOCATION_ID, UNOVA_MAP_WIDTH, UNOVA_MAP_HEIGHT,
  unovaLocations, unovaLocationById,
} from '../src/game/regions/unova'

describe('Black 2 Town Map', () => {
  it('registers original cursor coordinates, Black 2 routes and unique global IDs', () => {
    const bitmap = readFileSync('assets/maps/unova/town-map.png')
    expect([bitmap.readUInt32BE(16), bitmap.readUInt32BE(20)]).toEqual([UNOVA_MAP_WIDTH, UNOVA_MAP_HEIGHT])
    expect(unovaLocationById[UNOVA_START_LOCATION_ID]).toMatchObject({ name: '부채시티', x: 14, y: 153 })
    expect(unovaLocationById['unova-route-19']).toMatchObject({ name: '19번도로', x: 12, y: 135 })
    expect(unovaLocationById[UNOVA_LEAGUE_LOCATION_ID]).toMatchObject({ kind: 'league', x: 170, y: 15 })
    for (let number = 1; number <= 23; number++) {
      const route = unovaLocationById['unova-route-' + number]
      if (number === 10) expect(route).toBeUndefined()
      else {
        expect(route.kind).toBe('route')
        expect(route.encounters.length).toBeGreaterThan(0)
      }
    }
    expect(unovaLocationById['white-forest']).toBeUndefined()
    expect(unovaLocationById['black-city']).toBeDefined()
    for (const { id, x, y } of unovaLocations) {
      expect(x).toBeGreaterThan(0)
      expect(y).toBeGreaterThan(0)
      expect(x).toBeLessThan(UNOVA_MAP_WIDTH)
      expect(y).toBeLessThan(UNOVA_MAP_HEIGHT)
      for (const region of [kantoLocationById, johtoLocationById, hoennLocationById, sinnohLocationById]) {
        expect(region[id]).toBeUndefined()
      }
    }
  })

  it('links every Black 2 landmark and encounter table to Aspertia', () => {
    const reached = new Set([UNOVA_START_LOCATION_ID])
    for (const id of reached) {
      for (const neighbor of unovaLocationById[id].links) {
        expect(unovaLocationById[neighbor]?.links).toContain(id)
        reached.add(neighbor)
      }
    }
    expect(unovaLocations).toHaveLength(93)
    expect(reached.size).toBe(unovaLocations.length)
    for (const id of Object.keys(unovaEncounterSlots)) expect(unovaLocationById[id]?.encounters.length).toBeGreaterThan(0)
    for (const id of Object.keys(unovaLegendSlots)) expect(unovaLocationById[id]?.legends?.length).toBeGreaterThan(0)
  })
})
