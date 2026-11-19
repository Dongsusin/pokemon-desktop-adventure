import { describe, expect, it } from 'vitest'
import { activeBattleItem, applyOffline, autoUseBattleItem, createGame, dispatch, hydrateSave, playerStats, tick, type GameSave, type PartyPokemon } from '../src/game/engine'
import { parseCommand } from '../src/main/commands'

const bounds = { width: 1280, height: 720 }
const create = () => createGame('squirtle', 1, bounds, 5000, 17)
function member(game: GameSave, id: string, hp: number): PartyPokemon {
  return { instanceId: id, speciesId: 'pikachu', level: 5, currentHP: hp, position: { ...game.player.position },
    direction: 1, state: 'IDLE', destination: null, active: true, restMs: 0, roamSeed: 12 }
}

describe('persistent health and battle supplies', () => {
  it('ends field recovery without free HP or a low-health recovery loop', () => {
    const g = create()
    g.player.currentHP = 3
    g.player.state = 'RECOVER'
    g.runtime.stateIn = 0
    g.inventory.potion = 1
    tick(g, 1000, bounds)
    expect(g.player.currentHP).toBe(3)
    expect(g.inventory.potion).toBe(1)
    expect(g.player.state).not.toBe('RECOVER')
  })

  it('advances a faint timer for party members, including offline, and freezes it in a box', () => {
    const g = create()
    g.autoBattle = false
    const ally = member(g, 'injured', 0)
    g.followers.push(ally)
    tick(g, 1000, bounds)
    expect(ally.reviveInMs).toBe(299000)
    expect(dispatch(g, { type: 'set-follower-active', instanceId: ally.instanceId, active: false })).toBe(true)
    const saved = hydrateSave(JSON.parse(JSON.stringify(g)), 1)!
    applyOffline(saved, 405000, 5000)
    expect(saved.boxes[0][0]).toMatchObject({ currentHP: 0, reviveInMs: 299000 })
    dispatch(saved, { type: 'set-follower-active', instanceId: ally.instanceId, active: true })
    applyOffline(saved, 704000, 405000)
    expect(saved.followers[0].currentHP).toBeGreaterThan(0)
    expect(saved.followers[0].reviveInMs).toBeUndefined()
  })

  it('settles an overlapping offline interval only once for a fainted party member', () => {
    const g = create()
    g.autoBattle = false
    g.player.currentHP = 0
    applyOffline(g, 105000, 5000)
    expect(g.player.reviveInMs).toBe(200000)
    applyOffline(g, 105000, 5000)
    expect(g.player.reviveInMs).toBe(200000)
    applyOffline(g, 110000, 5000)
    expect(g.player.reviveInMs).toBe(195000)
  })

  it('keeps a fainted follower still and counts only its waking minutes for offline experience', () => {
    const g = create()
    g.locationId = 'route-1'
    const healthy = member(g, 'awake', 10), down = member(g, 'down', 0)
    down.state = 'WANDER'
    down.destination = { x: 400, y: 400 }
    const position = { ...down.position }
    g.followers.push(healthy, down)
    tick(g, 1000, bounds)
    expect(down.position).toEqual(position)
    expect(down.state).toBe('IDLE')
    down.reviveInMs = 300000
    applyOffline(g, 305000, 5000)
    expect(healthy.exp).toBeGreaterThan(0)
    expect(down.currentHP).toBeGreaterThan(0)
    expect(down.exp ?? 0).toBe(0)
  })

  it('reserves the last capture ball for a manual throw', () => {
    const g = create()
    g.locationId = 'route-1'
    g.settings.autoCaptureBall = 'master-ball'
    g.inventory['master-ball'] = 1
    const wild = { id: 90, speciesId: 'pidgey', level: 3, currentHP: 5, maxHP: 24, direction: -1 as const, position: { ...g.player.position } }
    const encounter = () => {
      g.wild = [{ ...wild }]
      g.player.state = 'BATTLE'
      Object.assign(g.runtime, { targetId: 90, stateIn: 0, turn: 'player', spawnIn: 100000 })
    }
    encounter()
    tick(g, 100, bounds)
    expect(g.inventory['master-ball']).toBe(1)
    encounter()
    expect(dispatch(g, { type: 'throw-ball', itemId: 'master-ball' })).toBe(true)
    expect(g.inventory['master-ball']).toBeUndefined()
  })

  it('charges once for an immediate revival and treats a living reserve with one potion', () => {
    const g = create()
    const ally = member(g, 'injured', 0)
    g.followers.push(ally)
    const pay = { type: 'revivePokemon', instanceId: ally.instanceId } as const
    expect(parseCommand(pay)).toEqual(pay)
    expect(dispatch(g, pay)).toBe(false)
    g.coins = 100
    expect(dispatch(g, pay)).toBe(true)
    expect(dispatch(g, pay)).toBe(false)
    expect(g.coins).toBe(0)
    const before = ally.currentHP
    const dose = { type: 'useBattleItem', itemId: 'potion', expectedOwned: 5, targetId: ally.instanceId } as const
    expect(parseCommand(dose)).toEqual(dose)
    expect(dispatch(g, dose)).toBe(true)
    expect(ally.currentHP).toBeGreaterThan(before)
    expect(g.inventory.potion).toBe(4)
  })

  it('uses multiple selected buffs, keeps both effects after reload and reserves one copy of each', () => {
    const g = create()
    g.locationId = 'pewter-city'
    dispatch(g, { type: 'challenge-gym' })
    g.inventory['wise-glasses'] = g.inventory['quick-claw'] = 2
    const selection = { autoUseItems: ['wise-glasses', 'quick-claw'] }
    expect(parseCommand({ type: 'settings', settings: selection })).toEqual({ type: 'settings', settings: selection })
    dispatch(g, { type: 'update-settings', settings: selection })
    const base = playerStats(g).attack
    expect(autoUseBattleItem(g, g.wild[0])).toBe(true)
    g.runtime.clock += 3000
    expect(autoUseBattleItem(g, g.wild[0])).toBe(true)
    expect(g.inventory).toMatchObject({ 'quick-claw': 1, 'wise-glasses': 1 })
    const saved = hydrateSave(g, 1)!
    expect(activeBattleItem(saved)?.itemId).toBe('quick-claw')
    expect(playerStats(saved).attack).toBeGreaterThan(base)
    g.runtime.clock += 180000
    expect(autoUseBattleItem(g, g.wild[0])).toBe(false)
  })

  it('applies an independent defense buff without wasting additional copies of an active attack item', () => {
    const g = create()
    g.locationId = 'pewter-city'
    dispatch(g, { type: 'challenge-gym' })
    g.inventory['choice-band'] = 12
    g.inventory['assault-vest'] = 2
    dispatch(g, { type: 'update-settings', settings: { autoUseItems: ['choice-band', 'assault-vest'] } })
    expect(autoUseBattleItem(g, g.wild[0])).toBe(true)
    g.runtime.clock += 3000
    expect(autoUseBattleItem(g, g.wild[0])).toBe(true)
    expect(g.inventory['assault-vest']).toBe(1)
    expect(g.inventory['choice-band']).toBe(11)
  })

  it('keeps actual HP and consumed stock on both a normal and a practice surrender', () => {
    for (const practice of [false, true]) {
      const g = create()
      g.locationId = 'pewter-city'
      if (practice) g.campaign.badges = ['brock']
      expect(dispatch(g, { type: practice ? 'practice-gym' : 'challenge-gym' })).toBe(true)
      g.player.currentHP = 2
      dispatch(g, { type: 'update-settings', settings: { autoUseItems: ['potion'] } })
      expect(autoUseBattleItem(g, g.wild[0])).toBe(true)
      const hp = g.player.currentHP
      const saved = hydrateSave(g, 1)!
      expect(dispatch(saved, { type: 'arena-surrender' })).toBe(true)
      expect(saved.player.currentHP).toBe(hp)
      expect(saved.inventory.potion).toBe(4)
      tick(saved, 1000, bounds)
      expect(saved.player.currentHP).toBe(hp)
    }
  })

  it('uses only spare copies in all-items mode and never sells equipment assigned to the party or PC', () => {
    const g = create()
    const ally = member(g, 'boxed', 10)
    ally.heldItemId = 'muscleBand'
    g.boxes[0][0] = ally
    g.player.heldItemId = 'muscleBand'
    g.inventory = { muscleBand: 3 }
    g.locationId = 'pewter-city'
    dispatch(g, { type: 'challenge-gym' })
    dispatch(g, { type: 'update-settings', settings: { autoUseAllItems: true } })
    expect(autoUseBattleItem(g, g.wild[0])).toBe(true)
    expect(g.inventory.muscleBand).toBe(2)
    dispatch(g, { type: 'arena-surrender' })
    const sell = { type: 'sellItem', itemId: 'muscleBand', quantity: 1, expectedOwned: 2 } as const
    expect(dispatch(g, sell)).toBe(false)
    g.inventory.potion = 3
    const potion = { ...sell, itemId: 'potion', quantity: 2, expectedOwned: 3 }
    expect(parseCommand(potion)).toEqual(potion)
    expect(dispatch(g, potion)).toBe(true)
    expect(dispatch(g, potion)).toBe(false)
    expect(g.coins).toBe(150)
    expect(g.inventory.potion).toBe(1)
  })
})
