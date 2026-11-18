import { describe, expect, it } from 'vitest'
import { applyOffline, arenaSkills, createGame, dispatch, hydrateSave, playerStats, tick, type GameSave } from '../src/game/engine'
import { arenaCastFrame } from '../src/game/arenaMoves'
import { castSkill, finishChallenge, idleUntilHit } from './trainerArenaDriver'

const bounds = { width: 1280, height: 720 }
const time = Date.UTC(2026, 9, 1)

function gym(withBench = false, starter = 'squirtle') {
  const g = createGame(starter, 1, bounds, time, 19)
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

  it('commits an out-of-range miss, charges its cooldown and lets the player close for the next hit', () => {
    const game = gym(), a = arena(game)
    const start = { ...a.player }
    const skill = arenaSkills(game)[0]
    expect(skill.move.id).toBe('tackle')
    expect(skill.inRange).toBe(false)
    const initialHP = game.wild[0].currentHP
    expect(dispatch(game, { type: 'arena-skill', slot: 0 })).toBe(true)
    const distant = a.casts[0]
    expect(arenaCastFrame(distant).phase).toBe('windup')
    expect(arenaSkills(game)[0].cooldownMs).toBeGreaterThan(0)
    expect(dispatch(game, { type: 'arena-skill', slot: 0 })).toBe(false)
    until(game, () => distant.resolved)
    expect(distant.result).toBe('miss')
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
    const warned = arena(hit).casts.find(cast => cast.side === 'enemy')!
    const ticks = Math.ceil((mark.remainingMs + warned.profile.activeMs) / 100) + 1
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
    expect(arena(restored).casts).toEqual(arena(game).casts)
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

  it('locks the beam to its shown aim and resolves damage only on contact', () => {
    const standing = gym(), a = arena(standing)
    standing.wild[0].speciesId = 'squirtle'
    a.player = { x: 0.36, y: 0.5 }
    a.enemy = { x: 0.57, y: 0.5 }
    a.enemyInMs = 0
    tick(standing, 16, bounds)
    const cast = a.casts.find(c => c.side === 'enemy')!
    expect(cast.moveId).toBe('waterGun')
    expect(cast.profile.kind).toBe('beam')
    const hp = standing.player.currentHP
    const escaping = structuredClone(standing)
    dispatch(escaping, { type: 'arena-move', x: 0, y: 1 })
    for (let t = cast.elapsedMs; t + 16 < cast.profile.startupMs; t += 16) {
      tick(standing, 16, bounds)
      tick(escaping, 16, bounds)
      expect(standing.player.currentHP).toBe(hp)
      expect(escaping.player.currentHP).toBe(hp)
    }
    const escapedCast = arena(escaping).casts.find(c => c.id === cast.id)!
    expect(escapedCast.target).toEqual(cast.target)
    for (let i = 0; i < 180 && (!cast.resolved || !escapedCast.resolved); i++) {
      tick(standing, 16, bounds)
      tick(escaping, 16, bounds)
    }
    expect(cast.result).toBe('hit')
    expect(standing.player.currentHP).toBeLessThan(hp)
    expect(escapedCast.result).toBe('miss')
    expect(escaping.player.currentHP).toBe(hp)
  })

  it('records a missed shot and the following hit independently, charging cooldown on commit', () => {
    const game = gym(), a = arena(game)
    a.enemyInMs = 20000
    a.player = { x: 0.54, y: 0.35 }
    a.enemy = { x: 0.69, y: 0.35 }
    game.wild[0].speciesId = 'squirtle'
    game.player.moveIds = ['waterGun', 'ember']
    const initialHP = game.wild[0].currentHP
    expect(dispatch(game, { type: 'arena-skill', slot: 0 })).toBe(true)
    const first = a.casts.find(c => c.side === 'player')!
    expect(arenaCastFrame(first).phase).toBe('windup')
    expect(arenaSkills(game)[0].cooldownMs).toBeGreaterThan(0)
    expect(dispatch(game, { type: 'arena-skill', slot: 0 })).toBe(false)
    expect(game.wild[0].currentHP).toBe(initialHP)
    a.enemy = { x: 0.69, y: 0.82 }
    for (let i = 0; i < 200 && arenaSkills(game)[1].cooldownMs > 0; i++) tick(game, 16, bounds)
    expect(dispatch(game, { type: 'arena-skill', slot: 1 })).toBe(true)
    const second = a.casts.find(c => c.side === 'player' && c.id !== first.id)!
    expect(second.moveId).toBe('ember')
    const target = game.wild[0]
    for (let i = 0; i < 180 && (!first.resolved || !second.resolved); i++) tick(game, 16, bounds)
    expect(first.result).toBe('miss')
    expect(second.result).toBe('hit')
    expect(target.currentHP).toBeLessThan(initialHP)
    const hpAfterHit = target.currentHP
    frames(game, 4)
    expect(target.currentHP).toBe(hpAfterHit)
  })

  it('saves an in-flight projectile, freezes it while paused and never reapplies its hit on recovery', () => {
    const game = gym(false, 'charmander'), a = arena(game)
    game.player.moveIds = ['ember', 'tackle']
    a.player = { x: 0.27, y: 0.5 }
    a.enemy = { x: 0.55, y: 0.5 }
    a.enemyInMs = 20000
    expect(dispatch(game, { type: 'arena-skill', slot: 0 })).toBe(true)
    const cast = a.casts[0]
    for (let i = 0; i < 120 && arenaCastFrame(cast).phase === 'windup'; i++) tick(game, 12, bounds)
    expect(arenaCastFrame(cast).phase).toBe('active')
    expect(cast.resolved).toBe(false)
    const saved = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    const savedCast = arena(saved).casts.find(c => c.id === cast.id)!
    expect(savedCast).toEqual(cast)
    const hp = saved.wild[0].currentHP
    const timeAtSave = savedCast.elapsedMs
    frames(saved, 15)
    expect(savedCast.elapsedMs).toBe(timeAtSave)
    expect(saved.wild[0].currentHP).toBe(hp)
    dispatch(saved, { type: 'arena-pause', paused: false })
    for (let i = 0; i < 160 && !savedCast.resolved; i++) tick(saved, 12, bounds)
    expect(savedCast.result).toBe('hit')
    expect(savedCast.impact?.position.x).toBeCloseTo(arena(saved).enemy.x + (savedCast.victimOffset?.x ?? 0), 2)
    expect(savedCast.impact?.position.y).toBeCloseTo(arena(saved).enemy.y + (savedCast.victimOffset?.y ?? 0), 2)
    expect(savedCast.impact!.elapsedMs).toBeGreaterThanOrEqual(savedCast.profile.startupMs)
    expect(saved.wild[0].currentHP).toBeLessThan(hp)
    const landed = hydrateSave(JSON.parse(JSON.stringify(saved)), 1)!
    const after = landed.wild[0].currentHP
    expect(arena(landed).casts.find(c => c.id === cast.id)?.impact).toEqual(savedCast.impact)
    dispatch(landed, { type: 'arena-pause', paused: false })
    frames(landed, 8)
    expect(landed.wild[0].currentHP).toBe(after)
  })

  it('uses separate dodge charges, rejects same-instant repeats, and recharges one at a time', () => {
    const game = gym(), a = arena(game)
    expect(a.dodgeCharges).toBe(2)
    expect(dispatch(game, { type: 'arena-dodge' })).toBe(true)
    expect(a.dodgeCharges).toBe(1)
    expect(dispatch(game, { type: 'arena-dodge' })).toBe(false)
    frames(game, 4)
    expect(dispatch(game, { type: 'arena-dodge' })).toBe(true)
    expect(a.dodgeCharges).toBe(0)
    frames(game, 4)
    expect(dispatch(game, { type: 'arena-dodge' })).toBe(false)
    until(game, () => a.dodgeCharges === 1)
    const saved = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(arena(saved).dodgeCharges).toBe(1)
    expect(arena(saved).dodgeCooldownMs).toBe(a.dodgeCooldownMs)
    dispatch(saved, { type: 'arena-pause', paused: false })
    until(saved, () => arena(saved).dodgeCharges === 2)
  })

  it('requires a living replacement after a faint and restores the registered formation at settlement', () => {
    const g = gym(true), lead = g.player.instanceId, bench = g.followers[0].instanceId
    expect(arena(g).partyOrder).toEqual([lead, bench])
    expect(dispatch(g, { type: 'arena-switch', instanceId: 'not-owned' })).toBe(false)
    g.player.currentHP = 1
    idleUntilHit(g)
    expect(arena(g).needsSwitch).toBe(true)
    expect(arena(g).casts).toEqual([])
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
