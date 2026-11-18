import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { kantoLocations } from '../src/game/regions/kanto'
import {
  KANTO_ILLUSTRATED_MAP_HEIGHT,
  KANTO_ILLUSTRATED_MAP_WIDTH,
  kantoIllustratedPins,
} from '../src/game/regions/kantoIllustratedMap'

describe('illustrated Kanto map', () => {
  it('uses the supplied PNG at its exact size', () => {
    const artwork = readFileSync('assets/maps/kanto/illustrated-map.png')
    expect(createHash('sha256').update(artwork).digest('hex'))
      .toBe('7722915a4c8576c964abf85ab346586b2be111e9ae0b11619ee2e1cc14529796')
    expect(artwork.readUInt32BE(16)).toBe(KANTO_ILLUSTRATED_MAP_WIDTH)
    expect(artwork.readUInt32BE(20)).toBe(KANTO_ILLUSTRATED_MAP_HEIGHT)
  })

  it('places every playable location inside the artwork', () => {
    expect(Object.keys(kantoIllustratedPins).sort()).toEqual(kantoLocations.map(location => location.id).sort())
    for (const { x, y } of Object.values(kantoIllustratedPins)) {
      expect(Number.isInteger(x) && x >= 0 && x < KANTO_ILLUSTRATED_MAP_WIDTH).toBe(true)
      expect(Number.isInteger(y) && y >= 0 && y < KANTO_ILLUSTRATED_MAP_HEIGHT).toBe(true)
    }
  })

  it('keeps rooms within their settlement pin', () => {
    expect(kantoIllustratedPins['pokemon-tower']).toEqual(kantoIllustratedPins['lavender-town'])
    expect(kantoIllustratedPins['silph-co']).toEqual(kantoIllustratedPins['saffron-city'])
    expect(kantoIllustratedPins['rocket-hideout']).toEqual(kantoIllustratedPins['celadon-city'])
    expect(kantoIllustratedPins['pokemon-mansion']).toEqual(kantoIllustratedPins['cinnabar-island'])
  })
})
