import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  PALDEA_MAP_HEIGHT, PALDEA_MAP_WIDTH, paldeaAreaByLocationId,
  paldeaLocationById, paldeaLocations, paldeaRegion,
} from '../src/game/regions/paldea'
import { paldeaEncounterSlots, paldeaLegendSlots } from '../src/game/regions/paldea-encounters'
import { paldeaGymTrainers } from '../src/game/regions/paldeaCampaign'

describe('Pokémon Scarlet mainland map', () => {
  it('displays the original square map and locates the 15 areas in four provinces', () => {
    const image = readFileSync('assets/maps/paldea/town-map.png')
    expect([image.readUInt32BE(16), image.readUInt32BE(20)]).toEqual([PALDEA_MAP_WIDTH, PALDEA_MAP_HEIGHT])
    expect(createHash('sha256').update(image).digest('hex')).toBe('8af2083b12cfbe21795a8884bf15af2ac4bcd19cfa0a5e92c3e4ccf7c48ea4ea')
    expect(new Set(Object.values(paldeaAreaByLocationId))).toEqual(new Set([
      '남부 팔데아', '서부 팔데아', '동부 팔데아', '북부 팔데아', '팔데아의 대공',
    ]))
    expect(paldeaLocations.filter(p => p.id.includes('-province-area-'))).toHaveLength(15)
    expect(paldeaLocationById[paldeaRegion.startLocationId].name).toBe('티스푼마을')
    expect(paldeaLocationById[paldeaRegion.leagueLocationId]).toMatchObject({ kind: 'league', name: '포켓몬리그' })
  })

  it('pins each badge battle to the Scarlet field coordinates and the corresponding city', () => {
    const venues = [
      ['cortondo', 1426, 3868], ['artazon', 3728, 3786], ['levincia', 4068, 2957],
      ['cascarrafa', 1525, 2709], ['medali', 1988, 2267], ['montenevera', 2778, 1461],
      ['glaseado-gym', 2835, 1748], ['alfornada', 911, 4401],
    ] as const
    expect(new Set(paldeaGymTrainers.map(gym => gym.locationId))).toEqual(new Set(venues.map(v => v[0])))
    for (const [id, gameX, gameZ] of venues) {
      const gym = paldeaGymTrainers.find(trainer => trainer.locationId === id)!
      expect(paldeaLocationById[id]).toMatchObject({
        x: Math.round(gameX * PALDEA_MAP_WIDTH / 5000),
        y: Math.round(gameZ * PALDEA_MAP_HEIGHT / 5000),
        gym: { leader: gym.name, badge: gym.badge, type: gym.type },
      })
    }
  })

  it('connects every place to Cabo Poco with two-way links and places every encounter table on the map', () => {
    expect(new Set(paldeaLocations.map(place => place.id)).size).toBe(57)
    const seen = new Set<string>()
    const queue = [paldeaRegion.startLocationId as string]
    while (queue.length) {
      const id = queue.pop()!
      if (seen.has(id)) continue
      seen.add(id)
      const place = paldeaLocationById[id]
      expect(paldeaAreaByLocationId[id]).toBeTruthy()
      expect(place.x > 0 && place.x < PALDEA_MAP_WIDTH && place.y > 0 && place.y < PALDEA_MAP_HEIGHT).toBe(true)
      for (const neighbor of place.links) {
        expect(paldeaLocationById[neighbor]?.links).toContain(id)
        queue.push(neighbor)
      }
    }
    expect(seen.size).toBe(paldeaLocations.length)
    for (const id of Object.keys(paldeaEncounterSlots)) expect(paldeaLocationById[id]?.encounters.length).toBeGreaterThan(0)
    for (const id of Object.keys(paldeaLegendSlots)) expect(paldeaLocationById[id]?.legends?.length).toBeGreaterThan(0)
  })

  it('groups underground layers at their shared crater pin and keeps the gate and shrines visitable', () => {
    const crater = paldeaLocationById['area-zero']
    const inner = paldeaLocations.filter(place => place.afterFinale)
    expect(new Set(inner.map(place => place.id))).toEqual(new Set(['area-zero', 'area-zero-cavern', 'zero-lab']))
    for (const place of inner) expect([place.x, place.y]).toEqual([crater.x, crater.y])
    expect(paldeaLocationById['zero-gate'].links).toContain('area-zero')
    expect(paldeaLocationById['zero-gate'].afterFinale).toBeUndefined()
    for (const id of ['grasswither-shrine', 'icerend-shrine', 'groundblight-shrine', 'firescourge-shrine']) {
      expect(paldeaLocationById[id].afterFinale).toBeUndefined()
      expect(paldeaLocationById[id].kind).toBe('dungeon')
    }
  })
})
