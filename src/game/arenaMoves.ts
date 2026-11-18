import type { Move, Position } from './engine'
import { arenaBodyPoint, arenaMuzzlePoint, type ArenaSpriteRef } from './arenaMuzzle'

export type ArenaSpriteRefs = Partial<Record<ArenaSide, ArenaSpriteRef>>
export const beamPulseMs = 200
export const fullBeamMultiplier = 1.45
export const beamRounds = (cast: ArenaCast) => Math.max(1, Math.floor((cast.profile.activeMs + .00001) / beamPulseMs))

export type ArenaSide = 'player' | 'enemy'
export type ArenaShape = 'dash' | 'projectile' | 'beam' | 'cone' | 'burst' | 'self'

// Positions are viewport fractions. All lengths and angles use square world units
// measured in arena widths, including the Y component of direction vectors.
export const arenaHeightRatio = 760 / 1200
export interface ArenaMoveProfile {
  kind: ArenaShape
  range: number
  radius: number
  halfAngleDeg: number
  spreadDeg: number[]
  growthMs?: number
  lobSpeed?: number
  trackMs?: number
  startupMs: number
  activeMs: number
  recoveryMs: number
}

// Base move footprints measured on Resonance v3.0.0's 1200-wide battle field.
const field = 1200
const ticks = (n: number) => n * 1000 / 60
function profile(kind: ArenaShape, reach: number, radius: number, startupMs: number, activeMs: number, recoveryMs: number, halfAngleDeg = 0): ArenaMoveProfile {
  return { kind, range: reach / field, radius: radius / field, halfAngleDeg, startupMs, activeMs, recoveryMs, spreadDeg: [0] }
}
function melee(kind: 'dash' | 'cone', medium = false, priority = false, accuracyTax = 0) {
  const reach = (priority ? 160 : 120) + 70
  return profile(kind, reach, kind === 'dash' ? 45 : 0, ticks((priority ? 4 : medium ? 17 : 12) + accuracyTax),
    ticks(medium ? 5 : 4), ticks(medium ? 16 : 12), 50)
}
function projectile(speed: number, radius: number, startup: number, recovery = 12) {
  return profile('projectile', 690, radius, ticks(startup), 690 / speed * 1000, ticks(recovery))
}
function beam(power: number, medium = false) {
  const reach = Math.max(360, Math.min(690, 180 + 4.1 * power))
  return { ...profile('beam', reach, 13 * 1.5 / 2, ticks(medium ? 14 : 10), (1 + power / 150) * 1000, ticks(medium ? 16 : 12)),
    growthMs: reach / 1100 * 1000 }
}
const techniques: Record<string, ArenaMoveProfile> = {
  tackle: melee('dash'),
  flameCharge: melee('dash'),
  shadowSneak: melee('dash', false, true),
  scratch: melee('cone'),
  vineWhip: melee('cone'),
  bugBite: melee('cone', true),
  lowKick: melee('cone', true),
  bite: melee('cone', true),
  metalClaw: melee('cone', false, false, 2),
  waterGun: beam(40),
  thunderShock: beam(40),
  dragonBreath: beam(60, true),
  ember: projectile(528, 16, 10),
  gust: projectile(528, 16, 10),
  fairyWind: projectile(528, 16, 10),
  poisonSting: projectile(473, 16, 10),
  mudShot: projectile(528, 16, 16, 16),
  iceShard: projectile(770, 16, 4),
  waterPulse: projectile(528, 16, 14, 16),
  razorLeaf: { ...projectile(430, 13, 16, 16), spreadDeg: [-14, 0, 14] },
  // The lob travels to the aimed location and checks its blast at landing.
  rockThrow: { ...profile('burst', 690, 48, ticks(14), ticks(2), ticks(12)), lobSpeed: 430 / field },
  confusion: { ...profile('burst', 480, 110, ticks(10) + 900, ticks(2), ticks(12)), trackMs: 600 },
  recover: profile('self', 0, 85, 800, ticks(2), ticks(12)),
}

export function arenaMoveProfile(move: Pick<Move, 'id'>): ArenaMoveProfile {
  return techniques[move.id] ?? techniques.tackle
}

export interface ArenaCast {
  id: number
  side: ArenaSide
  moveId: string
  moveName: string
  moveType: string
  profile: ArenaMoveProfile
  origin: Position
  target: Position
  end: Position
  elapsedMs: number
  resolved: boolean
  result?: 'hit' | 'miss'
  legacyWarning?: boolean
  emitter?: { feet: Position; targetFeet: Position; facing: Position }
  victimOffset?: Position
  impact?: { position: Position; elapsedMs: number }
  clashBreakthrough?: boolean
  beamStop?: Position
  beam?: { pulses: number; hits: number; lastHit?: Position; budget?: number; applied: number; spent: boolean }
}

const clamp01 = (n: number) => Math.max(0, Math.min(n, 1))
const lerpPoint = (a: Position, b: Position, f: number): Position => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f })
const delta = (a: Position, b: Position) => ({ x: b.x - a.x, y: (b.y - a.y) * arenaHeightRatio })
const dot = (a: Position, b: Position) => a.x * b.x + a.y * b.y
const cross = (a: Position, b: Position) => a.x * b.y - a.y * b.x

export function arenaDistance(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) * arenaHeightRatio)
}

export function arenaAim(from: Position, to: Position, side: ArenaSide): Position {
  const d = delta(from, to)
  const length = Math.hypot(d.x, d.y)
  return length ? { x: d.x / length, y: d.y / length } : { x: side === 'player' ? 1 : -1, y: 0 }
}

export function createArenaCast(id: number, side: ArenaSide, move: Move, origin: Position, target: Position, sprites?: ArenaSpriteRefs, lockedAim?: Position): ArenaCast {
  const base = arenaMoveProfile(move)
  const feet = origin, targetFeet = target
  const shooter = sprites?.[side], victim = sprites?.[side === 'player' ? 'enemy' : 'player']
  const ranged = base.kind === 'beam' || base.kind === 'projectile' || Boolean(base.lobSpeed)
  let victimOffset: Position | undefined
  if (ranged && victim && !base.lobSpeed) {
    target = arenaBodyPoint(targetFeet, victim)
    victimOffset = { x: target.x - targetFeet.x, y: target.y - targetFeet.y }
    if (lockedAim) target = lockedAim
  }
  const facing = ranged && shooter ? arenaAim(arenaBodyPoint(feet, shooter), target, side) : undefined
  if (facing && shooter) origin = arenaMuzzlePoint(feet, facing, shooter)
  const distance = arenaDistance(origin, target)
  // The player may cast with the opponent beyond reach. A ground mark then
  // lands at maximum range along the aimed direction.
  const mark = base.kind === 'burst' && distance > base.range ? lerpPoint(origin, target, base.range / distance) : target
  const profile = base.lobSpeed ? { ...base, startupMs: base.startupMs + arenaDistance(origin, mark) / base.lobSpeed * 1000 } : base
  const direction = arenaAim(origin, target, side)
  // Rushes stop just in front of the locked target. A moving target can escape;
  // a fired shot keeps flying down its initial heading to its full range.
  const reach = profile.kind === 'dash' ? Math.min(profile.range, Math.max(0, distance - profile.radius * .72)) : profile.range
  const end = { x: origin.x + direction.x * reach, y: origin.y + direction.y * reach / arenaHeightRatio }
  return { id, side, moveId: move.id, moveName: move.nameKo, moveType: move.type, profile,
    origin: { ...origin }, target: { ...mark }, end, elapsedMs: 0, resolved: false,
    ...(facing && { emitter: { feet: { ...feet }, targetFeet: { ...targetFeet }, facing } }),
    ...(victimOffset && { victimOffset }),
    ...(base.kind === 'beam' && { beam: { pulses: 0, hits: 0, applied: 0, spent: false } }) }
}

export function castDuration(cast: ArenaCast): number {
  const p = cast.profile
  return p.startupMs + p.activeMs + p.recoveryMs
}

export function arenaCastFrame(cast: ArenaCast, time = cast.elapsedMs) {
  const p = cast.profile
  const travel = clamp01((time - p.startupMs) / p.activeMs)
  const phase = time < p.startupMs ? 'windup' : time < p.startupMs + p.activeMs ? 'active' : 'recovery'
  const progress = phase === 'windup' ? clamp01(time / p.startupMs) : phase === 'active' ? travel
    : clamp01((time - p.startupMs - p.activeMs) / p.recoveryMs)
  const head = p.kind === 'burst' ? cast.target : p.kind === 'self' ? cast.origin : lerpPoint(cast.origin, cast.end, travel)
  const direction = arenaAim(cast.origin, cast.target, cast.side)
  const heads = p.spreadDeg.length === 1 ? [head] : p.spreadDeg.map(degrees => {
    const angle = degrees * Math.PI / 180
    const x = direction.x * Math.cos(angle) - direction.y * Math.sin(angle)
    const y = direction.y * Math.cos(angle) + direction.x * Math.sin(angle)
    return { x: cast.origin.x + x * travel * p.range, y: cast.origin.y + y * travel * p.range / arenaHeightRatio }
  })
  const origin = cast.origin
  const facing = cast.emitter?.facing ?? direction
  const length = p.range * (p.growthMs ? clamp01((time - p.startupMs) / p.growthMs) : 1)
  const beamTip = cast.beamStop ?? { x: origin.x + direction.x * length, y: origin.y + direction.y * length / arenaHeightRatio }
  return { phase, progress, head, heads, origin, beamTip, direction, facing } as const
}

// Whether the relative motion segment crosses a disc about (0,0).
function crossesDisc(a: Position, b: Position, radius: number) {
  const v = { x: b.x - a.x, y: b.y - a.y }
  const v2 = dot(v, v)
  const t = v2 ? clamp01(-dot(a, v) / v2) : 0
  return Math.hypot(a.x + t * v.x, a.y + t * v.y) <= radius + 1e-9
}

// Clip a target's path to positive half-planes. The clipped segment is then
// tested against the sector's circular edge or the beam's rectangular body.
function clip(a: Position, b: Position, planes: number[][]): [Position, Position] | null {
  let enter = 0, leave = 1
  for (const [x, y, offset] of planes) {
    const start = x * a.x + y * a.y + offset, end = x * b.x + y * b.y + offset
    if (start < 0 && end < 0) return null
    if (start < 0) enter = Math.max(enter, start / (start - end))
    if (end < 0) leave = Math.min(leave, start / (start - end))
  }
  return enter <= leave ? [lerpPoint(a, b, enter), lerpPoint(a, b, leave)] : null
}

export function arenaCastTouches(cast: ArenaCast, fromMs: number, toMs: number, victimFrom: Position, victimTo: Position): boolean {
  if (cast.victimOffset) {
    victimFrom = { x: victimFrom.x + cast.victimOffset.x, y: victimFrom.y + cast.victimOffset.y }
    victimTo = { x: victimTo.x + cast.victimOffset.x, y: victimTo.y + cast.victimOffset.y }
  }
  return touchesBody(cast, fromMs, toMs, victimFrom, victimTo)
}

function touchesBody(cast: ArenaCast, fromMs: number, toMs: number, victimFrom: Position, victimTo: Position): boolean {
  const p = cast.profile
  const start = Math.max(fromMs, p.startupMs), stop = Math.min(toMs, p.startupMs + p.activeMs)
  if (stop < start || fromMs >= p.startupMs + p.activeMs) return false
  if (p.kind === 'self') return true
  const dt = toMs - fromMs
  const a = dt ? lerpPoint(victimFrom, victimTo, (start - fromMs) / dt) : victimFrom
  const b = dt ? lerpPoint(victimFrom, victimTo, (stop - fromMs) / dt) : victimTo
  if (p.kind === 'projectile' || p.kind === 'dash') {
    const first = arenaCastFrame(cast, start).heads, last = arenaCastFrame(cast, stop).heads
    return first.some((head, i) => crossesDisc(delta(head, a), delta(last[i], b), p.radius))
  }
  if (p.kind === 'burst') return crossesDisc(delta(cast.target, a), delta(cast.target, b), p.radius)
  const beamFrom = arenaCastFrame(cast, start), beamTo = arenaCastFrame(cast, stop)
  const direction = beamTo.direction
  const local = (origin: Position, point: Position) => {
    const offset = delta(origin, point)
    return { x: dot(direction, offset), y: cross(direction, offset) }
  }
  const first = local(beamFrom.origin, a), last = local(beamTo.origin, b)
  if (p.kind === 'cone') {
    const slope = Math.tan(p.halfAngleDeg * Math.PI / 180)
    const inside = clip(first, last, [[slope, -1, 0], [slope, 1, 0]])
    return !!inside && crossesDisc(inside[0], inside[1], p.range)
  }
  const fullAt = p.startupMs + (p.growthMs ?? 0)
  if (start < fullAt && stop > fullAt) {
    const split = lerpPoint(a, b, (fullAt - start) / (stop - start))
    return touchesBody(cast, start, fullAt, a, split) || touchesBody(cast, fullAt, stop, split, b)
  }
  const tipA = beamFrom.beamTip, tipB = beamTo.beamTip
  const lenA = arenaDistance(beamFrom.origin, tipA), lenB = arenaDistance(beamTo.origin, tipB)
  // The leading edge grows during this interval; all four limits vary linearly.
  const inBody = clip(first, last, [[1, 0, 0], [0, 1, p.radius], [0, -1, p.radius]])
  if (inBody) {
    const lengthAt = (point: Position) => {
      const dx = last.x - first.x, dy = last.y - first.y
      const t = Math.abs(dx) >= Math.abs(dy) ? (dx ? (point.x - first.x) / dx : 1) : (point.y - first.y) / dy
      return lenA + (lenB - lenA) * t
    }
    if (inBody.some(point => point.x <= lengthAt(point))) return true
  }
  return crossesDisc(first, last, p.radius) || crossesDisc(delta(tipA, a), delta(tipB, b), p.radius)
}
