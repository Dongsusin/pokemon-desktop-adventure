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

  it('announces each new move for its learner, including a hidden reserve, and saves it once', () => {
    const g = encounter(2)
    const [reserve, fainted] = g.followers
    g.settings.showPartyOnDesktop = false
    reserve.speciesId = 'charmander'
    fainted.currentHP = 0
    for (const mon of [g.player, reserve, fainted]) {
      mon.level = 12
      mon.exp = requiredExp(12) - 1
    }
    tick(g, 40, bounds)
    const texts = ['꼬부기 · 물의파동 습득', '파이리 · 니트로차지 습득']
    expect(g.effects.filter(e => e.kind === 'learn').map(e => e.text)).toEqual(texts)
    expect(g.history.filter(e => e.kind === 'learn').map(e => e.text)).toEqual([...texts].reverse())
    expect(g.player.moveIds).toContain('waterPulse')
    expect(reserve.moveIds).toContain('flameCharge')
    expect(fainted.level).toBe(12)
    const loaded = hydrateSave(g, 1)!
    tick(loaded, 100, bounds)
    expect(loaded.history.filter(e => e.kind === 'learn')).toHaveLength(2)
    expect(loaded.effects.some(e => e.kind === 'learn')).toBe(false)
  })

  it('records offline learning with effects disabled and skips levels that unlock no move', () => {
    const g = encounter(0)
    g.settings.effects = false
    g.player.level = 12
    g.player.exp = requiredExp(12) - 1
    applyOffline(g, now + 60000, now)
    expect(g.history.filter(e => e.kind === 'learn').map(e => e.text)).toEqual(['꼬부기 · 물의파동 습득'])
    expect(g.effects).toHaveLength(0)
    g.player.exp = requiredExp(13) - 1
    applyOffline(g, now + 120000)
    expect(g.player.level).toBe(14)
    expect(g.history.filter(e => e.kind === 'learn')).toHaveLength(1)
  })

  it('groups every supported move unlocked across several offline levels', () => {
    const g = encounter(0)
    Object.assign(g.player, { level: 1, exp: 0, moveIds: ['tackle'] })
    applyOffline(g, now + 8 * 60 * 60000, now)
    expect(g.player.level).toBeGreaterThanOrEqual(13)
    expect(g.effects.filter(e => e.kind === 'learn').map(e => e.text)).toEqual(['꼬부기 · 물대포, 물의파동 습득'])
  })

  it('announces only the moves newly available on evolution without replacing a selected loadout', () => {
    const g = encounter(0)
    Object.assign(g.player, { speciesId: 'bidoof', level: 15, state: 'IDLE', moveIds: ['tackle'] })
    g.wild = []
    g.runtime.targetId = null
    expect(dispatch(g, { type: 'evolve' })).toBe(true)
    expect(g.player.speciesId).toBe('bibarel')
    expect(g.player.moveIds).toEqual(['tackle'])
    expect(g.history.filter(e => e.kind === 'learn').map(e => e.text)).toEqual(['비버통 · 물대포 습득'])
    expect(g.effects.find(e => e.kind === 'learn')?.text).toBe('비버통 · 물대포 습득')
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
