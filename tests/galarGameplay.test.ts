import { describe, expect, it } from 'vitest'
import { createGame, dispatch, eligibleLegends, effectiveLevel, hydrateSave, playerStats, statsFor, tick, type GameSave } from '../src/game/engine'
import { battleForm, locationForm } from '../src/game/forms'
import { regionOrder, worldRegions } from '../src/game/regions/world'

const bounds = { width: 1280, height: 800 }

function enterGalar() {
  const game = createGame('squirtle', 1, bounds)
  for (const id of regionOrder.slice(0, -1)) {
    game.regionProgress[id] = { badges: worldRegions[id].gymTrainers.map(gym => gym.id), champion: true }
  }
  game.regionId = 'galar'
  game.locationId = 'postwick'
  game.player.level = 100
  game.player.speciesId = 'blastoise'
  game.player.currentHP = playerStats(game).hp
  return game
}

function takeTurn(game: GameSave) {
  game.runtime.stateIn = 0
  tick(game, 100, bounds)
}

function faceKabu() {
  const game = enterGalar()
  game.campaign.badges = ['galar-milo', 'galar-nessa']
  dispatch(game, { type: 'travel', locationId: 'motostoke' })
  expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
  for (let i = 0; i < 2; i++) {
    game.wild[0].currentHP = 1
    game.runtime.turn = 'player'
    takeTurn(game)
  }
  return game
}

describe('Galar stadiums and encounter eligibility', () => {
  it('restores both Dynamax HP bars, the G-Max sprite and the remaining turns, then reverts after three exchanges', () => {
    let game = faceKabu()
    const base = statsFor(game.player.speciesId, effectiveLevel(game)).hp
    const target = game.wild[0]
    game.runtime.turn = 'wild'
    expect(target.maxActionsLeft).toBe(6)
    expect(playerStats(game).hp).toBe(Math.floor(base * 1.5))
    expect(battleForm(target)).toBe('centiskorch-gmax')
    for (let remaining = 5; remaining >= 0; remaining--) {
      game.wild[0].currentHP = game.wild[0].maxHP
      game.player.currentHP = playerStats(game).hp
      takeTurn(game)
      expect(game.wild[0].maxActionsLeft).toBe(remaining)
      if (remaining === 5) expect(game.effects.some(effect => effect.text === '거다이백화')).toBe(true)
      const saved = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
      expect(saved.wild).toEqual(game.wild)
      expect(saved.player.currentHP).toBe(game.player.currentHP)
      game = saved
    }
    expect(playerStats(game).hp).toBe(base)
    expect(battleForm(game.wild[0])).toBeUndefined()
    expect(game.wild[0].maxHP).toBeLessThan(target.maxHP)
  })

  it('keeps enlarged combatants apart and their HP meters on screen at double sprite size', () => {
    const game = faceKabu()
    game.settings.spriteScale = 2
    game.player.position = { x: 0, y: 0 }
    game.wild[0].position = { x: 92, y: 0 }
    tick(game, 1, bounds)
    const partner = game.player.position
    const enemy = game.wild[0].position
    expect(Math.abs(enemy.x - partner.x)).toBeGreaterThan(201)
    expect(Math.min(enemy.y, partner.y)).toBeGreaterThan(225)
  })

  it('returns the partner to normal HP on leaving a stadium during Dynamax', () => {
    const game = faceKabu()
    const max = playerStats(game).hp
    game.player.currentHP = max - 20
    expect(dispatch(game, { type: 'travel', locationId: 'postwick' })).toBe(true)
    expect(game.campaign.battle).toBeNull()
    expect(game.player.currentHP).toBe(Math.ceil((max - 20) * playerStats(game).hp / max))
    expect(hydrateSave(game, 1)?.player.currentHP).toBe(game.player.currentHP)
  })

  it('keeps the tower legends gated by local badges and the championship and chooses the local forms', () => {
    const tower = worldRegions.galar.locationById['energy-plant']
    expect(eligibleLegends(tower, 'squirtle', false, 7)).toHaveLength(0)
    expect(eligibleLegends(tower, 'squirtle', false, 8).map(e => e.speciesId)).toEqual(['eternatus'])
    expect(eligibleLegends(tower, 'squirtle', true, 8).map(e => e.speciesId).sort()).toEqual(['eternatus', 'zacian'])
    expect(locationForm('galar', 'galar-route-4', 'meowth')).toBe('meowth-galar')
    expect(locationForm('galar', 'galar-route-9', 'gastrodon')).toBe('gastrodon-east')
  })
})
