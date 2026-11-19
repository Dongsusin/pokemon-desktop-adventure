import { describe, expect, it } from 'vitest'
import { applyOffline, createGame, dispatch, hydrateSave, levelCap, requiredExp, statsFor, tick, type PartyPokemon } from '../src/game/engine'
import { catalogItems } from '../src/game/shopCatalog'
import { parseCommand } from '../src/main/commands'
import { figures } from '../src/renderer/desktopSprites'

const bounds = { width: 1280, height: 720 }, now = Date.UTC(2026, 10, 19)
function companion(id: number, level = 5): PartyPokemon {
  return { instanceId: 'caught-' + id, speciesId: 'squirtle', level, currentHP: statsFor('squirtle', level).hp,
    position: { x: 200 + id * 5, y: 350 }, direction: 1, state: 'IDLE', active: true, destination: null, restMs: 0, roamSeed: id }
}
function encounter(count = 5) {
  const g = createGame('squirtle', 1, bounds, now, 15)
  g.locationId = 'route-1'
  g.autoBattle = true
  g.player.state = 'BATTLE'
  g.wild = [{ id: 33, speciesId: 'rattata', level: 4, currentHP: 1, maxHP: 25, position: { ...g.player.position }, direction: -1 }]
  Object.assign(g.runtime, { targetId: 33, turn: 'player', stateIn: 0, nextId: 100 })
  g.followers = Array.from({ length: count }, (_, i) => companion(i + 2))
  g.boxes = [[{ ...companion(10), active: false, exp: 8 }]]
  return g
}

describe('exploration party experience and desktop visibility', () => {
  it.each([true, false])('awards 100% / 50% per living member, levels a reserve and excludes the box (show party = %s)', visible => {
    const g = encounter(), [next, fainted, capped, fresh, extra] = g.followers
    dispatch(g, { type: 'update-settings', settings: { showPartyOnDesktop: visible } })
    next.exp = requiredExp(5) - 8
    fainted.currentHP = 0
    capped.level = levelCap(g)
    const hp = next.currentHP
    tick(g, 80, bounds)
    expect(g.wins).toBe(1)
    expect(g.player.exp).toBe(25)
    expect(next).toMatchObject({ level: 6, exp: 4, currentHP: hp })
    expect(fresh.exp).toBe(12)
    expect(extra.exp).toBe(12)
    expect(fainted.exp ?? 0).toBe(0)
    expect(capped.exp ?? 0).toBe(0)
    expect(g.boxes[0][0]?.exp).toBe(8)
    const restored = hydrateSave(g, 1)!
    expect(restored.followers.map(m => m.exp)).toEqual(g.followers.map(m => m.exp))
    expect(restored.settings.showPartyOnDesktop).toBe(visible)
  })

  it('awards a capture before a new member joins and does not duplicate it on reload', () => {
    const g = encounter(1)
    const ball = catalogItems.find(entry => entry.slug === 'master-ball')!.id
    g.inventory[ball] = 1
    const use = { type: 'useBattleItem' as const, itemId: ball, expectedOwned: 1 }
    expect(dispatch(g, use)).toBe(true)
    expect(g.player.exp).toBe(25)
    expect(g.followers.map(m => m.exp ?? 0)).toEqual([12, 0])
    expect(dispatch(g, use)).toBe(false)
    expect(hydrateSave(g, 1)!.followers.map(m => m.exp ?? 0)).toEqual([12, 0])
  })

  it('keeps sharing offline earnings at the lead cap and settles each absence once', () => {
    const g = encounter(2), comparison = encounter(0)
    g.player.level = levelCap(g)
    comparison.player.level = g.player.level - 1
    const lead = applyOffline(comparison, now + 60000, now).exp
    expect(lead).toBeGreaterThan(0)
    expect(applyOffline(g, now + 60000, now).exp).toBe(0)
    expect(g.followers.map(m => m.exp)).toEqual([Math.floor(lead / 2), Math.floor(lead / 2)])
    expect(applyOffline(g, now + 60000).minutes).toBe(0)
    expect(g.followers[0].exp).toBe(Math.floor(lead / 2))
  })

  it('renders just the chosen allies, retaining the opponent, the slot setting and old saves', () => {
    const g = encounter(), ids = () => figures(g).map(f => f.id)
    const roster = g.followers.map(m => 'follower:' + m.instanceId)
    expect(ids()).toEqual(['partner', ...roster, '33'])
    const settings = { showPartyOnDesktop: false }
    expect(parseCommand({ type: 'settings', settings })).toEqual({ type: 'settings', settings })
    expect(dispatch(g, { type: 'update-settings', settings })).toBe(true)
    expect(ids()).toEqual(['partner', '33'])
    expect(g.followers).toHaveLength(5)
    expect(hydrateSave(g, 1)!.settings.showPartyOnDesktop).toBe(false)
    dispatch(g, { type: 'update-settings', settings: { showPartyOnDesktop: true } })
    expect(ids()).toEqual(['partner', ...roster, '33'])
    expect(hydrateSave({ ...g, settings: {} }, 1)!.settings.showPartyOnDesktop).toBe(true)
  })
})
