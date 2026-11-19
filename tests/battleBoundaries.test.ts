import { describe, expect, it } from 'vitest'
import { advanceRevival, applyOffline, autoUseBattleItem, canUseBattleItem, createGame, dispatch, hydrateSave, tick, type GameSave, type PartyPokemon } from '../src/game/engine'

import { figures } from '../src/renderer/desktopSprites'

const bounds = { width: 1280, height: 720 }
const end = { x: 825, y: 523 }
function field(seed = 12) {
  const game = createGame('charmander', 1, bounds, 10000, seed)
  game.locationId = 'route-1'
  game.player.position = { ...end }
  game.player.state = 'BATTLE'
  game.settings.autoEvolve = false
  game.wild = [{ id: 40, speciesId: 'rattata', level: 3, currentHP: 1, maxHP: 20,
    position: { x: end.x + 48, y: end.y }, direction: -1 }]
  Object.assign(game.runtime, { targetId: 40, stateIn: 0, turn: 'player', spawnIn: 100000, destination: { x: 90, y: 140 } })
  return game
}
function ally(g: GameSave): PartyPokemon {
  return { instanceId: 'caught-100', speciesId: 'pidgey', level: 5, currentHP: 0, reviveInMs: 100,
    position: { x: 220, y: 185 }, direction: 1, state: 'IDLE', active: true, destination: null, restMs: 0, roamSeed: 7 }
}
describe('combat boundaries and returning to the desktop', () => {
  it.each(['wild', 'paused wild', 'gym', 'paused gym'])('locks party and PC revival while in a %s encounter, including a reload', mode => {
    const g = field()
    if (mode.includes('gym')) {
      g.player.state = 'IDLE'
      g.locationId = 'pewter-city'
      expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
    }
    if (mode === 'paused gym') dispatch(g, { type: 'arena-pause', paused: true })
    if (mode === 'paused wild') dispatch(g, { type: 'set-auto-battle', value: false })
    const down = ally(g)
    g.followers.push(down)
    g.boxes[0][0] = { ...down, active: false, instanceId: 'box-down' }
    g.coins = 200
    g.inventory.revive = 3
    for (const member of [down, g.boxes[0][0]]) {
      expect(dispatch(g, { type: 'revivePokemon', instanceId: member.instanceId })).toBe(false)
      expect(canUseBattleItem(g, 'revive', member.instanceId)).toBe(false)
      expect(dispatch(g, { type: 'useBattleItem', itemId: 'revive', targetId: member.instanceId, expectedOwned: 3 })).toBe(false)
    }
    expect(g.coins).toBe(200)
    advanceRevival(g, 601000)
    const loaded = hydrateSave(g, 1)!
    applyOffline(loaded, 620000)
    expect(loaded.followers[0]).toMatchObject({ currentHP: 0, reviveInMs: 100 })
    expect(loaded.boxes[0][0]).toMatchObject({ currentHP: 0, reviveInMs: 100 })
    expect(loaded.inventory.revive).toBe(3)
  })

  it('keeps a fallen lead down at replacement selection and resumes its timer once the trainer battle ends', () => {
    const g = field()
    g.player.state = 'IDLE'
    g.locationId = 'pewter-city'
    const reserve = { ...ally(g), currentHP: 14 }
    g.followers.push(reserve)
    expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
    g.player.currentHP = 0
    g.player.reviveInMs = 100
    g.campaign.battle!.arena.needsSwitch = true
    g.settings.autoUseAllItems = true
    g.inventory['max-revive'] = 3
    expect(autoUseBattleItem(g, g.wild[0])).toBe(false)
    tick(g, 2000, bounds)
    expect(g.campaign.battle!.arena.needsSwitch).toBe(true)
    expect(g.player.currentHP).toBe(0)
    expect(dispatch(g, { type: 'arena-switch', instanceId: reserve.instanceId })).toBe(true)
    expect(dispatch(g, { type: 'arena-surrender' })).toBe(true)
    expect(g.inventory['max-revive']).toBe(3)
    advanceRevival(g, 100)
    expect(g.player.currentHP).toBeGreaterThan(0)
  })

  it.each([12, Math.imul(3, 2654435761) >>> 0])('sets off from the finishing location on a wild victory (seed %s)', seed => {
    const g = field(seed)
    const oldGoal = g.runtime.destination
    tick(g, 1, bounds)
    expect(g.wins).toBe(1)
    expect(g.player.position).toEqual(end)
    expect(g.player.state).toBe('WANDER')
    expect(g.runtime.destination).not.toEqual(oldGoal)
    expect(figures(g)[0].moving).toBe(true)
    const loaded = hydrateSave(g, 1)!
    tick(loaded, 20, bounds)
    const travel = Math.hypot(loaded.player.position.x - end.x, loaded.player.position.y - end.y)
    expect(travel).toBeGreaterThan(0)
    expect(travel).toBeLessThan(5)
    expect(loaded.player.state).toBe('WANDER')
    expect(loaded.runtime.destination).not.toEqual(oldGoal)
  })

  it('abandons the old hunt destination in a pre-update save that had just returned to idle', () => {
    const g = field()
    g.player.state = 'IDLE'
    g.runtime.targetId = null
    g.runtime.stateIn = 700
    g.wild = []
    const loaded = hydrateSave({ ...g, schemaVersion: 24 }, 1)!
    expect(loaded.player).toMatchObject({ state: 'WANDER', position: end })
    expect(loaded.runtime.destination).toBeNull()
    tick(loaded, 20, bounds)
    expect(loaded.player.position).not.toEqual(end)
  })

  it('restores the original lead at the outgoing fighter’s desktop coordinates', () => {
    const g = field()
    g.player.state = 'IDLE'
    g.locationId = 'pewter-city'
    const originalId = g.player.instanceId, reserve = { ...ally(g), currentHP: 14 }
    g.followers.push(reserve)
    expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
    expect(dispatch(g, { type: 'arena-switch', instanceId: reserve.instanceId })).toBe(true)
    const exitPoint = { x: 971, y: 552 }
    g.player.position = exitPoint
    expect(dispatch(g, { type: 'arena-surrender' })).toBe(true)
    expect(g.player).toMatchObject({ instanceId: originalId, state: 'WANDER', position: exitPoint })
    tick(g, 20, bounds)
    expect(Math.hypot(g.player.position.x - exitPoint.x, g.player.position.y - exitPoint.y)).toBeLessThan(5)
  })

  it('throws another eligible ball when the previously selected ball is gone, reserving the last copy', () => {
    const g = field()
    g.inventory = { pokeball: 1, 'premier-ball': 2, 'master-ball': 2 }
    const loaded = hydrateSave({ ...g, settings: { autoCaptureBall: 'ultraBall', autoCaptureUncaughtOnly: true } }, 1)!
    tick(loaded, 20, bounds)
    expect(loaded.inventory).toMatchObject({ pokeball: 1, 'premier-ball': 1, 'master-ball': 2 })
    expect(loaded.effects.find(fx => fx.kind === 'capture')?.itemId).toBe('premier-ball')
  })

  it('discards old ball buffs and automatic battle-tool assignments while preserving owned balls', () => {
    const g = field()
    g.runtime.battleItem = { itemId: 'greatBall', until: 35000 }
    g.settings.autoUseItems = ['greatBall', 'potion', 'master-ball']
    g.settings.autoUseItem = 'greatBall'
    g.inventory.greatBall = 4
    const restored = hydrateSave(g, 1)!
    expect(restored.runtime.battleItem).toBeUndefined()
    expect(restored.settings.autoUseItems).toEqual(['potion'])
    expect(restored.inventory.greatBall).toBe(4)
  })
})
