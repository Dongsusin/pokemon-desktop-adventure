import type { Move, Position } from './engine'
import { arenaCastFrame, arenaCastTouches, beamPulseMs, beamRounds, arenaDistance, arenaHeightRatio, arenaMoveProfile, castDuration, createArenaCast,
  type ArenaCast, type ArenaSide, type ArenaSpriteRefs } from './arenaMoves'

import { escapeBeamClash, setClashPoint, stepBeamClash, type BeamClash, type BeamClashResult } from './arenaBeams'

export { arenaDistance } from './arenaMoves'

export interface ArenaTelegraph {
  center: Position
  radius: number
  remainingMs: number
  durationMs: number
  moveName: string
}

export interface ArenaFeedback {
  id: number
  text: string
  actor: 'player' | 'enemy' | 'system'
  kind: 'hit' | 'miss' | 'switch' | 'heal' | 'dodge' | 'clash-win' | 'clash-draw' | 'clash-break'
  moveType?: string
  moveId?: string
  castId?: number
  position?: Position
  amount?: number
}

export interface TrainerArena {
  player: Position
  enemy: Position
  direction: Position
  facing: Position
  partyOrder: string[]
  participants: string[]
  paused: boolean
  needsSwitch: boolean
  casts: ArenaCast[]
  beamClash: BeamClash | null
  lastClash?: BeamClashResult
  nextCastId: number
  dodgeCharges: number
  dodgeMs: number
  dodgeDirection: Position
  dodgeCooldownMs: number
  invulnerableMs: number
  skillLockMs: number
  switchCooldownMs: number
  enemyInMs: number
  telegraph: ArenaTelegraph | null
  feedback: ArenaFeedback | null
}

// Positions are fractions of the 1200 × 760 playfield. Distances use its width.
const heightRatio = arenaHeightRatio
export const dodgeRechargeMs = 3200
const rollMs = 14 * 1000 / 60
const dodgeIFrameStart = 1000 / 60
const dodgeIFrameEnd = 10 * 1000 / 60
const maxCharges = 2
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const zero = (): Position => ({ x: 0, y: 0 })

export function createArena(partyOrder: string[]): TrainerArena {
  return {
    player: { x: 230 / 1200, y: .5 }, enemy: { x: 970 / 1200, y: .5 }, direction: zero(), facing: { x: 1, y: 0 },
    partyOrder, participants: partyOrder.slice(0, 1), paused: false, needsSwitch: false,
    casts: [], beamClash: null, nextCastId: 1, dodgeCharges: maxCharges, dodgeMs: 0, dodgeDirection: zero(),
    dodgeCooldownMs: 0, invulnerableMs: 0, skillLockMs: 0, switchCooldownMs: 0, enemyInMs: 1150,
    telegraph: null, feedback: null,
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function number(value: unknown, fallback: number, lo: number, hi: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, lo, hi) : fallback
}

function point(value: unknown, fallback: Position): Position {
  return object(value) ? { x: number(value.x, fallback.x, 0.05, 0.95), y: number(value.y, fallback.y, 0.10, 0.90) } : fallback
}

export function restoreArena(value: unknown, roster: string[], fainted: boolean, enemyMove: Move, playerMove: (id: string) => Move | undefined, sprites?: ArenaSpriteRefs): TrainerArena {
  const arena = createArena(roster)
  arena.paused = true
  arena.needsSwitch = fainted
  if (!object(value)) return arena
  if (Array.isArray(value.partyOrder)) {
    const saved = value.partyOrder.filter((id): id is string => roster.includes(id))
    arena.partyOrder = [...new Set([...saved, ...roster])]
  }
  if (Array.isArray(value.participants)) {
    arena.participants = [...new Set([roster[0], ...value.participants.filter((id): id is string => roster.includes(id))])]
  }
  arena.player = point(value.player, arena.player)
  arena.enemy = point(value.enemy, arena.enemy)
  if (object(value.facing)) {
    const x = number(value.facing.x, 0, -1, 1)
    const y = number(value.facing.y, 0, -1, 1)
    if (x || y) arena.facing = { x, y }
  }
  arena.dodgeCooldownMs = number(value.dodgeCooldownMs, 0, 0, dodgeRechargeMs)
  arena.dodgeCharges = Math.floor(number(value.dodgeCharges, arena.dodgeCooldownMs ? 1 : 2, 0, maxCharges))
  if (arena.dodgeCharges === maxCharges) arena.dodgeCooldownMs = 0
  else if (arena.dodgeCooldownMs === 0) arena.dodgeCooldownMs = dodgeRechargeMs
  arena.dodgeMs = number(value.dodgeMs, 0, 0, rollMs)
  if (object(value.dodgeDirection)) arena.dodgeDirection = {
    x: number(value.dodgeDirection.x, 0, -1, 1), y: number(value.dodgeDirection.y, 0, -1, 1),
  }
  arena.invulnerableMs = number(value.invulnerableMs, 0, 0, 350)
  arena.skillLockMs = number(value.skillLockMs, 0, 0, 4000)
  arena.switchCooldownMs = number(value.switchCooldownMs, 0, 0, 3000)
  arena.enemyInMs = number(value.enemyInMs, arena.enemyInMs, 0, 5000)
  arena.nextCastId = Math.floor(number(value.nextCastId, 1, 1, Number.MAX_SAFE_INTEGER - 1))
  if (fainted) return arena
  if (Array.isArray(value.casts)) {
    for (const saved of value.casts.slice(0, 2)) {
      if (!object(saved) || (saved.side !== 'enemy' && saved.side !== 'player') || typeof saved.moveId !== 'string') continue
      if (arena.casts.some(cast => cast.side === saved.side)) continue
      const move = saved.side === 'enemy' ? enemyMove : playerMove(saved.moveId)
      if (!move || move.id !== saved.moveId) continue
      const id = Math.floor(number(saved.id, arena.nextCastId, 1, Number.MAX_SAFE_INTEGER - 1))
      if (arena.casts.some(cast => cast.id === id)) continue
      const emitter = object(saved.emitter) ? saved.emitter : undefined
      const lockedAim = emitter && object(saved.target) ? { x: number(saved.target.x, arena.player.x, -.5, 1.5),
        y: number(saved.target.y, arena.player.y, -.5, 1.5) } : undefined
      const cast = createArenaCast(id, saved.side, move, point(emitter?.feet ?? saved.origin, arena[saved.side]),
        point(emitter?.targetFeet ?? saved.target, arena[saved.side === 'player' ? 'enemy' : 'player']), emitter ? sprites : undefined, lockedAim)
      if (saved.legacyWarning && saved.side === 'enemy' && object(saved.profile)) {
        setLegacyProfile(cast, saved.profile.startupMs, saved.profile.radius)
        cast.target = point(saved.target, arena.player)
      }
      cast.elapsedMs = number(saved.elapsedMs, 0, 0, castDuration(cast))
      if (cast.elapsedMs >= castDuration(cast)) continue
      cast.resolved = saved.resolved === true || cast.elapsedMs >= cast.profile.startupMs + cast.profile.activeMs
      if (cast.resolved) cast.result = saved.result === 'hit' ? 'hit' : 'miss'
      if (!cast.beam && cast.result === 'hit' && object(saved.impact) && object(saved.impact.position)) {
        const { x, y } = saved.impact.position
        const time = saved.impact.elapsedMs
        if (typeof x === 'number' && Number.isFinite(x) && x >= -.5 && x <= 1.5 &&
            typeof y === 'number' && Number.isFinite(y) && y >= -.5 && y <= 1.5 &&
            typeof time === 'number' && time >= cast.profile.startupMs && time <= cast.elapsedMs) {
          cast.impact = { position: { x, y }, elapsedMs: time }
        }
      }
      if (cast.beam) {
        const rounds = beamRounds(cast)
        const elapsedPulses = clamp(Math.floor((cast.elapsedMs - cast.profile.startupMs + .00001) / beamPulseMs), 0, rounds)
        const beam = object(saved.beam) ? saved.beam : {}
        cast.beam.pulses = Math.floor(number(beam.pulses, elapsedPulses, 0, elapsedPulses))
        cast.beam.hits = Math.floor(number(beam.hits, 0, 0, elapsedPulses))
        cast.beam.spent = beam.spent === true || (!saved.beam && cast.resolved)
        if (cast.beam.hits || cast.beam.spent) {
          cast.result = saved.result === 'miss' ? 'miss' : 'hit'
          if (object(beam.lastHit)) cast.beam.lastHit = {
            x: number(beam.lastHit.x, cast.target.x, -.5, 1.5), y: number(beam.lastHit.y, cast.target.y, -.5, 1.5) }
          if (typeof beam.budget === 'number') cast.beam.budget = number(beam.budget, 0, 0, 1_000_000)
          cast.beam.applied = number(beam.applied, 0, 0, cast.beam.budget ?? 0)
        }
      }
      arena.casts.push(cast)
      arena.nextCastId = Math.max(arena.nextCastId, id + 1)
    }
  } else {
    // v0.17 represented every warning as a stationary circle. Preserve this
    // already-committed impact before the opponent starts using its new moves.
    const warning = value.telegraph
    if (object(warning) && typeof warning.moveName === 'string') {
      const cast = createArenaCast(arena.nextCastId++, 'enemy', enemyMove, arena.enemy, point(warning.center, arena.player))
      setLegacyProfile(cast, warning.durationMs, warning.radius)
      cast.target = point(warning.center, arena.player)
      cast.elapsedMs = cast.profile.startupMs - number(warning.remainingMs, cast.profile.startupMs, 0, cast.profile.startupMs)
      arena.casts.push(cast)
    }
  }
  const held = value.beamClash
  if (object(held)) {
    const source = arena.casts.find(c => c.side === 'player' && c.id === held.playerCastId && c.beam && !c.resolved)
    const foe = arena.casts.find(c => c.side === 'enemy' && c.id === held.enemyCastId && c.beam && !c.resolved)
    if (source && foe && arenaCastFrame(source).phase === 'active' && arenaCastFrame(foe).phase === 'active') {
      arena.beamClash = { playerCastId: source.id, enemyCastId: foe.id, point: source.origin,
        origin: number(held.origin, .5, 0, 1), balance: number(held.balance, 0, -1, 1),
        ratio: number(held.ratio, 1, .00001, 100_000), elapsedMs: number(held.elapsedMs, 0, 0, 2500) }
      setClashPoint(arena.beamClash, source, foe)
    }
  }
  refreshTelegraph(arena)
  return arena
}

function setLegacyProfile(cast: ArenaCast, duration: unknown, radius: unknown) {
  delete cast.beam
  cast.legacyWarning = true
  cast.profile = { kind: 'burst', range: 1, radius: number(radius, .12, .06, .25), spreadDeg: [0], halfAngleDeg: 0,
    startupMs: number(duration, 850, 250, 1500), activeMs: 1, recoveryMs: 125 }
}

function refreshTelegraph(arena: TrainerArena) {
  const warning = arena.casts.find(cast => cast.side === 'enemy' && cast.elapsedMs < cast.profile.startupMs)
  arena.telegraph = warning ? {
    center: { ...warning.target }, radius: warning.profile.radius || .055,
    remainingMs: warning.profile.startupMs - warning.elapsedMs, durationMs: warning.profile.startupMs, moveName: warning.moveName,
  } : null
}

export function beginArenaCast(arena: TrainerArena, side: ArenaSide, move: Move, sprites?: ArenaSpriteRefs): ArenaCast {
  const target = side === 'enemy' ? arena.player : arena.enemy
  const cast = createArenaCast(arena.nextCastId++, side, move, arena[side], target, sprites)
  arena.casts.push(cast)
  if (side === 'player') arena.facing = arenaCastFrame(cast).direction
  refreshTelegraph(arena)
  return cast
}

export function clearArenaCasts(arena: TrainerArena) {
  arena.casts = []
  arena.beamClash = null
  arena.telegraph = null
  arena.skillLockMs = 0
}
function translate(from: Position, direction: Position, distance: number) {
  const length = Math.hypot(direction.x, direction.y)
  if (!length) return
  from.x = clamp(from.x + distance * direction.x / length, 0.05, 0.95)
  from.y = clamp(from.y + distance * direction.y / length / heightRatio, 0.10, 0.90)
}

export function moveArena(arena: TrainerArena, x: number, y: number): boolean {
  if (![-1, 0, 1].includes(x) || ![-1, 0, 1].includes(y)) return false
  if ((arena.paused || arena.needsSwitch) && (x || y)) return false
  escapeBeamClash(arena, { x, y })
  arena.direction = { x, y }
  if (x || y) arena.facing = { x, y }
  return true
}

export function dodgeArena(arena: TrainerArena): boolean {
  if (arena.paused || arena.needsSwitch || arena.dodgeCharges <= 0 || arena.dodgeMs > 0) return false
  escapeBeamClash(arena)
  arena.dodgeMs = rollMs
  arena.dodgeDirection = { ...(arena.direction.x || arena.direction.y ? arena.direction : arena.facing) }
  arena.invulnerableMs = dodgeIFrameEnd
  if (arena.dodgeCharges === maxCharges) arena.dodgeCooldownMs = dodgeRechargeMs
  arena.dodgeCharges--
  // A released projectile lives on while its user rolls. Interrupt a body-bound
  // attack so its old path cannot pull the Pokémon back after the dodge.
  arena.casts = arena.casts.filter(cast => cast.side === 'enemy' || cast.resolved ||
    (cast.elapsedMs >= cast.profile.startupMs && ['projectile', 'burst'].includes(cast.profile.kind)))
  return true
}

export interface ArenaImpact { cast: ArenaCast; hit: boolean; position: Position; beamShare?: number; silent?: boolean }

export function arenaStepMs(arena: TrainerArena, remaining: number) {
  // Split movement at exact changes in phase, roll and invulnerability. Short
  // integration steps also let the next actor react to a KO immediately.
  const edges = [arena.dodgeMs, arena.invulnerableMs, arena.dodgeMs - (rollMs - dodgeIFrameStart), arena.enemyInMs]
  if (arena.beamClash) edges.push(600 - arena.beamClash.elapsedMs, 2500 - arena.beamClash.elapsedMs)
  for (const cast of arena.casts) {
    if (cast.beam && !cast.resolved && !arena.beamClash) edges.push(cast.profile.startupMs + (cast.beam.pulses + 1) * beamPulseMs - cast.elapsedMs)
    for (const end of [cast.profile.startupMs, cast.profile.startupMs + cast.profile.activeMs, castDuration(cast)]) {
      edges.push(end - cast.elapsedMs)
    }
  }
  return Math.min(16, remaining, ...edges.filter(edge => edge > .00001))
}

function moveFighter(arena: TrainerArena, side: ArenaSide, elapsed: number, direction: Position, distance: number) {
  const cast = arena.casts.find(entry => entry.side === side)
  if (cast && cast.elapsedMs < cast.profile.startupMs + cast.profile.activeMs) {
    if (cast.profile.kind === 'dash' && cast.elapsedMs >= cast.profile.startupMs) {
      arena[side] = { ...arenaCastFrame(cast, cast.elapsedMs + elapsed).head }
      return
    }
    if (cast.elapsedMs < cast.profile.startupMs || cast.profile.kind !== 'projectile') return
  }
  translate(arena[side], direction, distance)
}

export function stepArena(arena: TrainerArena, elapsed: number, playerSpeed: number, enemySpeed: number, selected: Move,
  sprites?: ArenaSpriteRefs, strengthRatio: (a: ArenaCast, b: ArenaCast) => number = () => 1): ArenaImpact[] {
  const seconds = elapsed / 1000
  const from = { player: { ...arena.player }, enemy: { ...arena.enemy } }
  const rolling = arena.dodgeMs > .00001
  const invulnerable = arena.invulnerableMs > .00001 && (!rolling || rollMs - arena.dodgeMs >= dodgeIFrameStart - .00001)
  if (rolling) translate(arena.player, arena.dodgeDirection, .125 * elapsed / rollMs)
  else moveFighter(arena, 'player', elapsed, arena.direction, playerSpeed * seconds)
  const range = arenaMoveProfile(selected).range
  const distance = arenaDistance(arena.enemy, arena.player)
  const direction = { x: arena.player.x - arena.enemy.x, y: (arena.player.y - arena.enemy.y) * heightRatio }
  moveFighter(arena, 'enemy', elapsed, direction, Math.min(Math.max(0, distance - range * .80), enemySpeed * seconds))

  const impacts: ArenaImpact[] = []
  const held = arena.beamClash
  const starts = arena.casts.map(c => c.elapsedMs)
  for (const cast of arena.casts) {
    if (held && (cast.id === held.playerCastId || cast.id === held.enemyCastId)) continue
    const victim = cast.side === 'player' ? 'enemy' : 'player'
    const p = cast.profile
    const start = cast.elapsedMs
    cast.elapsedMs = Math.min(castDuration(cast), start + elapsed)
    if (p.trackMs && start < p.trackMs) {
      const aim = arena[victim]
      const distance = arenaDistance(cast.origin, aim)
      const f = distance > p.range ? p.range / distance : 1
      cast.target = { x: cast.origin.x + (aim.x - cast.origin.x) * f, y: cast.origin.y + (aim.y - cast.origin.y) * f }
    }
  }
  stepBeamClash(arena, elapsed, strengthRatio, impacts)
  for (const [index, cast] of arena.casts.entries()) {
    if (cast.resolved || (arena.beamClash && cast.beam)) continue
    const victim = cast.side === 'player' ? 'enemy' : 'player'
    const p = cast.profile, start = starts[index]
    if (cast.beam) {
      const beam = cast.beam, rounds = beamRounds(cast)
      // The channel clock stops during a clash. Only scheduled 12-frame
      // samples test contact; leaving and re-entering never catches up old hits.
      const next = p.startupMs + (beam.pulses + 1) * beamPulseMs
      if (beam.pulses < rounds && cast.elapsedMs + .00001 >= next) {
        beam.pulses++
        const sample = Math.min(next, p.startupMs + p.activeMs - .000001)
        if ((cast.side === 'player' || !invulnerable) && arenaCastTouches(cast, sample, sample, arena[victim], arena[victim])) {
          const at = arena[victim], offset = cast.victimOffset ?? { x: 0, y: 0 }
          beam.lastHit = { x: at.x + offset.x, y: at.y + offset.y }
          beam.hits++
          cast.result = 'hit'
          impacts.push({ cast, hit: true, position: beam.lastHit, beamShare: 1 / rounds })
        }
      }
      if (cast.elapsedMs + .00001 >= p.startupMs + p.activeMs) {
        cast.resolved = true
        if (!beam.hits) {
          cast.result = 'miss'
          impacts.push({ cast, hit: false, position: { ...arena[victim] } })
        }
      }
      continue
    }
    const touches = arenaCastTouches(cast, start, cast.elapsedMs, from[victim], arena[victim])
    const hit = touches && (cast.side === 'player' || !invulnerable)
    // A dodged shot passes through; the Pokémon may still walk into a held
    // beam or a persistent area after invulnerability expires.
    if (!hit && cast.elapsedMs < p.startupMs + p.activeMs) continue
    cast.resolved = true
    cast.result = hit ? 'hit' : 'miss'
    const at = p.kind === 'self' ? arena[cast.side] : arena[victim]
    const position = cast.victimOffset ? { x: at.x + cast.victimOffset.x, y: at.y + cast.victimOffset.y } : { ...at }
    if (hit) cast.impact = { position, elapsedMs: cast.elapsedMs }
    impacts.push({ cast, hit, position })
  }
  arena.casts = arena.casts.filter(cast => cast.elapsedMs < castDuration(cast))
  for (const field of ['skillLockMs', 'switchCooldownMs', 'invulnerableMs', 'dodgeMs'] as const) {
    arena[field] = Math.max(0, arena[field] - elapsed)
    if (arena[field] < .00001) arena[field] = 0
  }
  if (arena.dodgeCharges < maxCharges) {
    arena.dodgeCooldownMs -= elapsed
    if (arena.dodgeCooldownMs <= .00001) {
      arena.dodgeCharges++
      arena.dodgeCooldownMs = arena.dodgeCharges < maxCharges ? arena.dodgeCooldownMs + dodgeRechargeMs : 0
    }
  }
  arena.enemyInMs = Math.max(0, arena.enemyInMs - elapsed)
  if (!arena.casts.some(cast => cast.side === 'enemy') && arena.enemyInMs <= .00001 && arenaDistance(arena.enemy, arena.player) <= range) {
    const cast = beginArenaCast(arena, 'enemy', selected, sprites)
    arena.enemyInMs = castDuration(cast) + 850
  }
  refreshTelegraph(arena)
  return impacts
}
