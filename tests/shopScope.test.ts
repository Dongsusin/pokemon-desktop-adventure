import { describe, expect, it } from 'vitest'
import { catalogItems } from '../src/game/shopCatalog'
import { createGame, dispatch, hydrateSave, items, salePrice, shopOffer, tick, type PartyPokemon } from '../src/game/engine'

const removed = ['rare-candy', 'exp-candy-xl', 'tm01', 'x-attack', 'luckyEgg', 'explorerBadge', 'oldAmber', 'linkingCord', 'waterStone', 'poke-ball-recipe', 'bike--yellow']
const retained = ['muscleBand', 'guardCharm', 'legend-plate', 'charizardite-x', 'master-ball', 'lapoke-ball', 'superPotion', 'max-revive', 'ether', 'lum-berry', 'fine-remedy']

describe('playable item scope', () => {
  it('exposes only retained items through inventory, purchases and sales', () => {
    const ids = new Set(catalogItems.map(item => item.id))
    expect(Object.keys(items).sort()).toEqual([...ids].sort())
    for (const id of retained) {
      expect(ids.has(id), id).toBe(true)
      expect(shopOffer(id), id).toBeDefined()
      expect(salePrice(id), id).toBeGreaterThan(0)
    }
    for (const id of removed) {
      expect(ids.has(id), id).toBe(false)
      expect(items[id], id).toBeUndefined()
      expect(shopOffer(id), id).toBeUndefined()
      expect(salePrice(id), id).toBe(0)
    }
  })
  it('cleans old inventory, held equipment, selected tools and pending loot without altering the party or money', () => {
    const game = createGame('squirtle', 1, { width: 960, height: 640 }, 10000, 7)
    Object.assign(game.inventory, Object.fromEntries(removed.map(id => [id, 3])), { muscleBand: 2 })
    game.player.heldItemId = 'luckyEgg'
    const reserve: PartyPokemon = { instanceId: 'party-pika', speciesId: 'pikachu', level: 5, currentHP: 7,
      heldItemId: 'explorerBadge', position: { ...game.player.position }, direction: 1, state: 'IDLE',
      destination: null, active: true, restMs: 0, roamSeed: 1 }
    game.followers.push(reserve)
    game.boxes[0][0] = { ...reserve, instanceId: 'box-pika', active: false, heldItemId: 'luckyEgg' }
    game.settings.autoUseItems = ['x-attack', 'muscleBand', 'rare-candy']
    game.settings.autoUseItem = 'x-attack'
    game.player.state = 'LOOT'
    game.autoBattle = true
    game.runtime.drop = { itemId: 'oldAmber', position: { ...game.player.position } }
    const loaded = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(loaded.player.instanceId).toBe(game.player.instanceId)
    expect(loaded.coins).toBe(game.coins)
    expect(loaded.player.heldItemId).toBeNull()
    expect(loaded.followers[0]).toMatchObject({ instanceId: 'party-pika', currentHP: 7, heldItemId: null })
    expect(loaded.boxes[0][0]).toMatchObject({ instanceId: 'box-pika', currentHP: 7, heldItemId: null })
    expect(loaded.settings.autoUseItems).toEqual(['muscleBand'])
    expect(loaded.runtime.drop).toBeNull()
    for (const id of removed) {
      expect(loaded.inventory[id]).toBeUndefined()
      expect(dispatch(loaded, { type: 'equip-item', itemId: id })).toBe(false)
      expect(dispatch(loaded, { type: 'use-item', itemId: id })).toBe(false)
      expect(dispatch(loaded, { type: 'useBattleItem', itemId: id, expectedOwned: 0 })).toBe(false)
      expect(dispatch(loaded, { type: 'buyItem', itemId: id, quantity: 1, expectedOwned: 0 })).toBe(false)
      expect(dispatch(loaded, { type: 'sellItem', itemId: id, quantity: 1, expectedOwned: 0 })).toBe(false)
    }
  })
  it('rolls and collects only playable rewards at a former excavation site, including the rarest drops', () => {
    const bounds = { width: 960, height: 640 }
    const original = createGame('squirtle', 1, bounds, 10000, 1)
    original.locationId = 'mt-moon'
    const rewards = new Set<string>()
    for (let seed = 1; seed <= 1400; seed++) {
      const game = structuredClone(original)
      game.player.state = 'BATTLE'
      game.wild = [{ id: 42, speciesId: 'zubat', currentHP: 1, maxHP: 12, level: 8,
        position: { ...game.player.position }, direction: 1 }]
      Object.assign(game.runtime, { rngState: Math.imul(seed, 0x9e3779b9) >>> 0, targetId: 42, turn: 'player', spawnIn: 120000, stateIn: 0 })
      tick(game, 20, bounds)
      const drop = game.effects.find(fx => fx.kind === 'pickup')
      if (!drop?.itemId) continue
      expect(shopOffer(drop.itemId), drop.itemId).toBeDefined()
      const before = original.inventory[drop.itemId] ?? 0
      game.runtime.stateIn = 0
      tick(game, 20, bounds)
      expect(game.inventory[drop.itemId]).toBe(before + 1)
      rewards.add(drop.itemId)
    }
    expect(rewards).toContain('potion')
    expect(rewards).toContain('leftovers')
    expect(rewards).toContain('choice-band')
  })
})
