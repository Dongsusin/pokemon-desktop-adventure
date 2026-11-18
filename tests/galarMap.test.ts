import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  GALAR_LEAGUE_LOCATION_ID, GALAR_MAP_HEIGHT, GALAR_MAP_WIDTH, GALAR_START_LOCATION_ID,
  galarAreaByLocationId, galarLocationById, galarLocations,
} from '../src/game/regions/galar'
import { galarEncounterSlots, galarLegendSlots, galarWildAreaIds } from '../src/game/regions/galar-encounters'
import { galarGymTrainers } from '../src/game/regions/galarCampaign'
import { worldRegions } from '../src/game/regions/world'

describe('Pokémon Sword mainland Galar map', () => {
  it('uses the complete Sword town map with six navigable districts and ten numbered routes', () => {
    const image = readFileSync('assets/maps/galar/town-map.png')
    expect([image.readUInt32BE(16), image.readUInt32BE(20)]).toEqual([GALAR_MAP_WIDTH, GALAR_MAP_HEIGHT])
    expect(createHash('sha256').update(image).digest('hex')).toBe('d2b9b8c4f7e48822afa3cb672ea2058131e08ebd56f32de3d85a650a4c737685')
    expect(new Set(Object.values(galarAreaByLocationId))).toEqual(new Set([
      '남부 가라르', '와일드에리어 남부', '엔진시티 일대', '와일드에리어 북부', '너클시티 일대', '북부 가라르',
    ]))
    expect(galarLocationById[GALAR_START_LOCATION_ID].name).toBe('펄롱마을')
    expect(galarLocationById[GALAR_LEAGUE_LOCATION_ID]).toMatchObject({ name: '슛스타디움', kind: 'league' })
    for (let number = 1; number <= 10; number++) {
      expect(galarLocationById['galar-route-' + number]).toMatchObject({ name: number + '번도로', kind: 'route' })
    }
    const coordinates = new Set<string>()
    for (const { id, x, y } of galarLocations) {
      expect(galarAreaByLocationId[id]).toBeTruthy()
      expect(x).toBeGreaterThan(0)
      expect(y).toBeGreaterThan(0)
      expect(x).toBeLessThan(GALAR_MAP_WIDTH)
      expect(y).toBeLessThan(GALAR_MAP_HEIGHT)
      coordinates.add(x + ',' + y)
      for (const region of Object.values(worldRegions)) {
        if (region.id !== 'galar') expect(region.locationById[id]).toBeUndefined()
      }
    }
    expect(coordinates.size).toBe(galarLocations.length)
  })

  it('centres the wild habitat and Meetup Spot pins on their original cyan town-map markers', () => {
    // Pixel centres of the 22 × 22 cyan interiors in the pinned Sword PNG, north to south.
    const markers: ReadonlyArray<readonly [string, number, number]> = [
      ['hammerlocke-hills', 1019.5, 2561.5],
      ['lake-of-outrage', 759.5, 2591.5],
      ['giants-mirror', 1051.5, 2701.5],
      ['giants-cap', 833.5, 2701.5],
      ['dusty-bowl', 959.5, 2701.5],
      ['stony-wilderness', 1039.5, 2801.5],
      ['bridge-field', 1069.5, 3046.5],
      ['motostoke-riverbank', 1115.5, 3305.5],
      ['north-lake-miloch', 1129.5, 3501.5],
      ['east-lake-axewell', 909.5, 3531.5],
      ['watchtower-ruins', 699.5, 3534.5],
      ['west-lake-axewell', 660.5, 3695.5],
      ['axews-eye', 824.5, 3711.5],
      ['south-lake-miloch', 1064.5, 3771.5],
      ['giants-seat', 1169.5, 3811.5],
      ['rolling-fields', 769.5, 3891.5],
      ['dappled-grove', 639.5, 3921.5],
      ['meetup-spot', 868.5, 4067.5],
    ]
    expect(new Set(markers.map(([id]) => id))).toEqual(new Set([...galarWildAreaIds, 'meetup-spot']))
    for (const [id, x, y] of markers) {
      expect(galarLocationById[id]).toMatchObject({ x, y })
    }
    // The separate station control sits on the roof of the building above Meetup Spot.
    expect(galarLocationById['wild-area-station']).toMatchObject({ x: 870, y: 3990 })
  })

  it('connects every location by returnable routes, including the rails, lakes and mountain passes', () => {
    const reached = new Set<string>([GALAR_START_LOCATION_ID])
    for (const id of reached) {
      const { links } = galarLocationById[id]
      expect(new Set(links).size).toBe(links.length)
      expect(links).not.toContain(id)
      for (const next of links) {
        expect(galarLocationById[next]?.links).toContain(id)
        reached.add(next)
      }
    }
    expect(reached.size).toBe(62)
    expect(reached.size).toBe(galarLocations.length)
    expect(galarLocationById['galar-route-2-lakeside'].links).toContain('galar-route-2')
    expect(galarLocationById['slumbering-weald-interior'].links).toContain('slumbering-weald')
    expect(galarLocationById['axews-eye'].links).toEqual(['east-lake-axewell'])
    expect(galarLocationById['motostoke-riverbank'].links).toContain('north-lake-miloch')
    expect(galarLocationById['wild-area-station'].links).toContain('wedgehurst-station')
    expect(galarLocationById['white-hill-station'].links).toContain('hammerlocke-station')
    expect(galarLocationById['galar-route-10'].links).toContain('wyndon')
    expect(galarLocationById['outer-spikemuth'].links).toContain('route-9-tunnel')
    expect(galarLocationById['energy-plant'].links).toContain('hammerlocke')
  })

  it('pins eight gym challenges and all sourced Sword encounters to playable map locations', () => {
    expect(galarGymTrainers).toHaveLength(8)
    for (const trainer of galarGymTrainers) {
      expect(galarLocationById[trainer.locationId]?.gym).toMatchObject({ leader: trainer.name, badge: trainer.badge })
    }
    expect(galarWildAreaIds.size).toBe(17)
    for (const id of galarWildAreaIds) {
      expect(galarAreaByLocationId[id]).toMatch(/^와일드에리어 /)
      expect(galarLocationById[id].encounters.length).toBeGreaterThan(0)
    }
    for (const id of Object.keys(galarEncounterSlots)) expect(galarLocationById[id]?.encounters.length).toBeGreaterThan(0)
    for (const id of Object.keys(galarLegendSlots)) expect(galarLocationById[id]?.legends?.length).toBeGreaterThan(0)
  })
})
