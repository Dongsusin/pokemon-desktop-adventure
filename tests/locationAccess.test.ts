import { describe, expect, it } from 'vitest'
import { createGame, dispatch, hydrateSave, playerStats, type GameSave } from '../src/game/engine'
import { locationAccess } from '../src/game/locationAccess'
import { worldRegions } from '../src/game/regions/world'
import { parseCommand } from '../src/main/commands'
import { finishChallenge } from './trainerArenaDriver'

const bounds = { width: 1280, height: 800 }
const ash = 'field-kanto-ash'
const rocketDuo = 'field-kanto-rocket-duo'
const opening = () => createGame('squirtle', 1, bounds, Date.UTC(2026, 10, 19), 19)
const travel = (game: GameSave, locationId: string) => dispatch(game, { type: 'travel', locationId })

describe('regional map travel', () => {
  it('unlocks Mt. Moon only after both Ash and Brock are defeated, then opens Cerulean after the Rocket duo', () => {
    const game = opening()
    game.player.level = 55
    game.player.moveIds = ['tackle', 'waterGun', 'waterPulse']
    game.player.currentHP = playerStats(game).hp
    expect(locationAccess(game, 'mt-moon')).toMatchObject({ unlocked: false, requiredBadges: 1, missingBadges: 1, missingTrainerId: ash })
    expect(travel(game, 'viridian-forest')).toBe(true)
    expect(dispatch(game, { type: 'challenge-field-trainer', trainerId: ash })).toBe(true)
    finishChallenge(game)
    expect(game.campaign.fieldWins).toEqual([ash])
    expect(travel(game, 'mt-moon')).toBe(false)
    expect(locationAccess(game, 'mt-moon')).toMatchObject({ missingBadges: 1, missingTrainerId: undefined })
    expect(travel(game, 'pewter-city')).toBe(true)
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    finishChallenge(game)
    expect(game.campaign.badges).toEqual(['brock'])
    expect(travel(game, 'mt-moon')).toBe(true)
    expect(locationAccess(game, 'cerulean-city')).toMatchObject({ unlocked: false, missingBadges: 0, missingTrainerId: rocketDuo })
    expect(dispatch(game, { type: 'challenge-field-trainer', trainerId: rocketDuo })).toBe(true)
    finishChallenge(game)
    const restored = hydrateSave(structuredClone(game), 1)!
    expect(travel(restored, 'cerulean-city')).toBe(true)
    expect(travel(restored, 'indigo-plateau')).toBe(false)
  })

  it('rejects direct travel without interrupting the current battle or changing any save state', () => {
    const game = opening()
    game.campaign.badges = ['brock']
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
    expect(travel(game, 'cerulean-city')).toBe(false)
    expect(locationAccess(game, 'cerulean-city').missingTrainerId).toBe(rocketDuo)
    game.campaign.fieldWins = [ash]
    expect(dispatch(game, { type: 'transfer-region', regionId: 'johto' })).toBe(true)
    expect(game.locationId).toBe(worldRegions.johto.startLocationId)
    expect(locationAccess(game, game.locationId).unlocked).toBe(true)
    expect(travel(game, worldRegions.johto.leagueLocationId)).toBe(false)
    expect(dispatch(game, { type: 'transfer-region', regionId: 'kanto' })).toBe(true)
    expect(travel(game, 'mt-moon')).toBe(true)
    expect(game.campaign.fieldWins).toEqual([ash])
    expect(travel(game, 'cerulean-city')).toBe(false)
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
    const legacy = { ...game, schemaVersion: 19, campaign: { ...game.campaign, fieldWins: [former, former] } }
    const upgraded = hydrateSave(legacy, 1)!
    expect(upgraded.regionId).toBe(id)
    expect(upgraded.campaign.fieldWins).toBeUndefined()
    expect(upgraded.campaign.legacyGatePasses).toEqual([successor])
    expect(travel(upgraded, place)).toBe(true)
    const savedAgain = hydrateSave(upgraded, 1)!
    expect(locationAccess(savedAgain, place).unlocked).toBe(true)
    expect(savedAgain.coins).toBe(game.coins)
    expect(dispatch(savedAgain, { type: 'transfer-region', regionId: 'kanto' })).toBe(true)
    expect(hydrateSave(savedAgain, 1)?.regionProgress[id]?.legacyGatePasses).toEqual([successor])
  })

  it('requires the Paldea finale for the crater even with Champion Rank', () => {
    const game = opening()
    game.regionId = 'paldea'
    game.locationId = worldRegions.paldea.startLocationId
    game.campaign.badges = worldRegions.paldea.gymTrainers.map(trainer => trainer.id)
    game.campaign.champion = true
    expect(locationAccess(game, 'zero-lab')).toMatchObject({ unlocked: false, needsFinale: true, missingBadges: 0 })
    expect(travel(game, 'zero-lab')).toBe(false)
    game.campaign.finaleWon = true
    expect(locationAccess(game, 'zero-lab')).toMatchObject({ needsFinale: false, missingTrainerId: 'field-paldea-penny' })
    expect(travel(game, 'zero-lab')).toBe(false)
    game.campaign.fieldWins = ['field-paldea-penny']
    expect(travel(game, 'zero-lab')).toBe(true)
  })
})
