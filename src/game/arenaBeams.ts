import { arenaAim, arenaCastFrame, arenaDistance, arenaHeightRatio, type ArenaCast, type ArenaSide } from './arenaMoves'
import type { ArenaImpact, TrainerArena } from './trainerArena'
import type { Position } from './engine'
import { singleTypeEffectiveness } from './regions/paldeaTera'

export interface BeamClash {
  playerCastId: number
  enemyCastId: number
  point: Position
  origin: number
  balance: number
  ratio: number
  elapsedMs: number
}
export interface BeamClashResult {
  id: number
  point: Position
  winner: ArenaSide | null
  outcome: 'break' | 'draw' | 'escape'
}

const dot = (a: Position, b: Position) => a.x * b.x + a.y * b.y
const lateral = (a: Position, b: Position) => Math.abs(a.x * b.y - a.y * b.x)
const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))

// Reference field is 1200 world pixels across. The join lies on the axis
// between the two mouths, bounded by the actual reach of both beams.
export function setClashPoint(clash: BeamClash, player: ArenaCast, enemy: ArenaCast) {
  const a = arenaCastFrame(player).origin, b = arenaCastFrame(enemy).origin
  const gap = arenaDistance(a, b)
  const origin = clash.origin, balance = clash.balance
  const fraction = origin + balance * (balance >= 0 ? 1 - origin : origin)
  const t = gap ? clamp(fraction, Math.max(0, 1 - enemy.profile.range / gap), Math.min(1, player.profile.range / gap)) : .5
  clash.point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  player.beamStop = enemy.beamStop = clash.point
}

function startClash(player: ArenaCast, enemy: ArenaCast, strengthRatio: () => number): BeamClash | null {
  const a = arenaCastFrame(player), b = arenaCastFrame(enemy)
  if (a.phase !== 'active' || b.phase !== 'active' || dot(a.direction, b.direction) >= -.86) return null
  const delta = { x: b.origin.x - a.origin.x, y: (b.origin.y - a.origin.y) * arenaHeightRatio }
  const gap = Math.hypot(delta.x, delta.y)
  const slack = player.profile.radius + enemy.profile.radius + 10 / 1200
  if (gap <= 0 || dot(delta, a.direction) <= 0 || dot(delta, b.direction) >= 0 ||
      lateral(delta, a.direction) > slack || lateral(delta, b.direction) > slack) return null
  const leftReach = arenaDistance(a.origin, a.beamTip), rightReach = arenaDistance(b.origin, b.beamTip)
  if (leftReach + rightReach < gap) return null
  const origin = (Math.max(0, gap - rightReach) + Math.min(gap, leftReach)) / (2 * gap)
  const clash = { playerCastId: player.id, enemyCastId: enemy.id, point: a.origin, origin, balance: 0,
    elapsedMs: 0, ratio: strengthRatio() }
  setClashPoint(clash, player, enemy)
  return clash
}

// Both casters' attacks are scored against a neutral defence of 100 before
// applying the move-against-move type chart, independent of the target's body.
export function beamClashPower(level: number, offense: number, power: number, stab: boolean, type: string, rivalType: string) {
  const neutral = (Math.floor(2 * level / 5) + 2) * power * offense / 100 / 50 + 2
  const versus = singleTypeEffectiveness(type, rivalType)
  const weight = versus === 0 ? .5 : versus > 1 ? 1.5 : versus < 1 ? .67 : 1
  return neutral * (stab ? 1.5 : 1) * weight
}

function closeClash(arena: TrainerArena, outcome: BeamClashResult['outcome'], winner: ArenaSide | null) {
  const clash = arena.beamClash!
  arena.lastClash = { id: Math.max(clash.playerCastId, clash.enemyCastId), point: { ...clash.point }, winner, outcome }
  arena.beamClash = null
  for (const cast of arena.casts) delete cast.beamStop
}

function finishChannel(cast: ArenaCast) {
  cast.resolved = true
  cast.elapsedMs = cast.profile.startupMs + cast.profile.activeMs
  cast.result ??= 'miss'
}

// The game uses directional input and auto-aim. An explicit turn away during
// the contest drops the player's channel, as does rolling or changing lead.
export function escapeBeamClash(arena: TrainerArena, direction?: Position) {
  if (!arena.beamClash) return
  if (direction) {
    const length = Math.hypot(direction.x, direction.y)
    if (!length || dot(arenaAim(arena.player, arena.enemy, 'player'), direction) / length >= Math.cos(Math.PI / 6)) return
  }
  const player = arena.casts.find(cast => cast.id === arena.beamClash!.playerCastId)
  closeClash(arena, 'escape', null)
  if (player) finishChannel(player)
}

export function stepBeamClash(arena: TrainerArena, dt: number, powerRatio: (a: ArenaCast, b: ArenaCast) => number,
  impacts: ArenaImpact[]) {
  const player = arena.casts.find(c => !c.resolved && c.side === 'player' && c.beam)
  const enemy = arena.casts.find(c => !c.resolved && c.side === 'enemy' && c.beam)
  if (!player || !enemy) {
    if (arena.beamClash) closeClash(arena, 'escape', null)
    return
  }
  const clash = arena.beamClash
  if (!clash) {
    arena.beamClash = startClash(player, enemy, () => powerRatio(player, enemy))
    return
  }
  const gap = arenaDistance(arenaCastFrame(player).origin, arenaCastFrame(enemy).origin)
  clash.elapsedMs += dt
  const strength = Math.sqrt(clash.ratio)
  const drift = .4 * (strength - 1) / (strength + 1) * dt / 1000
  clash.balance = clamp(clash.balance + 2 * drift / Math.max(1 / 1200, gap), -1, 1)
  setClashPoint(clash, player, enemy)
  const timedOut = clash.elapsedMs >= 2500 - 1e-6
  if (!timedOut && (clash.elapsedMs < 600 - 1e-6 || Math.abs(clash.balance) < 1)) return
  const draw = timedOut && Math.abs(clash.balance) * gap / 2 <= 1 / 1200
  const winner = draw ? undefined : clash.balance > 0 ? player : enemy
  const loser = winner === player ? enemy : player
  closeClash(arena, draw ? 'draw' : 'break', winner?.side ?? null)
  for (const cast of [player, enemy]) {
    const remaining = 1 - (cast.elapsedMs - cast.profile.startupMs) / cast.profile.activeMs
    const share = cast === winner ? Math.max(0, remaining * (timedOut ? .5 : 1)) : 0
    finishChannel(cast)
    if (share) { cast.result = 'hit'; cast.clashBreakthrough = true }
    impacts.push({ cast, hit: share > 0, position: { ...arena[cast.side === 'player' ? 'enemy' : 'player'] },
      beamShare: share, silent: !share })
  }
  if (winner && loser.side === 'player') arena.skillLockMs = Math.max(arena.skillLockMs, 300)
  if (winner && loser.side === 'enemy') arena.enemyInMs = Math.max(arena.enemyInMs, 300)
}
