import type { Move, Position } from './engine'

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
  dodgeCooldownMs: number
  invulnerableMs: number
  skillLockMs: number
  switchCooldownMs: number
  enemyInMs: number
  telegraph: ArenaTelegraph | null
  feedback: ArenaFeedback | null
}

// Coordinates are fractions of the 16:9 playfield. Distances use its width.
const heightRatio = 9 / 16
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const zero = (): Position => ({ x: 0, y: 0 })

export function createArena(partyOrder: string[]): TrainerArena {
  return {
    player: { x: 0.34, y: 0.53 }, enemy: { x: 0.64, y: 0.53 }, direction: zero(), facing: { x: 1, y: 0 },
    partyOrder, participants: partyOrder.slice(0, 1), paused: false, needsSwitch: false,
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

export function restoreArena(value: unknown, roster: string[], fainted: boolean): TrainerArena {
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
  arena.dodgeCooldownMs = number(value.dodgeCooldownMs, 0, 0, 3000)
  arena.invulnerableMs = number(value.invulnerableMs, 0, 0, 350)
  arena.skillLockMs = number(value.skillLockMs, 0, 0, 1000)
  arena.switchCooldownMs = number(value.switchCooldownMs, 0, 0, 3000)
  arena.enemyInMs = number(value.enemyInMs, arena.enemyInMs, 0, 2500)
  const warning = value.telegraph
  if (!fainted && object(warning) && typeof warning.moveName === 'string') {
    const durationMs = number(warning.durationMs, 850, 250, 1500)
    arena.telegraph = {
      center: point(warning.center, arena.player), radius: number(warning.radius, 0.12, 0.06, 0.25),
      durationMs, remainingMs: number(warning.remainingMs, durationMs, 0, durationMs), moveName: warning.moveName.slice(0, 40),
    }
  }
  return arena
}

export function arenaDistance(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) * heightRatio)
}

export function moveRange(move: Move): number {
  if (move.category === 'healing') return 1
  if (move.category === 'special') return 0.58
  return move.id === 'vineWhip' || move.id === 'razorLeaf' ? 0.30 : 0.18
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
  if (arena.paused || arena.needsSwitch || arena.dodgeCooldownMs > 0) return false
  translate(arena.player, arena.facing, 0.115)
  arena.invulnerableMs = 320
  arena.dodgeCooldownMs = 1800
  return true
}

export function stepArena(arena: TrainerArena, elapsed: number, playerSpeed: number, enemySpeed: number, selected: Move): 'hit' | 'miss' | undefined {
  const seconds = elapsed / 1000
  const warning = arena.telegraph
  // Resolve the marked hit at its impact time even when a frame straddles it.
  const impactMs = warning && warning.remainingMs <= elapsed ? warning.remainingMs : elapsed
  translate(arena.player, arena.direction, playerSpeed * impactMs / 1000)
  const avoided = warning && (arena.invulnerableMs > impactMs || arenaDistance(arena.player, warning.center) > warning.radius)
  if (impactMs < elapsed) translate(arena.player, arena.direction, playerSpeed * (elapsed - impactMs) / 1000)
  arena.skillLockMs = Math.max(0, arena.skillLockMs - elapsed)
  arena.switchCooldownMs = Math.max(0, arena.switchCooldownMs - elapsed)
  arena.dodgeCooldownMs = Math.max(0, arena.dodgeCooldownMs - elapsed)
  arena.invulnerableMs = Math.max(0, arena.invulnerableMs - elapsed)
  if (warning) {
    warning.remainingMs -= elapsed
    if (warning.remainingMs > 0) return
    arena.telegraph = null
    arena.enemyInMs = 850
    return avoided ? 'miss' : 'hit'
  }
  arena.enemyInMs = Math.max(0, arena.enemyInMs - elapsed)
  const range = moveRange(selected)
  const distance = arenaDistance(arena.enemy, arena.player)
  if (distance > range * 0.82) {
    const direction = { x: arena.player.x - arena.enemy.x, y: (arena.player.y - arena.enemy.y) * heightRatio }
    translate(arena.enemy, direction, Math.min(distance - range * 0.82, enemySpeed * seconds))
  }
  if (arena.enemyInMs > 0 || arenaDistance(arena.enemy, arena.player) > range) return
  const ranged = selected.category === 'special'
  const durationMs = ranged ? 900 : 760
  arena.telegraph = {
    center: { ...arena.player }, radius: ranged ? 0.14 : 0.095, remainingMs: durationMs, durationMs, moveName: selected.nameKo,
  }
}
