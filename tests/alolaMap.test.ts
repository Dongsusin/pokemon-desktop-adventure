import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { alolaEncounterSlots, alolaLegendSlots } from '../src/game/regions/alola-encounters'
import { alolaGymTrainers } from '../src/game/regions/alolaCampaign'
import {
  ALOLA_LEAGUE_LOCATION_ID, ALOLA_MAP_HEIGHT, ALOLA_MAP_WIDTH, ALOLA_START_LOCATION_ID,
  alolaIslandByLocationId, alolaLocationById, alolaLocations,
} from '../src/game/regions/alola'
import { worldRegions } from '../src/game/regions/world'

describe('Pokémon Sun Alola map', () => {
  it('places four islands, Aether Paradise and all seventeen routes on the regional artwork', () => {
    const image = readFileSync('assets/maps/alola/town-map.png')
    expect([image.readUInt32BE(16), image.readUInt32BE(20)]).toEqual([ALOLA_MAP_WIDTH, ALOLA_MAP_HEIGHT])
    expect(new Set(Object.values(alolaIslandByLocationId))).toEqual(
      new Set(['멜레멜레섬', '아칼라섬', '울라울라섬', '포니섬', '에테르파라다이스'])
    )
    expect(alolaLocationById[ALOLA_START_LOCATION_ID].name).toBe('1번도로')
    expect(alolaLocationById[ALOLA_LEAGUE_LOCATION_ID].kind).toBe('league')
    expect(alolaIslandByLocationId[ALOLA_LEAGUE_LOCATION_ID]).toBe('울라울라섬')
    for (let number = 1; number <= 17; number++) {
      const route = alolaLocationById['alola-route-' + number]
      expect(route).toMatchObject({ name: number + (number === 15 ? '번수로' : '번도로'), kind: 'route' })
    }
    for (const { id, x, y } of alolaLocations) {
      expect(alolaIslandByLocationId[id]).toBeTruthy()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(ALOLA_MAP_WIDTH)
      expect(y).toBeLessThan(ALOLA_MAP_HEIGHT)
      for (const region of Object.values(worldRegions)) {
        if (region.id !== 'alola') expect(region.locationById[id]).toBeUndefined()
      }
    }
  })

  it('connects every Sun encounter and challenge, including ferries and the separate Poni trial entrances', () => {
    const reached = new Set([ALOLA_START_LOCATION_ID])
    for (const id of reached) {
      for (const next of alolaLocationById[id].links) {
        expect(alolaLocationById[next]?.links).toContain(id)
        reached.add(next)
      }
    }
    expect(reached.size).toBe(82)
    expect(reached.size).toBe(alolaLocations.length)
    const harbors = ['hauoli-city', 'heahea-city', 'malie-city', 'seafolk-village', 'aether-paradise']
    for (const harbor of harbors) {
      expect(alolaLocationById[harbor].links).toEqual(expect.arrayContaining(harbors.filter(id => id !== harbor)))
    }
    expect(alolaLocationById['vast-poni-canyon-entrance'].links).toContain('vast-poni-canyon')
    expect(alolaLocationById['altar-of-the-sunne'].links).toContain('ultra-space')
    for (const site of alolaGymTrainers) {
      expect(alolaLocationById[site.locationId].gym).toMatchObject({ leader: site.name, badge: site.badge })
    }
    for (const id of Object.keys(alolaEncounterSlots)) expect(alolaLocationById[id]?.encounters.length).toBeGreaterThan(0)
    for (const id of Object.keys(alolaLegendSlots)) expect(alolaLocationById[id]?.legends?.length).toBeGreaterThan(0)
  })
})
