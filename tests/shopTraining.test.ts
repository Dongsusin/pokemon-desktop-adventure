import { describe, expect, it } from 'vitest'
import { autoUseBattleItem, performArenaTactic, activeBattleItem, arenaSkills, createGame, dispatch, hydrateSave, levelCap, playerStats, requiredExp, type GameSave } from '../src/game/engine'
import { catalogItems } from '../src/game/shopCatalog'
import { worldRegions } from '../src/game/regions/world'

const screen = { width: 1100, height: 760 }
function trainee() {
  const game = createGame('squirtle',1,screen,Date.now(),64)
  game.player.level = 15
  game.player.exp = 31
  game.player.currentHP = playerStats(game).hp
  game.player.moveIds = ['tackle','waterGun']
  dispatch(game,{type:'travel',locationId:'pewter-city'})
  return game
}
function use(game: GameSave, itemId: string) {
  if (game.campaign.battle) {
    dispatch(game, { type: 'update-settings', settings: { autoUseItem: itemId } })
    return autoUseBattleItem(game, game.wild[0])
  }
  return dispatch(game,{type:'useBattleItem',itemId,expectedOwned:game.inventory[itemId] ?? 0})
}
function total(level: number, exp: number) {
  for (let i = 1; i < level; i++) exp += requiredExp(i)
  return exp
}

describe('shop candy and technical machines', () => {
  it.each([false,true])('grants one immediate level in an ongoing battle without evolution or a cast reset (trainer=%s)', trainer => {
    const g = trainee()
    if (trainer) {
      expect(dispatch(g,{type:'challenge-gym'})).toBe(true)
      expect(performArenaTactic(g, {type:'arena-skill',slot:1})).toBe(true)
    } else {
      g.player.state = 'BATTLE'
      g.wild = [{id:42,speciesId:'rattata',level:15,currentHP:50,maxHP:50,direction:-1,position:{...g.player.position}}]
      g.runtime.targetId = 42
    }
    const target = g.runtime.targetId
    const casts = structuredClone(g.campaign.battle?.arena.casts)
    const remaining = g.runtime.stateIn
    g.inventory['rare-candy'] = 2
    expect(use(g,'rare-candy')).toBe(true)
    expect(g.player).toMatchObject({level:16,exp:0,state:'BATTLE',speciesId:'squirtle'})
    expect(g.runtime.targetId).toBe(target)
    expect(g.runtime.stateIn).toBe(remaining)
    expect(g.campaign.battle?.arena.casts).toEqual(casts)
    expect(g.inventory['rare-candy']).toBe(1)
    g.runtime.clock += trainer ? 120000 : 3100
    expect(use(g,'rare-candy')).toBe(true)
    expect(g.player.level).toBe(17)
  })

  it('grants the displayed XS through XL amounts, clamps at the local limit, and preserves higher-level travelers', () => {
    for (const [size,amount] of [['xs',30],['s',240],['m',900],['l',3000],['xl',9000]] as const) {
      const g = trainee()
      g.campaign.badges = worldRegions.kanto.gymTrainers.map(t => t.id)
      const item = 'exp-candy-' + size, before = total(g.player.level,g.player.exp)
      g.inventory[item] = 1
      expect(use(g,item)).toBe(true)
      expect(total(g.player.level,g.player.exp) - before).toBe(amount)
      expect(activeBattleItem(g)?.itemId).toBe(item)
    }
    const g = trainee(), cap = levelCap(g)
    g.player.level = cap - 1
    g.player.exp = requiredExp(g.player.level) - 5
    g.inventory['exp-candy-xl'] = 1
    expect(use(g,'exp-candy-xl')).toBe(true)
    expect([g.player.level,g.player.exp]).toEqual([cap,0])
    g.runtime.clock += 3100
    g.player.level = 64
    g.player.exp = 321
    g.inventory['rare-candy'] = 1
    expect(use(g,'rare-candy')).toBe(true)
    expect([g.player.level,g.player.exp]).toEqual([64,321])
    expect(activeBattleItem(g)?.itemId).toBe('rare-candy')
  })

  it('resumes and exits a practice battle with the pre-entry level, EXP, moves and supplies', () => {
    const g = trainee()
    g.campaign.badges = ['brock']
    g.inventory['rare-candy'] = 2
    expect(dispatch(g,{type:'practice-gym'})).toBe(true)
    expect(use(g,'rare-candy')).toBe(true)
    const save = hydrateSave(g,1)!
    expect(save.campaign.battle?.practice).toBeDefined()
    expect(save.player.level).toBe(16)
    expect(save.inventory['rare-candy']).toBe(1)
    expect(dispatch(save,{type:'arena-surrender'})).toBe(true)
    expect(save.player).toMatchObject({level:15,exp:31,moveIds:['tackle','waterGun']})
    expect(save.inventory['rare-candy']).toBe(2)
  })

  it('fills only a free native slot for a compatible machine, and retains its training effect for other leads', () => {
    const machine = catalogItems.find(row => row.moveId === 'water-pulse')!.id
    const g = trainee()
    g.inventory[machine] = 1
    expect(dispatch(g,{type:'challenge-gym'})).toBe(true)
    expect(use(g,machine)).toBe(true)
    expect(g.player.moveIds).toEqual(['tackle','waterGun','waterPulse'])
    expect(arenaSkills(g).some(s => s.move.id === 'waterPulse')).toBe(true)
    expect(hydrateSave(g,1)?.player.moveIds).toEqual(g.player.moveIds)
    for (const [speciesId,level,slots] of [
      ['charmander',15,['tackle','ember']], ['squirtle',5,['tackle','waterGun']],
      ['squirtle',30,['tackle','waterGun','waterPulse','recover']]
    ] as const) {
      const other = trainee()
      other.player.speciesId = speciesId
      other.player.level = level
      other.player.moveIds = [...slots]
      other.inventory[machine] = 1
      expect(use(other,machine)).toBe(true)
      expect(other.player.moveIds).toEqual(slots)
      expect(activeBattleItem(other)?.itemId).toBe(machine)
    }
  })
})
