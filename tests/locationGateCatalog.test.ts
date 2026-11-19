import { describe, expect, it } from 'vitest'
import { locationGateRules } from '../src/game/regions/locationGates'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'
import { locationAccess } from '../src/game/locationAccess'
import { createGame } from '../src/game/engine'

function reachable(regionId: RegionId, badgeCount: number) {
  const region = worldRegions[regionId]
  const game = createGame('squirtle', 1, { width: 1280, height: 720 })
  game.regionId = regionId
  game.campaign.badges = region.gymTrainers.slice(0, badgeCount).map(t => t.id)
  const reached = new Set<string>(), queue = [region.startLocationId]
  for (const id of queue) {
    if (reached.has(id) || !locationAccess(game, id).unlocked) continue
    reached.add(id)
    queue.push(...region.locationById[id].links)
  }
  return reached
}

describe.each(regionOrder)('%s badge-only travel', regionId => {
  const region = worldRegions[regionId], catalog = locationGateRules[regionId]
  it('assigns every destination an attainable regional badge requirement', () => {
    expect(Object.keys(catalog).sort()).toEqual(region.locations.map(p => p.id).sort())
    expect(catalog[region.startLocationId]).toBe(0)
    expect(catalog[region.leagueLocationId]).toBe(region.gymTrainers.length)
    for (const count of Object.values(catalog)) {
      expect(Number.isInteger(count)).toBe(true)
      expect(count).toBeGreaterThanOrEqual(0)
      expect(count).toBeLessThanOrEqual(region.gymTrainers.length)
    }
  })
  it('reaches every gym in order and every destination without a field victory or finale', () => {
    for (let count = 0; count <= region.gymTrainers.length; count++) {
      const places = reachable(regionId, count)
      expect(places.has(region.gymTrainers[count]?.locationId ?? region.leagueLocationId)).toBe(true)
      expect(places.has(region.leagueLocationId)).toBe(count === region.gymTrainers.length)
      if (count === region.gymTrainers.length) expect(places.size).toBe(region.locations.length)
    }
  })
})
