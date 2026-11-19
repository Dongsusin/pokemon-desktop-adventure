import { describe, expect, it } from 'vitest'
import { arenaSkills, createGame, dispatch, hydrateSave, playerStats, statsFor } from '../src/game/engine'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'
import { castSkill } from './trainerArenaDriver'

const screen = { width: 1280, height: 720 }
function localGym(id: RegionId) {
  const g = createGame('squirtle', 1, screen, Date.UTC(2026, 10, 19), 31)
  for (const previous of regionOrder.slice(0, regionOrder.indexOf(id))) {
    g.regionProgress[previous] = { badges: worldRegions[previous].gymTrainers.map(gym => gym.id), champion: true }
  }
  g.regionId = id
  g.locationId = worldRegions[id].gymTrainers[0].locationId
  g.player.level = 25
  g.player.moveIds = ['tackle', 'waterGun', 'waterPulse']
  g.player.currentHP = playerStats(g).hp
  expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
  return g
}

function oldAce(id: 'paldea' | 'galar') {
  const game = localGym(id)
  const gym = worldRegions[id].gymTrainers[0]
  for (let i = 1; i < gym.team.length; i++) {
    game.wild[0].currentHP = 1
    castSkill(game)
  }
  const original = { ...structuredClone(game), schemaVersion: 16 }
  delete original.runtime.gimmick
  return original
}

describe('battle gimmick save compatibility', () => {
  it('restores an ongoing v16 stadium ace without offering a second activation', () => {
    const old = oldAce('galar')
    const baseHp = statsFor(old.player.speciesId, 25).hp
    old.wild[0].maxActionsLeft = 4
    old.player.currentHP = Math.floor(baseHp * 1.5) - 4
    const game = hydrateSave(old, 1)!
    expect(game.runtime.gimmick?.player).toMatchObject({ kind: 'dynamax', active: true, remaining: 2 })
    expect(game.runtime.gimmick?.enemy).toMatchObject({ kind: 'dynamax', active: true, remaining: 2 })
    expect(game.player.currentHP).toBe(old.player.currentHP)
    expect(game.campaign.battle?.arena.paused).toBe(true)
    dispatch(game, { type: 'arena-pause', paused: false })
    expect(dispatch(game, { type: 'arena-gimmick' })).toBe(false)
    expect(hydrateSave(game, 1)?.runtime.gimmick).toEqual(game.runtime.gimmick)
  })

  it('migrates both old Tera types, while a new save retains independent activations', () => {
    const old = oldAce('paldea')
    const migrated = hydrateSave(old, 1)!
    expect(migrated.runtime.gimmick?.player).toMatchObject({ kind: 'tera', teraType: 'water' })
    expect(migrated.runtime.gimmick?.enemy).toMatchObject({ kind: 'tera', teraType: 'bug' })
    const newGame = localGym('paldea')
    expect(dispatch(newGame, { type: 'arena-gimmick' })).toBe(true)
    const saved = hydrateSave(newGame, 1)!
    expect(saved.runtime.gimmick?.player).toEqual(newGame.runtime.gimmick?.player)
    expect(saved.runtime.gimmick?.enemy).toBeUndefined()
    expect(arenaSkills(saved).map(s => s.effectiveness)).toEqual(arenaSkills(newGame).map(s => s.effectiveness))
  })

  it('drops a stored power if it belongs to a different encounter', () => {
    const game = localGym('galar')
    dispatch(game, { type: 'arena-gimmick' })
    expect(game.runtime.gimmick).toBeDefined()
    game.runtime.gimmick!.targetId += 100
    const reloaded = hydrateSave(game, 1)!
    expect(reloaded.runtime.gimmick).toBeUndefined()
    expect(playerStats(reloaded).hp).toBe(statsFor('squirtle', 25).hp)
  })
})
