import { describe, expect, it } from 'vitest'
import { fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { locationGateRules } from '../src/game/regions/locationGates'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'

function reachableByFoot(regionId: RegionId, badges: number, wins: ReadonlySet<string>, finaleWon = false) {
  const region = worldRegions[regionId]
  const reached = new Set<string>()
  const queue = [region.startLocationId]
  for (const id of queue) {
    if (reached.has(id)) continue
    const rule = locationGateRules[regionId][id]
    const location = region.locationById[id]
    if ((rule.badges ?? 0) > badges || (rule.trainerId && !wins.has(rule.trainerId))) continue
    if (location.afterFinale && !finaleWon) continue
    reached.add(id)
    queue.push(...location.links)
  }
  return reached
}

describe.each(regionOrder)('%s location requirements', regionId => {
  const region = worldRegions[regionId]
  const trainers = fieldTrainersByRegion[regionId]
  const catalog = locationGateRules[regionId]
  const gates = Object.values(catalog)
  const gateOwners = new Set(gates.flatMap(rule => rule.trainerId ? [rule.trainerId] : []))

  it('explicitly covers every destination with regional, attainable requirements', () => {
    expect(Object.keys(catalog).sort()).toEqual(region.locations.map(location => location.id).sort())
    expect(catalog[region.startLocationId]).toEqual({})
    expect(catalog[region.leagueLocationId].badges).toBe(region.gymTrainers.length)
    expect(gateOwners.size).toBeGreaterThanOrEqual(4)
    for (const [id, rule] of Object.entries(catalog)) {
      const badges = rule.badges ?? 0
      expect(Number.isInteger(badges)).toBe(true)
      expect(badges).toBeGreaterThanOrEqual(0)
      expect(badges).toBeLessThanOrEqual(region.gymTrainers.length)
      if (rule.trainerId) {
        const trainer = trainers.find(trainer => trainer.id === rule.trainerId)
        expect(trainer).toBeDefined()
        expect(trainer!.locationId).not.toBe(id)
        expect(trainer!.requiredBadges).toBeLessThanOrEqual(badges)
      }
    }
  })

  it('reaches trainers, gyms in order, the league and the finale using only unlocked neighboring places', () => {
    const wins = new Set<string>()
    for (let badges = 0; badges <= region.gymTrainers.length; badges++) {
      let reached = reachableByFoot(regionId, badges, wins)
      // One win at this milestone can open the route to another encounter.
      for (;;) {
        const available = trainers.filter(t => !wins.has(t.id) && t.requiredBadges <= badges && reached.has(t.locationId))
        if (!available.length) break
        for (const trainer of available) wins.add(trainer.id)
        reached = reachableByFoot(regionId, badges, wins)
      }
      for (const t of trainers.filter(t => t.requiredBadges === badges)) {
        expect(wins.has(t.id), t.name).toBe(true)
      }
      const next = region.gymTrainers[badges]?.locationId ?? region.leagueLocationId
      expect(reached.has(next), next).toBe(true)
      if (badges < region.gymTrainers.length) expect(reached.has(region.leagueLocationId)).toBe(false)
      else if (region.finaleTrainer) expect(reached.has(region.finaleTrainer.locationId)).toBe(true)
    }
    const reached = reachableByFoot(regionId, region.gymTrainers.length, wins, true)
    for (const trainer of trainers) expect(reached.has(trainer.locationId), trainer.name).toBe(true)
    expect([...reached].sort()).toEqual(region.locations.map(l => l.id).sort())
  })
})

it('requires the Kanto badge and forest encounter before Mt Moon, then the Rocket encounter to reach Cerulean', () => {
  const ash = 'field-kanto-ash'
  const rockets = 'field-kanto-rocket-duo'
  const beforeAsh = reachableByFoot('kanto', 1, new Set())
  expect(beforeAsh.has('viridian-forest')).toBe(true)
  expect(beforeAsh.has('pewter-city')).toBe(true)
  expect(beforeAsh.has('mt-moon')).toBe(false)
  expect(reachableByFoot('kanto', 0, new Set([ash])).has('mt-moon')).toBe(false)
  const moon = reachableByFoot('kanto', 1, new Set([ash]))
  expect(moon.has('mt-moon')).toBe(true)
  expect(moon.has('cerulean-city')).toBe(false)
  expect(reachableByFoot('kanto', 1, new Set([ash, rockets])).has('cerulean-city')).toBe(true)
})
