import { describe, expect, it } from 'vitest'
import { applyOffline, arenaSkills, createGame, dispatch, hydrateSave, playerStats, tick, type GameSave } from '../src/game/engine'
import { castSkill, finishChallenge, idleUntilHit } from './trainerArenaDriver'

const bounds = { width: 1280, height: 720 }
const time = Date.UTC(2026, 9, 1)

function gym(withBench = false) {
  const g = createGame('squirtle', 1, bounds, time, 19)
  g.player.level = 15
  g.player.currentHP = playerStats(g).hp
  g.player.moveIds = ['tackle', 'waterGun', 'waterPulse']
  if (withBench) {
    g.followers.push({
      instanceId: 'caught-88', speciesId: 'pikachu', level: 16, currentHP: 35,
      position: { x: 400, y: 100 }, direction: 1, state: 'IDLE', destination: null,
      active: true, restMs: 0, roamSeed: 8,
    })
  }
  dispatch(g, { type: 'travel', locationId: 'pewter-city' })
  expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
  return g
}

const arena = (g: GameSave) => g.campaign.battle!.arena
function frames(g: GameSave, count: number) {
  for (let i = 0; i < count; i++) tick(g, 100, bounds)
}
function until(g: GameSave, check: () => boolean, count = 120) {
  for (let i = 0; !check() && i < count; i++) frames(g, 1)
  expect(check()).toBe(true)
}

describe('real-time trainer arena', () => {
  it('keeps hunting and offline XP from playing an accepted trainer battle, then awards a badge through deliberate skills', () => {
    const game = gym()
    const target = game.wild[0], cash = game.coins, xp = game.player.exp
    frames(game, 40)
    expect(target.currentHP).toBe(target.maxHP)
    expect(game.wins).toBe(0)
    expect(game.campaign.badges).toEqual([])
    expect(applyOffline(game, time + 60 * 60_000)).toMatchObject({ exp: 0, coins: 0 })
    expect(game.player.exp).toBe(xp)
    expect(game.coins).toBe(cash)
    finishChallenge(game)
    expect(game.campaign.badges).toEqual(['brock'])
    expect(game.wins).toBe(1)
    expect(game.coins).toBeGreaterThan(cash)
    expect(dispatch(game, { type: 'arena-skill', slot: 0 })).toBe(false)
    expect(dispatch(game, { type: 'arena-surrender' })).toBe(false)
  })

  it('accepts directional movement, checks skill range, and prevents repeated same-frame casts', () => {
    const game = gym(), a = arena(game)
    const start = { ...a.player }
    const skill = arenaSkills(game)[0]
    expect(skill.move.id).toBe('tackle')
    expect(skill.inRange).toBe(false)
    const initialHP = game.wild[0].currentHP
    expect(dispatch(game, { type: 'arena-skill', slot: 0 })).toBe(false)
    expect(game.wild[0].currentHP).toBe(initialHP)
    expect(dispatch(game, { type: 'arena-move', x: 1, y: -1 })).toBe(true)
    frames(game, 3)
    expect(a.player.x).toBeGreaterThan(start.x)
    expect(a.player.y).toBeLessThan(start.y)
    castSkill(game, 'tackle')
    const hp = game.wild[0].currentHP
    expect(hp).toBeLessThan(initialHP)
    expect(arenaSkills(game)[0].cooldownMs).toBeGreaterThan(0)
    expect(dispatch(game, { type: 'arena-skill', slot: 0 })).toBe(false)
    expect(game.wild[0].currentHP).toBe(hp)
  })

  it('shows an enemy attack before impact and lets the player escape its marked position', () => {
    const hit = gym()
    until(hit, () => Boolean(arena(hit).telegraph))
    const safe = structuredClone(hit), hp = safe.player.currentHP
    const mark = arena(hit).telegraph!
    expect(mark.radius).toBeGreaterThan(0)
    expect(mark.remainingMs).toBeGreaterThan(0)
    dispatch(safe, { type: 'arena-move', x: -1, y: 1 })
    expect(dispatch(safe, { type: 'arena-dodge' })).toBe(true)
    expect(dispatch(safe, { type: 'arena-dodge' })).toBe(false)
    const ticks = Math.ceil(mark.remainingMs / 100) + 1
    frames(hit, ticks)
    frames(safe, ticks)
    expect(hit.player.currentHP).toBeLessThan(hp)
    expect(safe.player.currentHP).toBe(hp)
    expect(arena(safe).player).not.toEqual(mark.center)
  })

  it('pauses during reload, preserves the enemy and telegraph, and safely upgrades old mid-battle saves', () => {
    const game = gym()
    until(game, () => Boolean(arena(game).telegraph))
    dispatch(game, { type: 'arena-move', x: 1, y: 0 })
    const restored = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(arena(restored).paused).toBe(true)
    expect(arena(restored).player).toEqual(arena(game).player)
    expect(arena(restored).telegraph).toEqual(arena(game).telegraph)
    const position = { ...arena(restored).player }, hp = restored.player.currentHP, opponent = {...restored.wild[0]}
    expect(dispatch(restored, { type: 'arena-skill', slot: 1 })).toBe(false)
    frames(restored, 60)
    expect(arena(restored).player).toEqual(position)
    expect(restored.player.currentHP).toBe(hp)
    expect(restored.wild[0].currentHP).toBe(opponent.currentHP)
    expect(arena(restored).telegraph).toEqual(arena(game).telegraph)
    expect(dispatch(restored, { type: 'arena-pause', paused: false })).toBe(true)
    frames(restored, 2)
    expect(arena(restored).player).toEqual(position)

    const legacy = JSON.parse(JSON.stringify(game))
    delete legacy.campaign.battle.arena
    const upgraded = hydrateSave(legacy, 1)!
    expect(upgraded.campaign.battle?.trainerId).toBe('brock')
    expect(arena(upgraded).paused).toBe(true)
    expect(upgraded.wild[0].currentHP).toBe(opponent.currentHP)
  })

  it('requires a living replacement after a faint and restores the registered formation at settlement', () => {
    const g = gym(true), lead = g.player.instanceId, bench = g.followers[0].instanceId
    expect(arena(g).partyOrder).toEqual([lead, bench])
    expect(dispatch(g, { type: 'arena-switch', instanceId: 'not-owned' })).toBe(false)
    g.player.currentHP = 1
    idleUntilHit(g)
    expect(arena(g).needsSwitch).toBe(true)
    expect(g.losses).toBe(0)
    expect(dispatch(g, { type: 'arena-switch', instanceId: lead })).toBe(false)
    const saved = hydrateSave(JSON.parse(JSON.stringify(g)), 1)!
    expect(arena(saved).needsSwitch).toBe(true)
    dispatch(saved, { type: 'arena-pause', paused: false })
    expect(dispatch(saved, { type: 'arena-switch', instanceId: bench })).toBe(true)
    expect(saved.player.instanceId).toBe(bench)
    expect(saved.followers.find(m => m.instanceId === lead)?.currentHP).toBe(0)
    expect(dispatch(saved, { type: 'arena-switch', instanceId: lead })).toBe(false)
    saved.player.currentHP = 1
    idleUntilHit(saved)
    expect(saved.campaign.battle).toBeNull()
    expect(saved.losses).toBe(1)
    expect([saved.player.instanceId, ...saved.followers.map(m => m.instanceId)]).toEqual([lead, bench])
    expect(saved.campaign.badges).toEqual([])
  })
})
