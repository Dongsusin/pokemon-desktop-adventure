import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  arenaBodyPoint, arenaMuzzlePoint, battleDirectionRow, battleSpriteFootprint,
  canvasGroundAnchor, firingPose, mirrorFront, type ArenaSpriteRef
} from '../src/game/arenaMuzzle'

const feet = { x: .47, y: .55 }
const right = { x: 1, y: 0 }
const left = { x: -1, y: 0 }
const atlas: Record<string, { idle: Strip; shoot?: Strip; attack?: Strip }> =
  JSON.parse(readFileSync('src/renderer/battle-atlases.json', 'utf8'))
type Strip = [number, number, number, number, number, number, number[]]

function relative(to: {x: number; y: number}) {
  return [(to.x - feet.x) * 1200, (to.y - feet.y) * 760]
}

describe('battle-art firing origins', () => {
  it('uses the v3 held pose on all eight compass directions for every shipped form', () => {
    for (const [key, art] of Object.entries(atlas)) {
      const sprite = /^\d+$/.test(key) ? { dex: Number(key) } : { dex: 0, formId: key }
      const pose = firingPose(sprite)!
      const selected = art.shoot ?? art.attack ?? art.idle
      if (!pose || pose.frame < 0 || pose.frame >= selected[6].length || pose.mouth.length !== (pose.front ? 2 : 16)) {
        throw Error('No matching emission frame for ' + key)
      }
      for (let row = 0; row < 8; row++) {
        const facing = { x: Math.sin(row*Math.PI/4), y: Math.cos(row*Math.PI/4) }
        const at = arenaMuzzlePoint(feet, facing, sprite)
        if (battleDirectionRow(facing) !== row || !Number.isFinite(at.x) || !Number.isFinite(at.y)) {
          throw Error('Invalid directional origin for ' + key + '/' + row)
        }
      }
    }
  })

  it('places Squirtle and Gyarados at the source lip offsets on the rendered pivot', () => {
    for (const [dex, x, y, frame] of [[7, 11.5, -9, 4], [130, 34.5, -24.5, 4]]) {
      const pose = firingPose({ dex })!
      const anchor = canvasGroundAnchor(pose.unit)
      const scale = battleSpriteFootprint(dex) * 12 / pose.unit
      const offset = relative(arenaMuzzlePoint(feet, right, { dex }))
      expect(pose.frame).toBe(frame)
      expect(offset[0]).toBeCloseTo((anchor.x - pose.unit*1.5 + x) * scale)
      expect(offset[1]).toBeCloseTo((anchor.y - pose.unit*1.64 + y) * scale)
    }
  })

  it('fires from the left-facing beaks of Bombirdier, Flamigo and Espathra', () => {
    // Measured on their first shipped RGBA frame relative to the planted feet.
    for (const [dex, x, y] of [[962,-36.7,-28.6],[973,-10.2,-65.8],[956,-30.2,-46.1]]) {
      const pose = firingPose({ dex })!
      expect(pose.front).toBe('left')
      expect(pose.mouth).toEqual([x,y])
      expect(mirrorFront(pose.front, left)).toBe(false)
      expect(arenaMuzzlePoint(feet, left, { dex }).x).toBeLessThan(feet.x)
      expect(arenaMuzzlePoint(feet, right, { dex }).x).toBeGreaterThan(feet.x)
    }
  })

  it('mirrors fronts around their native facing, including Chien-Pao, and respects giant forms', () => {
    for (const dex of [1002,1008]) {
      const sprite = { dex }
      const front = firingPose(sprite)!.front
      expect(mirrorFront(front, right)).toBe(dex === 1008)
      expect(mirrorFront(front, left)).toBe(dex === 1002)
      expect(arenaMuzzlePoint(feet, right, sprite).x).toBeGreaterThan(feet.x)
      expect(arenaMuzzlePoint(feet, left, sprite).x).toBeLessThan(feet.x)
    }
    const giant: ArenaSpriteRef = { dex: 6, formId: 'charizard-gmax', dynamax: true }
    const regular = relative(arenaMuzzlePoint(feet, right, { ...giant, dynamax:false }))
    const scaled = relative(arenaMuzzlePoint(feet, right, giant))
    expect(scaled[0]).toBeCloseTo(regular[0]*1.42)
    expect(scaled[1]).toBeCloseTo(regular[1]*1.42)
    expect(arenaBodyPoint(feet, { dex: 95 }).y).toBeLessThan(feet.y)
    expect(arenaMuzzlePoint(feet, right, { dex: 0, formId: '__proto__' })).toEqual(feet)
  })
})
