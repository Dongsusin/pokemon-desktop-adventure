import measurements from './arena-emitters.json'
import type { Position } from './engine'

export interface ArenaSpriteRef {
  dex: number
  formId?: string
  dynamax?: boolean
}

interface FiringPose {
  unit: number
  bodyY: number
  frame: number
  mouth: number[]
  front?: string
}
const poses: Record<string, FiringPose> = measurements
const worldWidth = 1200
const worldHeight = 760

export function firingPose(sprite: ArenaSpriteRef): FiringPose | undefined {
  const key = sprite.formId && Object.hasOwn(poses, sprite.formId) ? sprite.formId : String(sprite.dex)
  return Object.hasOwn(poses, key) ? poses[key] : undefined
}

export function battleSpriteFootprint(dex: number, formId?: string, dynamax = false) {
  const pose = firingPose({ dex, formId })
  const width = pose ? Math.min(24, Math.max(3.3, pose.unit / (pose.front ? 15 : 6))) : 6.8
  return width * (dynamax ? 1.42 : 1)
}

export function battleDirectionRow(facing: Position): number {
  // PMD sheets start at Down and turn towards DownRight.
  return (Math.round(Math.atan2(facing.x, facing.y) / (Math.PI / 4)) + 8) % 8
}

export function mirrorFront(native: string | undefined, facing: Position): boolean {
  return native === 'left' ? facing.x > 0 : native === 'right' && facing.x < 0
}

export function canvasGroundAnchor(unit: number): Position {
  return { x: Math.round(unit * 1.5), y: Math.round(unit * 1.72) }
}

function project(body: Position, sprite: ArenaSpriteRef, pose: FiringPose, x: number, y: number): Position {
  const width = battleSpriteFootprint(sprite.dex, sprite.formId, sprite.dynamax) * worldWidth / 100
  const scale = width / pose.unit
  const anchor = canvasGroundAnchor(pose.unit)
  // The 3× canvas starts one actor width before the fighter box, whose center
  // is at (50%,64%). Use the exact rounded atlas pivot that the canvas draws.
  return {
    x: body.x + (anchor.x - 1.5 * pose.unit + x) * scale / worldWidth,
    y: body.y + (anchor.y - 1.64 * pose.unit + y) * scale / worldHeight,
  }
}

export function arenaMuzzlePoint(body: Position, facing: Position, sprite: ArenaSpriteRef): Position {
  const pose = firingPose(sprite)
  if (!pose) return { ...body }
  const row = pose.front ? 0 : battleDirectionRow(facing)
  const x = pose.mouth[row * 2] * (mirrorFront(pose.front, facing) ? -1 : 1)
  return project(body, sprite, pose, x, pose.mouth[row * 2 + 1])
}

export function arenaBodyPoint(body: Position, sprite: ArenaSpriteRef): Position {
  const pose = firingPose(sprite)
  return pose ? project(body, sprite, pose, 0, pose.bodyY) : { ...body }
}
