import { advanceScripted } from './arenaSimulation'
import { resumeWithLastOpponent } from './trainerArenaDriver'
import { describe, expect, it } from 'vitest'
import { performArenaTactic, createGame, dispatch, eligibleLegends, effectiveLevel, hydrateSave, playerStats, statsFor, } from '../src/game/engine'
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

function faceKabu() {
  const game = enterGalar()
  game.campaign.badges = ['galar-milo', 'galar-nessa']
  game.campaign.fieldWins = ['field-galar-hop', 'field-galar-bede']
  expect(dispatch(game, { type: 'travel', locationId: 'motostoke' })).toBe(true)
  expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
  return resumeWithLastOpponent(game)
}

describe('Galar stadiums and encounter eligibility', () => {
  it('lets the ace and partner activate independently, each reverting after its own Max attack', () => {
    const game = faceKabu()
    const base = statsFor(game.player.speciesId, effectiveLevel(game)).hp
    const target = game.wild[0]
    expect(target.maxActionsLeft).toBeUndefined()
    expect(playerStats(game).hp).toBe(base)
    const before = target.maxHP
    const a = game.campaign.battle!.arena
    a.player = {x:.34, y:.5}; a.enemy = {x:.48, y:.5}; a.enemyInMs = 0
    game.player.currentHP = base
    for (let i = 0; i < 120 && !a.casts.some(c => c.gimmick === 'dynamax'); i++) advanceScripted(game, 30, bounds)
    expect(target.maxActionsLeft).toBe(1)
    expect(target.dynamax).toBe('dynamax')
    expect(battleForm(target)).toBeUndefined()
    expect(target.maxHP).toBe(Math.floor(before * 1.5))
    expect(game.campaign.battle!.arena.casts.some(cast => cast.gimmick === 'dynamax')).toBe(true)
    for (let i=0; i<35 && target.maxActionsLeft; i++) advanceScripted(game,100,bounds)
    expect(target.maxActionsLeft).toBe(0)
    expect(target.maxHP).toBe(before)
    expect(dispatch(game,{type:'arena-gimmick'})).toBe(true)
    expect(playerStats(game).hp).toBe(Math.floor(base * 1.5))
    const saved = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(saved.wild).toEqual(game.wild)
    expect(saved.player.currentHP).toBe(game.player.currentHP)
    expect(playerStats(saved).hp).toBe(playerStats(game).hp)
  })

  it('keeps Dynamax combatants within the arena even at the largest desktop sprite scale', () => {
    const game = faceKabu()
    game.settings.spriteScale = 2
    performArenaTactic(game, { type: 'arena-move', x: -1, y: -1 })
    for (let i = 0; i < 30; i++) advanceScripted(game, 100, bounds)
    const arena = game.campaign.battle!.arena
    for (const position of [arena.player, arena.enemy]) {
      expect(position.x).toBeGreaterThanOrEqual(0.05)
      expect(position.x).toBeLessThanOrEqual(0.95)
      expect(position.y).toBeGreaterThanOrEqual(0.10)
      expect(position.y).toBeLessThanOrEqual(0.90)
    }
    expect(arena.player).toEqual({ x: 0.05, y: 0.10 })
  })

  it('returns the partner to normal HP on leaving a stadium during Dynamax', () => {
    const game = faceKabu()
    expect(dispatch(game,{type:'arena-gimmick'})).toBe(true)
    const max = playerStats(game).hp
    game.player.currentHP = max - 20
    expect(dispatch(game, { type: 'travel', locationId: 'postwick' })).toBe(true)
    expect(game.campaign.battle).toBeNull()
    expect(game.player.currentHP).toBe(Math.floor((max - 20) * playerStats(game).hp / max))
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
