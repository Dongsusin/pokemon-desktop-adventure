import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { kantoLocationById } from '../src/game/regions/kanto'
import { johtoLocationById } from '../src/game/regions/johto'
import { hoennLocationById } from '../src/game/regions/hoenn'
import { sinnohLocationById } from '../src/game/regions/sinnoh'
import { unovaLocationById } from '../src/game/regions/unova'
import { kalosEncounterSlots, kalosLegendSlots } from '../src/game/regions/kalos-encounters'
import {
  KALOS_LEAGUE_LOCATION_ID, KALOS_MAP_HEIGHT, KALOS_MAP_WIDTH, KALOS_START_LOCATION_ID,
  kalosLocationById, kalosLocations,
} from '../src/game/regions/kalos'

describe('Pokémon X Town Map', () => {
  it('places all 22 routes and distinct Kalos destinations on the original map', () => {
    const image = readFileSync('assets/maps/kalos/town-map.png')
    expect([image.readUInt32BE(16), image.readUInt32BE(20)]).toEqual([KALOS_MAP_WIDTH, KALOS_MAP_HEIGHT])
    expect(kalosLocationById[KALOS_START_LOCATION_ID]).toMatchObject({ name: '조아마을', x: 212, y: 180 })
    expect(kalosLocationById['lumiose-city']).toMatchObject({ name: '미르시티', x: 166, y: 78 })
    expect(kalosLocationById['frost-cavern']).toMatchObject({ name: '프로스트케이브', x: 231, y: 48 })
    expect(kalosLocationById[KALOS_LEAGUE_LOCATION_ID]).toMatchObject({ kind: 'league', x: 234, y: 92 })
    for (let number = 1; number <= 22; number++) {
      const route = kalosLocationById['kalos-route-' + number]
      expect(route.kind).toBe('route')
      expect(route.name).toBe(number + '번도로')
      if (number === 1) expect(route.encounters).toHaveLength(0)
      else expect(route.encounters.length).toBeGreaterThan(0)
    }

    const earlierMaps = [kantoLocationById, johtoLocationById, hoennLocationById, sinnohLocationById, unovaLocationById]
    for (const { id, x, y } of kalosLocations) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(KALOS_MAP_WIDTH)
      expect(y).toBeLessThan(KALOS_MAP_HEIGHT)
      for (const map of earlierMaps) expect(map[id]).toBeUndefined()
    }
  })

  it('connects each encounter area and every location to Vaniville, including rail and cave entrances', () => {
    const seen = new Set([KALOS_START_LOCATION_ID])
    for (const id of seen) {
      for (const neighbor of kalosLocationById[id].links) {
        expect(kalosLocationById[neighbor]?.links).toContain(id)
        seen.add(neighbor)
      }
    }
    expect(kalosLocations).toHaveLength(63)
    expect(seen.size).toBe(kalosLocations.length)
    expect(kalosLocationById['kiloude-city'].links).toContain('lumiose-city')
    expect(kalosLocationById['unknown-dungeon'].links).toContain('pokemon-village')
    expect(kalosLocationById['connecting-cave'].links).toEqual(expect.arrayContaining(['kalos-route-7', 'kalos-route-8', 'cyllage-city']))
    for (const id of Object.keys(kalosEncounterSlots)) expect(kalosLocationById[id]?.encounters.length).toBeGreaterThan(0)
    for (const id of Object.keys(kalosLegendSlots)) expect(kalosLocationById[id]?.legends?.length).toBeGreaterThan(0)
  })
})
