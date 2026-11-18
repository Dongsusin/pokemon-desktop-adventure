import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { galarEncounterSlots, galarLegendSlots, galarWildAreaIds, getGalarWeatherEncounters, isGalarWildEncounter } from '../src/game/regions/galar-encounters'

function percent(area: string, speciesId: string, level?: number) {
  return galarEncounterSlots[area]!.reduce((sum, [id, lv, weight]) =>
    sum + (id === speciesId && (level === undefined || level === lv) ? weight : 0), 0)
}

describe('Pokémon Sword mainland wild encounters', () => {
  it('covers all ten roads and seventeen Wild Area zones with catalogued, possible encounters', () => {
    expect(Object.keys(galarEncounterSlots)).toHaveLength(40)
    expect(galarWildAreaIds.size).toBe(17)
    for (let i = 1; i <= 10; i++) expect(galarEncounterSlots['galar-route-' + i]?.length).toBeGreaterThan(0)
    const ids = new Set<string>()
    for (const slots of Object.values(galarEncounterSlots)) {
      expect(slots!.reduce((sum, [, , weight]) => sum + weight, 0)).toBeCloseTo(100, 8)
      for (const [id, level, weight] of slots!) {
        ids.add(id)
        expect(species[id]?.pokedexNumber).toBeGreaterThan(0)
        expect(Number.isInteger(level) && level >= 2 && level <= 100 && Number.isFinite(weight) && weight > 0).toBe(true)
      }
    }
    expect(ids.size).toBe(313)
    for (const id of ['farfetchd', 'deino', 'jangmo-o', 'darumaka', 'solrock', 'cherubi']) expect(ids.has(id)).toBe(true)
    for (const id of ['goomy', 'lunatone', 'ponyta', 'zamazenta', 'zacian', 'eternatus', 'zapdos', 'kubfu']) expect(ids.has(id)).toBe(false)
  })

  it('weights each method and level, and keeps high-level walks in their native subareas', () => {
    expect(percent('galar-route-1', 'skwovet')).toBeCloseTo(45)
    expect(percent('galar-route-1', 'skwovet', 2)).toBeCloseTo(5)
    expect(percent('galar-route-1', 'wooloo', 6)).toBeCloseTo(1.875)
    expect(percent('galar-route-2', 'lapras')).toBe(0)
    expect(percent('galar-route-2-lakeside', 'lapras', 55)).toBeCloseTo(5 / 3)
    expect(percent('galar-route-2-lakeside', 'feebas')).toBeCloseTo(0.95 / 4)
    expect(Math.max(...galarEncounterSlots['slumbering-weald']!.map(([, level]) => level))).toBe(3)
    expect(percent('slumbering-weald-interior', 'stunfisk', 48)).toBe(5)
    expect(percent('steamdrift-way', 'snom')).toBe(40)
    expect(percent('galar-route-8', 'snom')).toBe(0)
    expect(percent('galar-route-9', 'glalie', 55)).toBe(5)
    expect(percent('circhester-bay', 'grapploct', 50)).toBe(5)
    expect(percent('outer-spikemuth', 'toxapex')).toBe(0)
    expect(percent('glimwood-tangle', 'impidimp', 31)).toBe(2.5)
    expect(percent('turffield', 'crawdaunt', 50)).toBe(100)
    expect(getGalarWeatherEncounters('galar-route-2', new Date(2026, 5, 1), 3, false)).toBeUndefined()
  })

  it('uses real weather pools, applies weather unlocks, and preserves the Champion level floor', () => {
    const lake = 'lake-of-outrage'
    const autumnRain = getGalarWeatherEncounters(lake, new Date(2026, 9, 1, 0), 3, false)!
    expect(autumnRain.weather).toBe('비')
    expect(autumnRain.encounters.some(s => s.speciesId === 'vaporeon' && s.level === 56)).toBe(true)
    expect(autumnRain.encounters.some(s => s.speciesId === 'flareon')).toBe(false)
    expect(getGalarWeatherEncounters(lake, new Date(2026, 9, 1, 23, 59), 3, false)).toBe(autumnRain)
    const june = new Date(2026, 5, 1)
    const february = new Date(2026, 1, 1)
    const april = new Date(2026, 3, 1)
    expect(getGalarWeatherEncounters(lake, june, 8, false)!.weather).toBe('맑음')
    expect(getGalarWeatherEncounters(lake, february, 2, false)!.weather).toBe('눈')
    expect(getGalarWeatherEncounters(lake, february, 3, false)!.weather).toBe('눈보라')
    expect(getGalarWeatherEncounters(lake, april, 2, false)!.weather).toBe('쾌청')
    expect(getGalarWeatherEncounters(lake, april, 3, false)!.weather).toBe('모래바람')
    const fog = getGalarWeatherEncounters(lake, june, 8, true)!
    expect(fog.weather).toBe('짙은 안개')
    expect(fog.encounters.some(s => s.speciesId === 'sylveon' && s.level === 60)).toBe(true)
    expect(fog.encounters.some(s => s.speciesId === 'hatterene' && s.level === 65)).toBe(true)
    for (const zone of galarWildAreaIds) {
      for (const month of [1, 2, 3, 4, 5, 6, 9, 10, 11]) {
        const pool = getGalarWeatherEncounters(zone, new Date(2026, month, 1), 8, true)!
        expect(pool.encounters.reduce((sum, slot) => sum + slot.weight, 0)).toBeCloseTo(100, 8)
        expect(pool.encounters.every(slot => slot.level >= 60)).toBe(true)
        // Hammerlocke Hills' Copperajah wanderer is absent during a snowstorm.
        expect(pool.encounters.some(slot => slot.level === 65)).toBe(!(zone === 'hammerlocke-hills' && month === 1))
        const beforeTitle = getGalarWeatherEncounters(zone, new Date(2026, month, 1), 8, false)!
        expect(beforeTitle.encounters.every(slot => slot.level < 65)).toBe(true)
      }
    }
    const areasOnOrdinaryDay = Array.from(galarWildAreaIds, id =>
      getGalarWeatherEncounters(id, new Date(2026, 8, 2), 0, false)!.weather)
    expect(new Set(areasOnOrdinaryDay).size).toBeGreaterThan(1)
  })

  it('restores a battle from any eligible day while respecting native forms of progression', () => {
    expect(isGalarWildEncounter('rolling-fields', 'dubwool', 65, false, 8)).toBe(false)
    expect(isGalarWildEncounter('rolling-fields', 'dubwool', 65, true, 8)).toBe(true)
    expect(isGalarWildEncounter('lake-of-outrage', 'vaporeon', 56, false, 2)).toBe(true)
    expect(isGalarWildEncounter('lake-of-outrage', 'sylveon', 56, false, 8)).toBe(false)
    expect(isGalarWildEncounter('lake-of-outrage', 'sylveon', 60, true, 8)).toBe(true)
    expect(isGalarWildEncounter('galar-route-1', 'wooloo', 6, true, 8)).toBe(true)
    expect(isGalarWildEncounter('galar-route-1', 'wooloo', 60, true, 8)).toBe(false)
    for (const zone of galarWildAreaIds) {
      for (const champion of [false, true]) {
        const pool = getGalarWeatherEncounters(zone, new Date(2026, 2, 1), 0, champion)!
        expect(pool.encounters.every(slot => isGalarWildEncounter(zone, slot.speciesId, slot.level, champion, 0))).toBe(true)
      }
    }
  })

  it('uses Tower Summit for the Sword legendary battles and retains the chapter requirements', () => {
    expect(galarLegendSlots).toEqual({
      'energy-plant': [
        { speciesId: 'eternatus', level: 60, weight: 1, minBadges: 8 },
        { speciesId: 'zacian', level: 70, weight: 1, championOnly: true },
      ],
    })
  })
})
