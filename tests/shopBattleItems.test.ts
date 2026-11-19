import { advanceScripted } from './arenaSimulation'
import { describe, expect, it } from 'vitest'
import { autoUseBattleItem, performArenaTactic, activeBattleItem, canUseBattleItem, captureChance, createGame, dispatch, hydrateSave, items,
  playerStats, requiredExp, type BattleItemUse, type GameSave } from '../src/game/engine'
import { catalogItems } from '../src/game/shopCatalog'
import { shopItemEffect, type ShopItemEffect } from '../src/game/shopItemEffects'
import { parseCommand } from '../src/main/commands'
import { castSkill, idleUntilHit } from './trainerArenaDriver'
import { worldRegions, type RegionId } from '../src/game/regions/world'

const bounds = { width: 1160, height: 780 }
function battle(manual: boolean) {
  const game = createGame('squirtle', 1, bounds, Date.now(), 57)
  game.player.level = 14
  game.player.currentHP = playerStats(game).hp
  game.player.moveIds = ['tackle', 'waterGun', 'waterPulse']
  if (manual) {
    dispatch(game, { type: 'travel', locationId: 'pewter-city' })
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    const arena = game.campaign.battle!.arena
    arena.enemy = { x: arena.player.x + .03, y: arena.player.y }
    arena.enemyInMs = 7000
  } else {
    game.autoBattle = true
    game.locationId = 'route-1'
    game.player.state = 'BATTLE'
    game.wild = [{ id: 50, speciesId: 'rattata', level: 3, currentHP: 1000, maxHP: 1000,
      position: { ...game.player.position }, direction: -1 }]
    game.runtime.targetId = 50
    game.runtime.turn = 'player'
    game.runtime.stateIn = 0
  }
  game.wild[0].currentHP = game.wild[0].maxHP = 1000
  return game
}

function supply(game: GameSave, id: string): BattleItemUse {
  game.inventory[id] = 2
  return { type: 'useBattleItem', itemId: id, expectedOwned: 2 }
}
function applySupply(game: GameSave, order: BattleItemUse) {
  if (!game.campaign.battle) return dispatch(game, order)
  dispatch(game, { type: 'update-settings', settings: { autoUseItem: order.itemId } })
  return autoUseBattleItem(game, game.wild[0])
}

function byEffect(kind: ShopItemEffect['kind'], type?: string) {
  const entry = catalogItems.find(row => {
    const effect = shopItemEffect(row.id)
    return effect.kind === kind && (!type || effect.type === type)
  })
  expect(entry, kind + ' ' + (type ?? '')).toBeDefined()
  return entry!.id
}

describe('Friendly Shop battle items', () => {
  it.each([false, true])('enforces the permitted use of every item in combat (arena=%s)', manual => {
    const template = battle(manual)
    for (const row of catalogItems) {
      const g = structuredClone(template), effect = shopItemEffect(row.id)
      const action = supply(g, row.id)
      g.player.currentHP = effect.kind === 'revive' ? 0 : 1
      expect(parseCommand(action), row.id).toEqual(action)
      if (effect.kind === 'revive' || (manual && effect.kind === 'capture')) {
        expect(applySupply(g, action), row.id).toBe(false)
        expect(g.inventory[row.id], row.id).toBe(2)
        expect(activeBattleItem(g)).toBeUndefined()
        continue
      }
      expect(applySupply(g, action), row.id).toBe(true)
      expect(g.inventory[row.id], row.id).toBe(1)
      if (effect.kind === 'heal') expect(g.player.currentHP, row.id).toBeGreaterThan(1)
      else if (effect.kind === 'capture' && !manual) expect(g.runtime.captureIn, row.id).toBeGreaterThan(0)
      else expect(activeBattleItem(g)?.itemId, row.id).toBe(row.id)
      expect(dispatch(g, action), row.id).toBe(false)
    }
  })

  it.each([false, true])('applies actual stats, outgoing typed damage and cooldown changes (arena=%s)', manual => {
    const original = battle(manual), defaultStats = playerStats(original)
    for (const [kind, stat] of [['attack', 'attack'], ['defense', 'defense'], ['speed', 'speed']] as const) {
      const g = structuredClone(original)
      expect(applySupply(g, supply(g, byEffect(kind)))).toBe(true)
      expect(playerStats(g)[stat]).toBeGreaterThan(defaultStats[stat])
    }
    function hit(effect?: string) {
      const game = structuredClone(original), target = game.wild[0]
      if (effect) expect(applySupply(game, supply(game, effect))).toBe(true)
      game.player.moveIds = ['waterPulse', 'tackle']
      if (manual) castSkill(game, 'waterPulse')
      else advanceScripted(game, 1, bounds)
      return { damage: 1000 - target.currentHP, cooldown: game.runtime.cooldowns.waterPulse }
    }
    const neutral = hit()
    expect(neutral.damage).toBeGreaterThan(0)
    expect(hit(byEffect('type', 'water')).damage).toBeGreaterThan(neutral.damage)
    expect(hit(byEffect('focus')).cooldown).toBeLessThan(neutral.cooldown)
  })

  it('keeps spent practice supplies and elapsed buff time after save and surrender', () => {
    const game = createGame('squirtle', 1, bounds)
    const speed = byEffect('speed')
    expect(applySupply(game, supply(game, speed))).toBe(true)
    const expectedDuration = activeBattleItem(game)!.until - game.runtime.clock
    dispatch(game, { type: 'travel', locationId: 'pewter-city' })
    game.campaign.badges = ['brock']
    game.inventory.potion = 4
    expect(dispatch(game, { type: 'practice-gym' })).toBe(true)
    game.runtime.clock += 3500
    game.player.currentHP = 1
    expect(applySupply(game, { type: 'useBattleItem', itemId: 'potion', expectedOwned: 4 })).toBe(true)
    const resumed = hydrateSave(game, 1)!
    expect(resumed.inventory.potion).toBe(3)
    expect(dispatch(resumed, { type: 'arena-surrender' })).toBe(true)
    expect(resumed.inventory.potion).toBe(3)
    expect(activeBattleItem(resumed)!.until - resumed.runtime.clock).toBe(expectedDuration - 3500)
    expect(dispatch(resumed, { type: 'arena-surrender' })).toBe(false)
    expect(hydrateSave(resumed, 1)!.inventory.potion).toBe(3)
  })

  it('respects an equipped copy, missing stock, the bag cooldown and full HP', () => {
    const g = battle(true)
    g.player.heldItemId = 'muscleBand'
    g.inventory.muscleBand = 1
    expect(canUseBattleItem(g, 'muscleBand')).toBe(false)
    expect(dispatch(g, { type: 'useBattleItem', itemId: 'potion', expectedOwned: 5 })).toBe(false)
    expect(parseCommand({ type: 'useBattleItem', itemId: '__proto__', expectedOwned: 3 })).toBeNull()
    delete g.inventory.potion
    expect(dispatch(g, { type: 'use-item', itemId: 'potion' })).toBe(false)
    g.player.currentHP = 2
    dispatch(g, { type: 'arena-pause', paused: true })
    expect(dispatch(g, supply(g, 'potion'))).toBe(false)
    expect(applySupply(g, supply(g, 'potion'))).toBe(false)
    expect(g.player.currentHP).toBe(2)
    dispatch(g, { type: 'arena-pause', paused: false })
    advanceScripted(g, 100, bounds)
    expect(g.player.currentHP).toBeGreaterThan(2)
  })

  it.each([false, true])('applies incoming resistance and preserves normal victory EXP while protecting held medicine (arena=%s)', manual => {
    const template = battle(manual)
    template.player.level = 7
    if (!manual) Object.assign(template.wild[0], { speciesId: 'tauros', level: 30 })
    template.player.currentHP = playerStats(template).hp - 4
    function hit(g: GameSave) {
      if (manual) {
        g.campaign.battle!.arena.enemyInMs = 1
        idleUntilHit(g)
      } else {
        g.runtime.turn = 'wild'
        g.runtime.stateIn = 0
        advanceScripted(g, 1, bounds)
      }
    }
    const plain = structuredClone(template)
    hit(plain)
    const hpDamage = template.player.currentHP - plain.player.currentHP
    expect(hpDamage).toBeGreaterThan(0)
    const damageType = plain.effects.find(effect => effect.kind === 'damage')!.moveType!
    const guarded = structuredClone(template)
    expect(applySupply(guarded, supply(guarded, byEffect('guardType', damageType)))).toBe(true)
    hit(guarded)
    expect(guarded.player.currentHP).toBeGreaterThan(plain.player.currentHP)
    const medic = structuredClone(template)
    medic.inventory.leftovers = 1
    medic.player.heldItemId = 'leftovers'
    hit(medic)
    expect(medic.effects.some(e => e.kind === 'heal' && e.itemId === 'leftovers')).toBe(false)
    expect(medic.player.currentHP).toBe(plain.player.currentHP)
    expect(medic.inventory.leftovers).toBe(1)
    function win(buff: boolean) {
      const g = structuredClone(template)
      if (buff) expect(applySupply(g, supply(g, 'luckyEgg'))).toBe(false)
      if (manual) g.campaign.battle!.fieldAI!.benchHP[1] = 0
      g.wild[0].currentHP = 1
      if (manual) castSkill(g, 'tackle')
      else advanceScripted(g, 1, bounds)
      let exp = g.player.exp
      for (let level = 1; level < g.player.level; level++) exp += requiredExp(level)
      expect(g.wins).toBe(1)
      return exp
    }
    expect(win(true)).toBe(win(false))
  })

  it('spends the designated item in challenging wild fights and in the automatic arena', () => {
    const g = battle(false)
    const settings = { autoUseItem: 'wise-glasses' }
    expect(parseCommand({ type: 'settings', settings })).toEqual({ type: 'settings', settings })
    expect(dispatch(g, { type: 'update-settings', settings })).toBe(true)
    g.inventory['wise-glasses'] = 2
    advanceScripted(g, 1, bounds)
    expect(g.inventory['wise-glasses']).toBe(2)
    g.runtime.stateIn = 0
    g.runtime.turn = 'player'
    g.wild[0].level = g.player.level
    advanceScripted(g, 1, bounds)
    expect(activeBattleItem(g)?.itemId).toBe('wise-glasses')
    expect(g.inventory['wise-glasses']).toBe(1)
    g.runtime.clock += 3100
    g.runtime.stateIn = 0
    advanceScripted(g, 1, bounds)
    expect(g.inventory['wise-glasses']).toBe(1)
    expect(hydrateSave(g, 1)?.settings.autoUseItem).toBe('wise-glasses')

    const manual = battle(true)
    manual.settings.autoUseItem = 'potion'
    manual.player.currentHP = 1
    advanceScripted(manual, 100, bounds)
    expect(manual.inventory.potion).toBe(4)
    expect(manual.player.currentHP).toBeGreaterThan(1)
    const fainted = battle(false)
    fainted.settings.autoUseItem = 'revive'
    fainted.inventory.revive = 2
    fainted.runtime.turn = 'wild'
    fainted.player.currentHP = 1
    advanceScripted(fainted, 1, bounds)
    expect(fainted.inventory.revive).toBe(2)
    expect(fainted.player.currentHP).toBe(0)
    expect(fainted.losses).toBe(1)
  })

  it('applies prepared Mega stones and typed Z crystals only on a trainer signal', () => {
    function localGym(region: RegionId, speciesId: string) {
      const g = createGame('squirtle', 1, bounds)
      g.regionId = region
      g.locationId = worldRegions[region].gymTrainers[0].locationId
      g.player.speciesId = speciesId
      g.player.level = 20
      g.player.moveIds = ['tackle', 'waterGun']
      expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
      return g
    }
    const mega = localGym('kalos', 'charizard')
    expect(applySupply(mega, supply(mega, 'charizardite-y'))).toBe(true)
    expect(mega.runtime.gimmick?.player).toBeUndefined()
    expect(dispatch(mega, { type: 'arena-gimmick' })).toBe(true)
    expect(mega.runtime.gimmick?.player?.formId).toBe('charizard-mega-y')
    const wrong = localGym('kalos', 'blastoise')
    expect(applySupply(wrong, supply(wrong, 'charizardite-y'))).toBe(true)
    expect(wrong.runtime.gimmick).toBeUndefined()
    expect(activeBattleItem(wrong)?.itemId).toBe('charizardite-y')
    const z = localGym('alola', 'blastoise')
    const id = catalogItems.find(i => i.slug.startsWith('normalium-z'))!.id
    expect(applySupply(z, supply(z, id))).toBe(true)
    expect(z.runtime.gimmick?.player).toBeUndefined()
    expect(dispatch(z, { type: 'arena-gimmick' })).toBe(true)
    expect(z.runtime.gimmick?.player).toMatchObject({ kind: 'z', teraType: 'normal' })
  })

  it('uses specialized balls only for wild captures and preserves trainer battle cooldowns', () => {
    const g = battle(false)
    const target = g.wild[0]
    const ball = (slug: string) => catalogItems.find(i => i.slug === slug)!.id
    expect(captureChance(target, ball('master-ball'), g)).toBe(1)
    const before = captureChance(target, ball('repeat-ball'), g)
    g.pokedexCaught.push(target.speciesId)
    expect(captureChance(target, ball('repeat-ball'), g)).toBeGreaterThan(before)
    expect(captureChance(target, ball('quick-ball'), g)).toBeGreaterThan(captureChance({ ...target, battleActions: 5 }, ball('quick-ball'), g))
    expect(applySupply(g, supply(g, ball('master-ball')))).toBe(true)
    expect(g.followers.some(poke => poke.speciesId === target.speciesId)).toBe(true)
    const arena = battle(true)
    const original = structuredClone(arena)
    arena.inventory = { 'master-ball': 2 }
    arena.settings.autoUseAllItems = true
    expect(applySupply(arena, supply(arena, ball('master-ball')))).toBe(false)
    expect(arena.inventory['master-ball']).toBe(2)
    expect(activeBattleItem(arena)).toBeUndefined()
    expect(arena.wild[0].trainerId).toBeTruthy()
    expect(performArenaTactic(arena, { type: 'arena-skill', slot: 2 })).toBe(true)
    expect(performArenaTactic(original, { type: 'arena-skill', slot: 2 })).toBe(true)
    expect(arena.runtime.cooldowns.waterPulse).toBe(original.runtime.cooldowns.waterPulse)
  })
})
