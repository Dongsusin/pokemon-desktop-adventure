import { describe, expect, it } from 'vitest'
import { autoUseBattleItem, createGame, dispatch, hydrateSave } from '../src/game/engine'
import { parseCommand } from '../src/main/commands'

describe('retired training supplies', () => {
  it.each(['exploration', 'gym', 'practice'])('rejects legacy candies and machines during %s and after reloading', mode => {
    const game = createGame('squirtle', 1, { width: 1100, height: 760 })
    game.locationId = 'pewter-city'
    if (mode === 'practice') game.campaign.badges = ['brock']
    if (mode !== 'exploration') expect(dispatch(game, { type: mode === 'gym' ? 'challenge-gym' : 'practice-gym' })).toBe(true)
    const ids = ['rare-candy', 'exp-candy-xs', 'exp-candy-xl', 'tm01']
    for (const id of ids) game.inventory[id] = 3
    game.settings.autoUseItems = ids
    game.runtime.battleItem = { itemId: ids[0], until: game.runtime.clock + 60000 }
    const level = game.player.level, exp = game.player.exp, moves = [...game.player.moveIds]
    const loaded = hydrateSave(game, 1)!
    expect(loaded.settings.autoUseItems).toEqual([])
    expect(loaded.runtime.battleItem).toBeUndefined()
    for (const id of ids) {
      expect(loaded.inventory[id]).toBeUndefined()
      expect(parseCommand({ type: 'useBattleItem', itemId: id, expectedOwned: 3 })).toBeNull()
      expect(dispatch(game, { type: 'useBattleItem', itemId: id, expectedOwned: 3 })).toBe(false)
    }
    expect(autoUseBattleItem(game, game.wild[0])).toBe(false)
    if (mode !== 'exploration') expect(dispatch(loaded, { type: 'arena-surrender' })).toBe(true)
    expect(loaded.player).toMatchObject({ level, exp, moveIds: moves })
  })
})
