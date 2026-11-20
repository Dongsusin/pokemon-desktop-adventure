import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { createGame, currentTrainer, dispatch, hydrateSave, leagueOpponents, regionalWeather, resolveTrainer } from '../src/game/engine'
import { isSpeciesMotionSupported } from '../src/game/motionEligibility'
import { fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { locationGateRules } from '../src/game/regions/locationGates'
import { regionOrder, worldRegions } from '../src/game/regions/world'

const make = () => createGame('squirtle', 1, { width: 1280, height: 720 }, 1000, 15)
describe('regional team and habitat balance', () => {
  it('builds each badge opponent for its own cap and keeps late gyms and the league fully staffed', () => {
    for (const id of regionOrder) {
      const r = worldRegions[id]
      for (const [i, trainer] of r.gymTrainers.entries()) {
        const { team } = resolveTrainer(r, trainer, 'squirtle')
        const ace = Math.max(...team.map(m => m.level))
        expect(ace, trainer.id).toBeGreaterThanOrEqual(r.levelCaps[i] - 6)
        expect(ace, trainer.id).toBeLessThanOrEqual(r.levelCaps[i])
        if (trainer.trialKind === 'totem') expect(team).toHaveLength(1)
        else if (i >= 4) expect(team.length, trainer.id).toBeGreaterThanOrEqual(4)
      }
      for (const t of r.leagueTrainers) {
        const team = resolveTrainer(r, t, 'squirtle').team
        expect(team.length, t.id).toBeGreaterThanOrEqual(t.role === 'champion' ? 6 : 5)
        expect(Math.max(...team.map(m => m.level)), t.id).toBeGreaterThanOrEqual(t.role === 'champion' ? 90 : 65)
      }
    }
  })
  it('scales field parties to the badge gate of their home even when the player comes back at level 100', () => {
    for (const id of regionOrder) {
      const r = worldRegions[id]
      for (const t of fieldTrainersByRegion[id]) {
        const gate = locationGateRules[id][t.locationId]
        const team = resolveTrainer(r, t, 'squirtle').team
        expect(Math.max(...team.map(m => m.level)), t.id).toBeLessThanOrEqual(r.levelCaps[gate])
        if (!gate) expect(team.length, t.id).toBeLessThanOrEqual(2)
        expect(team.length).toBeGreaterThan(0)
        expect(team.every(m => t.team.some(original => original.speciesId === m.speciesId))).toBe(true)
      }
    }
  })
  it('lets early Galar rivals use their local companions before the champion cup', () => {
    const r = worldRegions.galar
    const hop = fieldTrainersByRegion.galar.find(t => t.id === 'field-galar-hop')!
    expect(resolveTrainer(r, hop, 'scorbunny').team.map(m => m.speciesId)).toEqual(['dubwool', 'corviknight'])
  })
  it('places rare solo rivals late and finishes a saved encounter at its former location', () => {
    const places = [
      ['kanto', 'field-kanto-b-040', 'indigo-plateau'], ['kalos', 'field-kalos-d-215', 'chamber-of-emptiness'],
      ['paldea', 'field-paldea-s-025', 'area-zero'],
    ] as const
    for (const [regionId, id, site] of places) {
      expect(fieldTrainersByRegion[regionId].find(t => t.id === id)?.locationId).toBe(site)
      expect(locationGateRules[regionId][site]).toBe(worldRegions[regionId].gymTrainers.length)
    }
    const g = make(), r = worldRegions.kanto
    const oak = fieldTrainersByRegion.kanto.find(t => t.id === 'field-kanto-b-040')!
    const fight = { type: 'challenge-field-trainer' as const, trainerId: oak.id }
    expect(dispatch(g, fight)).toBe(false)
    g.campaign.badges = r.gymTrainers.map(t => t.id)
    g.locationId = oak.locationId
    expect(dispatch(g, fight)).toBe(true)
    const snapshot = { ...g, schemaVersion: 25, locationId: 'pallet-town',
      wild: [{ ...g.wild[0], level: oak.team[0].level, currentHP: 7 }] }
    const restored = hydrateSave(hydrateSave(snapshot, 1)!, 1)!
    expect(currentTrainer(restored)?.id).toBe(oak.id)
    expect(restored.wild[0].currentHP).toBe(7)
    expect(dispatch(restored, { type: 'arena-surrender' })).toBe(true)
    expect(dispatch(restored, fight)).toBe(false)
  })
  it('raises free-order Elite Four difficulty with wins regardless of opponent choice', () => {
    const g = make(), r = worldRegions.unova
    g.regionId = r.id
    g.campaign.badges = r.gymTrainers.map(t => t.id)
    const choices = leagueOpponents(g)
    g.campaign.eliteWins = [choices[2].id]
    g.campaign.leagueIndex = 1
    const rematch = leagueOpponents(g).find(t => t.id === choices[0].id)!
    expect(rematch.team.at(-1)!.level).toBeGreaterThan(choices[0].team.at(-1)!.level)
  })
  it('provides a direct local encounter for each playable species from that generation, with training before the champion', () => {
    for (const id of regionOrder) {
      const r = worldRegions[id]
      const direct = new Set(r.locations.flatMap(l => [...l.encounters, ...l.visitors ?? [], ...l.legends ?? []].map(x => x.speciesId)))
      const missing = Object.values(species).filter(s => s.generation === r.generation && isSpeciesMotionSupported(s.id) && !direct.has(s.id))
      expect(missing.map(s => s.id), id).toEqual([])
      expect(r.locations.filter(l => !l.afterFinale).some(l => l.encounters.some(s => s.level >= 88)), id).toBe(true)
    }
  })
  it('offers a pre-championship training ground with a meaningful chance of level 89–94 opponents', () => {
    for (const id of regionOrder) {
      const r = worldRegions[id]
      const qualified = r.locations.filter(l => !l.afterFinale && locationGateRules[id][l.id] === r.gymTrainers.length && l.encounters.length)
      const chances = qualified.map(l => l.encounters.reduce((n, s) => n + (s.level >= 89 ? s.weight : 0), 0) /
        l.encounters.reduce((n, s) => n + s.weight, 0))
      expect(Math.max(...chances), id).toBeGreaterThanOrEqual(.12)
    }
  })
  it('keeps new Galar habitats in the forecast and in a saved wild encounter across weather changes', () => {
    const g = make(), r = worldRegions.galar
    for (const id of regionOrder.slice(0, 7)) g.regionProgress[id] = { badges: worldRegions[id].gymTrainers.map(t => t.id), champion: true }
    g.regionId = 'galar'
    g.locationId = 'dappled-grove'
    const a = regionalWeather(g, g.locationId, new Date(2026, 4, 1))!
    const b = regionalWeather(g, g.locationId, new Date(2026, 7, 1))!
    const slot = a.encounters.find(x => x.speciesId === 'thwackey')!
    expect(slot).toBeDefined()
    expect(b.encounters.some(s => s.speciesId === slot.speciesId && s.level === slot.level)).toBe(true)
    expect(r.locationById[g.locationId].encounters).toContainEqual(expect.objectContaining({ speciesId: slot.speciesId, level: slot.level }))
    g.wild = [{ id: 17, speciesId: slot.speciesId, level: slot.level, currentHP: 8, maxHP: 30, position: g.player.position, direction: 1 }]
    expect(hydrateSave(g, 1)!.wild[0]?.id).toBe(17)
  })
  it('finishes a v25 gym on its original roster and uses the new one for the next attempt', () => {
    const g = make()
    g.locationId = 'pewter-city'
    expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
    const saved = { ...g, schemaVersion: 25, wild: [{ ...g.wild[0], speciesId: 'geodude', level: 12, currentHP: 3 }] }
    const restored = hydrateSave(saved, 1)!
    expect(currentTrainer(restored)?.team.map(m => m.level)).toEqual([12, 14])
    const again = hydrateSave(restored, 1)!
    expect(again.wild[0]?.currentHP).toBe(3)
    expect(dispatch(again, { type: 'arena-surrender' })).toBe(true)
    expect(dispatch(again, { type: 'challenge-gym' })).toBe(true)
    expect(currentTrainer(again)!.team.at(-1)!.level).toBeGreaterThan(14)
  })
})
