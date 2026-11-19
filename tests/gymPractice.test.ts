import { advanceScripted } from './arenaSimulation'
import { describe, expect, it } from 'vitest'
import { canPracticeGym, createGame, dispatch, hydrateSave, playerStats, type GameSave } from '../src/game/engine'
import { regionOrder, worldRegions } from '../src/game/regions/world'
import { finishChallenge } from './trainerArenaDriver'

const bounds = { width: 1280, height: 720 }
function opening() {
  const g = createGame('squirtle', 1, bounds, Date.UTC(2026, 10, 1), 19)
  g.campaign.badges = ['brock']
  g.player.level = 24
  g.inventory.muscleBand = 1
  g.player.heldItemId = 'muscleBand'
  g.player.exp = 32
  g.player.moveIds = ['tackle', 'waterGun', 'waterPulse']
  g.player.currentHP = playerStats(g).hp - 5
  g.followers.push({ instanceId: 'caught-88', speciesId: 'pikachu', level: 16, exp: 12,
    currentHP: 11, moveIds: ['tackle', 'thunderShock'], position: { x: 400, y: 100 }, direction: 1,
    state: 'IDLE', destination: null, active: true, restMs: 0, roamSeed: 8 })
  dispatch(g, { type: 'travel', locationId: 'pewter-city' })
  return hydrateSave(g, 1)!
}

function records(g: GameSave) {
  return {
    members: [g.player, ...g.followers].map(m => [m.instanceId, m.speciesId, m.level, m.exp, m.currentHP, m.heldItemId, m.moveIds]),
    campaign: { ...g.campaign, battle: null },
    regions: g.regionProgress, coins: g.coins, bag: g.inventory, wins: g.wins, losses: g.losses,
    seen: g.pokedexSeen, caught: g.pokedexCaught, boxes: g.boxes
  }
}

describe('gym practice', () => {
  it('offers only a cleared local challenge, including the trials', () => {
    for (const regionId of regionOrder) {
      const g = opening()
      const region = worldRegions[regionId]
      g.regionId = regionId
      const trainer = region.gymTrainers[0]
      g.campaign.badges = []
      g.locationId = trainer.locationId
      expect(dispatch(g, { type: 'practice-gym' })).toBe(false)
      g.campaign.badges = [trainer.id]
      g.locationId = region.leagueLocationId
      expect(canPracticeGym(g)).toBe(false)
      g.locationId = trainer.locationId
      expect(dispatch(g, { type: 'practice-gym' })).toBe(true)
      expect(g.campaign.battle?.trainerId).toBe(trainer.id)
      expect(dispatch(g, { type: 'practice-gym' })).toBe(false)
      expect(dispatch(g, { type: 'challenge-gym' })).toBe(false)
    }
  })

  it('finishes the complete trainer team without new rewards, restoring the wounded party', () => {
    const g = opening(), original = structuredClone(records(g))
    dispatch(g, { type: 'practice-gym' })
    finishChallenge(g)
    expect(g.history[0].practiceResult).toBe('win')
    expect(records(g)).toEqual(original)
  })

  it('restores the original party once after a saved practice switch and surrender', () => {
    const g = opening(), original = structuredClone(records(g))
    dispatch(g, { type: 'practice-gym' })
    expect(dispatch(g, { type: 'arena-switch', instanceId: 'caught-88' })).toBe(true)
    g.player.currentHP = 1
    const resumed = hydrateSave(JSON.parse(JSON.stringify(g)), 1)!
    expect(resumed.campaign.battle?.arena.paused).toBe(true)
    expect(resumed.player.currentHP).toBe(1)
    expect(resumed.player.instanceId).toBe('caught-88')
    expect(dispatch(resumed, { type: 'arena-surrender' })).toBe(true)
    expect(dispatch(resumed, { type: 'arena-surrender' })).toBe(false)
    expect(resumed.history[0].practiceResult).toBe('left')
    expect(records(resumed)).toEqual(original)
    expect(records(hydrateSave(resumed, 1)!)).toEqual(original)
  })

  it('restores HP and records on a knockout or when an old practice opponent is unavailable', () => {
    const g = opening()
    g.player.currentHP = 1
    g.followers[0].currentHP = 0
    const original = structuredClone(records(g))
    dispatch(g, { type: 'practice-gym' })
    const invalid = structuredClone(g)
    invalid.wild = []
    invalid.player.currentHP = 0
    expect(records(hydrateSave(invalid, 1)!)).toEqual(original)
    for (let i = 0; i < 1500 && g.campaign.battle; i++) advanceScripted(g, 100, bounds)
    expect(g.history[0].practiceResult).toBe('loss')
    expect(records(g)).toEqual(original)
  })

  it('ends a practice on travel without counting a loss', () => {
    const g = opening(), original = structuredClone(records(g))
    dispatch(g, { type: 'practice-gym' })
    dispatch(g, { type: 'arena-switch', instanceId: 'caught-88' })
    expect(dispatch(g, { type: 'travel', locationId: 'route-1' })).toBe(true)
    expect(records(g)).toEqual(original)
    expect(g.history.some(entry => entry.practiceResult === 'left')).toBe(true)
  })
})
