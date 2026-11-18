import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { paldeaEncounterSlots, paldeaLegendSlots, paldeaWildForms } from '../src/game/regions/paldea-encounters'
import { paldeaLocationById } from '../src/game/regions/paldea'

function levels(area: string, speciesId: string) {
  return [...new Set((paldeaEncounterSlots[area] ?? []).filter(([id]) => id === speciesId).map(([, level]) => level))].sort((a, b) => a - b)
}

const treasures = {
  'grasswither-shrine': 'wo-chien',
  'icerend-shrine': 'chien-pao',
  'groundblight-shrine': 'ting-lu',
  'firescourge-shrine': 'chi-yu',
}

const paradox = ['great-tusk', 'scream-tail', 'brute-bonnet', 'flutter-mane', 'slither-wing', 'sandy-shocks', 'roaring-moon']

describe('Pokémon Scarlet mainland encounters', () => {
  it('provides catalogued species and finite positive odds at the selectable habitats', () => {
    const regions = { south: ['one', 'two', 'three', 'four', 'five', 'six'], west: ['one', 'two', 'three'], east: ['one', 'two', 'three'], north: ['one', 'two', 'three'] }
    for (const [direction, numbers] of Object.entries(regions)) {
      for (const number of numbers) expect(paldeaEncounterSlots[direction + '-province-area-' + number]?.length).toBeGreaterThan(0)
      expect(paldeaEncounterSlots[direction + '-paldean-sea']?.length).toBeGreaterThan(0)
    }
    const all = new Set<string>()
    for (const [id, entries] of Object.entries(paldeaEncounterSlots)) {
      expect(paldeaLocationById[id]).toBeDefined()
      for (const [mon, level, weight] of entries ?? []) {
        all.add(mon)
        if (!species[mon] || !Number.isInteger(level) || level < 1 || level > 100 || !Number.isFinite(weight) || weight <= 0) {
          throw new Error('Invalid encounter in ' + id + ': ' + JSON.stringify([mon, level, weight]))
        }
      }
    }
    for (const id of ['lechonk', 'wooper', 'tauros', 'tatsugiri', 'stonjourner', ...paradox]) expect(all.has(id)).toBe(true)
    for (const id of ['eiscue', 'dreepy', 'bagon', 'passimian', 'iron-treads', 'iron-bundle', 'iron-hands', 'iron-jugulis', 'iron-moth', 'iron-thorns', 'iron-valiant', 'walking-wake', 'iron-leaves', 'ogerpon', 'miraidon', 'koraidon', ...Object.values(treasures)]) {
      expect(all.has(id)).toBe(false)
    }
  })

  it('retains original level ranges at Poco Path and the East Province and keeps Area Zero residents inside the crater', () => {
    expect(levels('poco-path', 'lechonk')).toEqual([2, 3, 4])
    expect(levels('poco-path', 'pawmi')).toEqual([2, 3, 4])
    expect(levels('south-province-area-one', 'wooper')).toEqual([5, 6, 7, 8])
    expect(levels('east-province-area-two', 'tauros')).toEqual([22, 23, 24, 25, 26])
    for (const id of paradox) {
      const sites = Object.entries(paldeaEncounterSlots).filter(([, rows]) => rows?.some(([mon]) => mon === id))
      expect(sites.length).toBeGreaterThan(0)
      expect(sites.every(([key]) => paldeaLocationById[key].afterFinale)).toBe(true)
    }
    expect(levels('area-zero-cavern', 'roaring-moon').length).toBeGreaterThan(0)
    expect(levels('area-zero-cavern', 'roaring-moon').every(level => level >= 52 && level <= 60)).toBe(true)
  })

  it('allows Scarlet Blaze Breed only in its level range and represents different Tatsugiri forms at the lake', () => {
    const coast = 'east-province-area-two'
    const below = paldeaWildForms(coast, 'tauros', 24) ?? []
    expect(below.some(row => row.formId === 'tauros-paldea-blaze-breed')).toBe(false)
    const above = paldeaWildForms(coast, 'tauros', 25) ?? []
    const combat = above.find(row => row.formId === 'tauros-paldea-combat-breed')
    const blaze = above.find(row => row.formId === 'tauros-paldea-blaze-breed')
    expect(combat?.weight).toBeGreaterThan(0)
    expect(blaze?.weight).toBeGreaterThan(0)
    expect(combat!.weight).toBeGreaterThan(blaze!.weight)
    expect(above.some(row => row.formId === 'tauros-paldea-aqua-breed')).toBe(false)
    const lake = paldeaWildForms('casseroya-lake', 'tatsugiri', 52) ?? []
    expect(new Set(lake.map(row => row.formId))).toEqual(new Set([undefined, 'tatsugiri-droopy', 'tatsugiri-stretchy']))
  })

  it('separates the five fixed legendary Pokémon from the ordinary encounter pools and enforces the local unlocks', () => {
    for (const [location, speciesId] of Object.entries(treasures)) {
      const legend = paldeaLegendSlots[location]
      expect(legend).toHaveLength(1)
      expect(legend![0]).toMatchObject({ speciesId, level: 60, minBadges: 8 })
      expect(paldeaLocationById[location].afterFinale).toBeFalsy()
    }
    expect(paldeaLegendSlots['zero-lab']).toHaveLength(1)
    expect(paldeaLegendSlots['zero-lab']![0]).toMatchObject({ speciesId: 'koraidon', level: 72, championOnly: true })
    expect(paldeaLocationById['zero-lab'].afterFinale).toBe(true)
    expect(Object.keys(paldeaLegendSlots).sort()).toEqual([...Object.keys(treasures), 'zero-lab'].sort())
  })
})
