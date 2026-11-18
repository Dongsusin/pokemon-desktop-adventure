import { describe, expect, it } from 'vitest'
import { createGame, dispatch, hasShop, hydrateSave, shopStock, type GameSave, type ShopPurchase } from '../src/game/engine'
import { regionOrder, worldRegions } from '../src/game/regions/world'
import { parseCommand } from '../src/main/commands'

function customer() {
  const game = createGame('squirtle', 1, { width: 1280, height: 720 })
  game.coins = 300
  return game
}

function order(game: GameSave, itemId: string, quantity = 1): ShopPurchase {
  return { type: 'buyItem', itemId, quantity, expectedOwned: game.inventory[itemId] ?? 0 }
}

describe('Friendly Shop', () => {
  it('buys multiple items together, rejects a repeated checkout and reloads the receipt', () => {
    const game = customer()
    const receipt = order(game, 'pokeball', 3)
    expect(parseCommand(receipt)).toEqual(receipt)
    expect(dispatch(game, receipt)).toBe(true)
    expect(game.inventory.pokeball).toBe(receipt.expectedOwned + 3)
    expect(game.coins).toBe(240)
    expect(game.history[0].text).toContain('몬스터볼 3개 구매')
    const saved = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(saved.inventory).toEqual(game.inventory)
    expect(saved.history[0]).toEqual(game.history[0])
    expect(dispatch(saved, receipt)).toBe(false)
    expect(saved.coins).toBe(240)
    expect(saved.inventory.pokeball).toBe(receipt.expectedOwned + 3)
    expect(dispatch(saved, order(saved, 'potion', 8))).toBe(true)
    expect(saved.coins).toBe(0)
    expect(dispatch(saved, order(saved, 'potion'))).toBe(false)
  })

  it('checks the current settlement and local campaign in each of the nine regions', () => {
    for (const id of regionOrder) {
      const game = customer(), region = worldRegions[id]
      game.regionId = id
      for (const place of region.locations) {
        game.locationId = place.id
        expect(hasShop(game)).toBe(place.kind === 'city' || place.kind === 'town')
      }
      game.locationId = region.locations.find(place => place.kind === 'city' || place.kind === 'town')!.id
      expect(dispatch(game, order(game, 'greatBall'))).toBe(false)
      game.campaign.badges = region.gymTrainers.slice(0, 2).map(gym => gym.id)
      expect(dispatch(game, order(game, 'greatBall'))).toBe(true)
      expect(dispatch(game, order(game, 'superPotion'))).toBe(true)
      expect(dispatch(game, order(game, 'ultraBall'))).toBe(false)
      game.campaign.badges = region.gymTrainers.slice(0, 4).map(gym => gym.id)
      expect(dispatch(game, order(game, 'ultraBall'))).toBe(true)
      game.locationId = region.locations.find(place => place.kind === 'route' || place.kind === 'dungeon')!.id
      expect(dispatch(game, order(game, 'pokeball'))).toBe(false)
    }
  })

  it('keeps existing coins and inventory intact for invalid, unlisted or unaffordable purchases', () => {
    const game = customer()
    const before = structuredClone(game)
    const base = order(game, 'pokeball')
    for (const bad of [0, -2, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      const receipt = { ...base, quantity: bad }
      expect(parseCommand(receipt)).toBeNull()
      expect(dispatch(game, receipt)).toBe(false)
    }
    for (const itemId of ['__proto__', 'oldAmber', 'linkingCord', 'muscleBand']) {
      expect(parseCommand(order(game, itemId))).toBeNull()
      expect(dispatch(game, order(game, itemId))).toBe(false)
    }
    expect(parseCommand({ type: 'buyItem', itemId: 'potion', quantity: 1 })).toBeNull()
    expect(dispatch(game, { ...base, quantity: Number.MAX_SAFE_INTEGER })).toBe(false)
    expect(game).toEqual(before)
    game.inventory.pokeball = Number.MAX_SAFE_INTEGER
    expect(dispatch(game, order(game, 'pokeball'))).toBe(false)
    expect(game.coins).toBe(before.coins)
    expect(shopStock).toHaveLength(5)
  })

  it('respects local badge resets and locks purchases during an active gym challenge', () => {
    const game = customer()
    dispatch(game, { type: 'travel', locationId: 'pewter-city' })
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    expect(dispatch(game, order(game, 'potion'))).toBe(false)
    dispatch(game, { type: 'arena-surrender' })
    game.campaign.badges = worldRegions.kanto.gymTrainers.map(gym => gym.id)
    game.campaign.champion = true
    expect(dispatch(game, { type: 'transfer-region', regionId: 'johto' })).toBe(true)
    expect(dispatch(game, order(game, 'greatBall'))).toBe(false)
    expect(dispatch(game, { type: 'transfer-region', regionId: 'kanto' })).toBe(true)
    dispatch(game, { type: 'travel', locationId: 'pewter-city' })
    expect(dispatch(game, order(game, 'ultraBall'))).toBe(true)
  })
})
