import { describe, expect, it } from 'vitest'
import { arenaCastFrame, arenaCastTouches, arenaHeightRatio, arenaMoveProfile, createArenaCast } from '../src/game/arenaMoves'
import { moves, type Position } from '../src/game/engine'

const origin = { x: 0.24, y: 0.52 }
const target = { x: 0.54, y: 0.52 }
const along = (a: Position, b: Position, fraction: number) => ({
  x: a.x + (b.x - a.x) * fraction,
  y: a.y + (b.y - a.y) * fraction,
})

describe('trainer skill footprints in the battle field', () => {
  it('gives each available move a valid footprint and a visible active interval', () => {
    const kinds = new Set<string>()
    for (const move of Object.values(moves)) {
      const profile = arenaMoveProfile(move)
      kinds.add(profile.kind)
      expect(profile.startupMs).toBeGreaterThan(0)
      expect(profile.activeMs).toBeGreaterThan(0)
      expect(profile.recoveryMs).toBeGreaterThanOrEqual(0)
      const cast = createArenaCast(73, 'player', move, origin, target)
      expect(arenaCastFrame(cast).phase).toBe('windup')
      cast.elapsedMs = cast.profile.startupMs + cast.profile.activeMs / 2
      expect(arenaCastFrame(cast).phase).toBe('active')
      cast.elapsedMs = cast.profile.startupMs + cast.profile.activeMs + 1
      expect(arenaCastFrame(cast).phase).toBe('recovery')
    }
    expect(kinds).toEqual(new Set(['beam', 'burst', 'cone', 'dash', 'projectile', 'self']))
  })

  it('tests the moving projectile head across an entire update and leaves the wake harmless', () => {
    const cast = createArenaCast(8, 'enemy', moves.ember, origin, target)
    const { startupMs, activeMs } = cast.profile
    expect(cast.profile.kind).toBe('projectile')
    const middle = along(cast.origin, cast.end, 0.5)
    const behind = along(cast.origin, cast.end, 0.15)
    expect(arenaCastTouches(cast, 0, startupMs - 1, middle, middle)).toBe(false)
    expect(arenaCastTouches(cast, startupMs, startupMs + activeMs, middle, middle)).toBe(true)
    const above = { ...middle, y: 0.19 }, below = { ...middle, y: 0.85 }
    expect(arenaCastTouches(cast, startupMs + activeMs * 0.3, startupMs + activeMs * 0.7, above, below)).toBe(true)
    expect(arenaCastTouches(cast, startupMs + activeMs * 0.7, startupMs + activeMs, behind, behind)).toBe(false)
    expect(arenaCastTouches(cast, startupMs + activeMs + 1, startupMs + activeMs + 50, middle, middle)).toBe(false)
  })

  it('checks all three Razor Leaf paths and keeps the gaps between their tips clear', () => {
    const cast = createArenaCast(12, 'player', moves.razorLeaf, origin, target)
    const time = cast.profile.startupMs + cast.profile.activeMs * 0.83
    const heads = arenaCastFrame(cast, time).heads
    expect(heads).toHaveLength(3)
    for (const point of heads) expect(arenaCastTouches(cast, time - 2, time + 2, point, point)).toBe(true)
    const gap = along(heads[0], heads[1], 0.5)
    expect(arenaCastTouches(cast, time - 2, time + 2, gap, gap)).toBe(false)
  })

  it('limits a distant ground cast to its maximum reachable point', () => {
    const distant = { x: .97, y: origin.y }
    for (const move of [moves.rockThrow, moves.confusion]) {
      const cast = createArenaCast(3, 'player', move, origin, distant)
      expect(cast.target.x).toBeCloseTo(origin.x + cast.profile.range)
      expect(arenaCastTouches(cast, cast.profile.startupMs, cast.profile.startupMs + cast.profile.activeMs, distant, distant)).toBe(false)
    }
  })

  it('resolves a ground mark at its locked center and a rush along its moving front', () => {
    const mark = createArenaCast(20, 'enemy', moves.confusion, origin, target)
    const start = mark.profile.startupMs, stop = start + mark.profile.activeMs
    const inside = { x: target.x, y: target.y + 0.9 * mark.profile.radius / arenaHeightRatio }
    const outside = { x: target.x + mark.profile.radius + 0.02, y: target.y }
    expect(arenaCastTouches(mark, start, stop, inside, inside)).toBe(true)
    expect(arenaCastTouches(mark, start, stop, outside, outside)).toBe(false)
    const rush = createArenaCast(21, 'player', moves.tackle, origin, target)
    const contact = along(rush.origin, rush.end, 0.7)
    const t = rush.profile.startupMs
    expect(arenaCastTouches(rush, 0, t - 1, origin, origin)).toBe(false)
    expect(arenaCastTouches(rush, t, t + rush.profile.activeMs, contact, contact)).toBe(true)
    const beside = { x: contact.x, y: contact.y + (rush.profile.radius + 0.02) / arenaHeightRatio }
    expect(arenaCastTouches(rush, t, t + rush.profile.activeMs, beside, beside)).toBe(false)
  })

  it('keeps beam width consistent horizontally and vertically and checks the front of a cone', () => {
    for (const end of [target, { x: origin.x, y: 0.86 }]) {
      const cast = createArenaCast(9, 'player', moves.waterGun, origin, end)
      const { startupMs, activeMs, radius } = cast.profile
      const middle = along(cast.origin, end, 0.5)
      const outside = end.x === origin.x
        ? { x: middle.x + radius + 0.07, y: middle.y }
        : { x: middle.x, y: middle.y + (radius + 0.07) / arenaHeightRatio }
      expect(arenaCastTouches(cast, startupMs + 1, startupMs + activeMs, middle, middle)).toBe(true)
      expect(arenaCastTouches(cast, startupMs + 1, startupMs + activeMs, outside, outside)).toBe(false)
    }
    const cone = createArenaCast(10, 'enemy', moves.scratch, origin, target)
    const { startupMs, activeMs } = cone.profile
    const ahead = along(origin, cone.end, 0.5), behind = { x: origin.x - 0.1, y: origin.y }
    expect(arenaCastTouches(cone, startupMs + 1, startupMs + activeMs, ahead, ahead)).toBe(true)
    expect(arenaCastTouches(cone, startupMs + 1, startupMs + activeMs, behind, behind)).toBe(false)
  })
})
