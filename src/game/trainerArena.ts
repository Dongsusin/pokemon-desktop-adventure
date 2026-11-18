import type { Move, Position } from './engine'
import { arenaCastFrame, arenaCastTouches, arenaDistance, arenaHeightRatio, arenaMoveProfile, castDuration, createArenaCast,
  type ArenaCast, type ArenaSide } from './arenaMoves'

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
  kind: 'hit' | 'miss' | 'switch' | 'heal' | 'dodge'
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
    casts: [], nextCastId: 1, dodgeCharges: maxCharges, dodgeMs: 0, dodgeDirection: zero(),
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

export function restoreArena(value: unknown, roster: string[], fainted: boolean, enemyMove: Move, playerMove: (id: string) => Move | undefined): TrainerArena {
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
      const cast = createArenaCast(id, saved.side, move, point(saved.origin, arena[saved.side]), point(saved.target, arena.player))
      if (saved.legacyWarning && saved.side === 'enemy' && object(saved.profile)) {
        setLegacyProfile(cast, saved.profile.startupMs, saved.profile.radius)
        cast.target = point(saved.target, arena.player)
      }
      cast.elapsedMs = number(saved.elapsedMs, 0, 0, castDuration(cast))
      if (cast.elapsedMs >= castDuration(cast)) continue
      cast.resolved = saved.resolved === true || cast.elapsedMs >= cast.profile.startupMs + cast.profile.activeMs
      if (cast.resolved) cast.result = saved.result === 'hit' ? 'hit' : 'miss'
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
  refreshTelegraph(arena)
  return arena
}

function setLegacyProfile(cast: ArenaCast, duration: unknown, radius: unknown) {
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

export function beginArenaCast(arena: TrainerArena, side: ArenaSide, move: Move): ArenaCast {
  const target = side === 'enemy' ? arena.player : arena.enemy
  const cast = createArenaCast(arena.nextCastId++, side, move, arena[side], target)
  arena.casts.push(cast)
  if (side === 'player') arena.facing = arenaCastFrame(cast).direction
  refreshTelegraph(arena)
  return cast
}

export function clearArenaCasts(arena: TrainerArena) {
  arena.casts = []
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
  arena.direction = { x, y }
  if (x || y) arena.facing = { x, y }
  return true
}

export function dodgeArena(arena: TrainerArena): boolean {
  if (arena.paused || arena.needsSwitch || arena.dodgeCharges <= 0 || arena.dodgeMs > 0) return false
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

export interface ArenaImpact { cast: ArenaCast; hit: boolean; position: Position }

export function arenaStepMs(arena: TrainerArena, remaining: number) {
  // Split movement at exact changes in phase, roll and invulnerability. Short
  // integration steps also let the next actor react to a KO immediately.
  const edges = [arena.dodgeMs, arena.invulnerableMs, arena.dodgeMs - (rollMs - dodgeIFrameStart), arena.enemyInMs]
  for (const cast of arena.casts) {
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

export function stepArena(arena: TrainerArena, elapsed: number, playerSpeed: number, enemySpeed: number, selected: Move): ArenaImpact[] {
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
  for (const cast of arena.casts) {
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
    if (cast.resolved) continue
    const touches = arenaCastTouches(cast, start, cast.elapsedMs, from[victim], arena[victim])
    const hit = touches && (cast.side === 'player' || !invulnerable)
    // A dodged shot passes through; the Pokémon may still walk into a held
    // beam or a persistent area after invulnerability expires.
    if (!hit && cast.elapsedMs < p.startupMs + p.activeMs) continue
    cast.resolved = true
    cast.result = hit ? 'hit' : 'miss'
    impacts.push({ cast, hit, position: { ...(p.kind === 'self' ? arena[cast.side] : arena[victim]) } })
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
    const cast = beginArenaCast(arena, 'enemy', selected)
    arena.enemyInMs = castDuration(cast) + 850
  }
  refreshTelegraph(arena)
  return impacts
}
