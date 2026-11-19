import { describe, expect, it } from 'vitest'
import { createGame, dispatch, hydrateSave, playerStats, type GameSave } from '../src/game/engine'
import { locationAccess } from '../src/game/locationAccess'
import { worldRegions } from '../src/game/regions/world'
import { parseCommand } from '../src/main/commands'
import { finishChallenge } from './trainerArenaDriver'

const bounds = { width: 1280, height: 800 }
const ash = 'field-kanto-ash'
const opening = () => createGame('squirtle', 1, bounds, Date.UTC(2026, 10, 19), 19)
const travel = (game: GameSave, locationId: string) => dispatch(game, { type: 'travel', locationId })

describe('regional map travel', () => {
  it('opens Mt. Moon and Cerulean with the Boulder Badge and no field victories', () => {
    const game = opening()
    game.player.level = 55
    game.player.moveIds = ['tackle', 'waterGun', 'waterPulse']
    game.player.currentHP = playerStats(game).hp
    expect(locationAccess(game, 'mt-moon')).toMatchObject({ unlocked: false, requiredBadges: 1, missingBadges: 1 })
    game.campaign.fieldWins = [ash]
    expect(travel(game, 'mt-moon')).toBe(false)
    delete game.campaign.fieldWins
    expect(travel(game, 'pewter-city')).toBe(true)
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    finishChallenge(game)
    expect(game.campaign.badges).toEqual(['brock'])
    expect(travel(game, 'mt-moon')).toBe(true)
    const restored = hydrateSave(structuredClone(game), 1)!
    expect(travel(restored, 'cerulean-city')).toBe(true)
    expect(restored.campaign.fieldWins).toBeUndefined()
    expect(travel(restored, 'indigo-plateau')).toBe(false)
  })

  it('rejects direct travel without interrupting the current battle or changing any save state', () => {
    const game = opening()
    expect(travel(game, 'viridian-forest')).toBe(true)
    expect(dispatch(game, { type: 'challenge-field-trainer', trainerId: ash })).toBe(true)
    const before = structuredClone(game)
    const command = parseCommand({ type: 'travel', locationId: 'mt-moon' })
    expect(command?.type).toBe('travel')
    if (command?.type !== 'travel') throw Error('Missing travel command')
    expect(dispatch(game, command)).toBe(false)
    expect(game).toEqual(before)
    expect(dispatch(game, { type: 'arena-surrender' })).toBe(true)
    expect(travel(game, 'mt-moon')).toBe(false)
  })

  it('preserves a legacy save at a closed destination and applies its entry requirements after departure', () => {
    const legacy = opening()
    legacy.locationId = 'mt-moon'
    const game = hydrateSave(legacy, 1)!
    expect(game.locationId).toBe('mt-moon')
    expect(game.campaign.fieldWins).toBeUndefined()
    expect(travel(game, 'pallet-town')).toBe(true)
    expect(travel(game, 'mt-moon')).toBe(false)
    expect(hydrateSave(game, 1)?.locationId).toBe('pallet-town')
  })

  it('checks the active region only, rejecting invalid and cross-region ids even for a champion', () => {
    const game = opening()
    game.campaign.badges = worldRegions.kanto.gymTrainers.map(trainer => trainer.id)
    game.campaign.champion = true
    for (const id of ['route-29', 'constructor', '__proto__', 'missing']) {
      expect(locationAccess(game, id).unlocked).toBe(false)
      expect(travel(game, id)).toBe(false)
    }
    expect(travel(game, 'cerulean-city')).toBe(true)
    game.campaign.fieldWins = [ash]
    expect(dispatch(game, { type: 'transfer-region', regionId: 'johto' })).toBe(true)
    expect(game.locationId).toBe(worldRegions.johto.startLocationId)
    expect(locationAccess(game, game.locationId).unlocked).toBe(true)
    expect(travel(game, worldRegions.johto.leagueLocationId)).toBe(false)
    expect(dispatch(game, { type: 'transfer-region', regionId: 'kanto' })).toBe(true)
    expect(travel(game, 'mt-moon')).toBe(true)
    expect(game.campaign.fieldWins).toEqual([ash])
    expect(travel(game, 'cerulean-city')).toBe(true)
  })

  it.each([
    ['johto', 'field-johto-ariana', 'field-johto-boss-ariana-archer', 'goldenrod-radio-tower'],
    ['unova', 'field-unova-hugh', 'field-unova-s-012', 'virbank-city'],
    ['paldea', 'field-paldea-giacomo', 'field-paldea-b-098', 'asado-desert'],
  ] as const)('preserves older %s passage without crediting the new opponent', (id, former, successor, place) => {
    const game = opening()
    game.regionId = id
    game.locationId = worldRegions[id].startLocationId
    for (const region of Object.values(worldRegions)) {
      if (region.id === id) break
      game.regionProgress[region.id] = { badges: region.gymTrainers.map(t => t.id), champion: true }
    }
    game.campaign.badges = worldRegions[id].gymTrainers.map(trainer => trainer.id)
    const legacy = { ...game, schemaVersion: 19, campaign: { ...game.campaign, fieldWins: [former, former], legacyGatePasses: [successor] } }
    const upgraded = hydrateSave(legacy, 1)!
    expect(upgraded.regionId).toBe(id)
    expect(upgraded.campaign.fieldWins).toBeUndefined()
    expect(upgraded.campaign).not.toHaveProperty('legacyGatePasses')
    expect(travel(upgraded, place)).toBe(true)
    const savedAgain = hydrateSave(upgraded, 1)!
    expect(locationAccess(savedAgain, place).unlocked).toBe(true)
    expect(savedAgain.coins).toBe(game.coins)
    expect(dispatch(savedAgain, { type: 'transfer-region', regionId: 'kanto' })).toBe(true)
    expect(hydrateSave(savedAgain, 1)?.regionProgress[id]).not.toHaveProperty('legacyGatePasses')
  })

  it('opens the crater at eight Paldea badges before the league and the finale', () => {
    const game = opening()
    game.regionId = 'paldea'
    game.locationId = worldRegions.paldea.startLocationId
    const badges = worldRegions.paldea.gymTrainers.map(t => t.id)
    game.campaign.badges = badges.slice(0, 7)
    expect(travel(game, 'zero-lab')).toBe(false)
    game.campaign.badges = badges
    expect(travel(game, 'zero-lab')).toBe(true)
    expect(game.campaign.champion).toBe(false)
    expect(game.campaign.finaleWon).toBeUndefined()
  })
})
