import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  arenaBodyPoint, arenaMuzzlePoint, battleDirectionRow, battleSpriteFootprint,
  canvasGroundAnchor, firingPose, type ArenaSpriteRef
} from '../src/game/arenaMuzzle'

const feet = { x: .47, y: .55 }
const right = { x: 1, y: 0 }
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
      if (!pose || pose.frame < 0 || pose.frame >= selected[6].length || pose.mouth.length !== 16) {
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

  it('omits front-only actors and missing forms, and scales supported Dynamax actors', () => {
    for (const dex of [962, 973, 956, 1002, 1008]) expect(firingPose({ dex })).toBeUndefined()
    expect(firingPose({ dex: 6, formId: 'charizard-gmax' })).toBeUndefined()
    const giant: ArenaSpriteRef = { dex: 6, dynamax: true }
    const regular = relative(arenaMuzzlePoint(feet, right, { ...giant, dynamax:false }))
    const scaled = relative(arenaMuzzlePoint(feet, right, giant))
    expect(scaled[0]).toBeCloseTo(regular[0]*1.42)
    expect(scaled[1]).toBeCloseTo(regular[1]*1.42)
    expect(arenaBodyPoint(feet, { dex: 95 }).y).toBeLessThan(feet.y)
    expect(arenaMuzzlePoint(feet, right, { dex: 0, formId: '__proto__' })).toEqual(feet)
  })
})
