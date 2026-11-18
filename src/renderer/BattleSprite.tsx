import { useEffect, useLayoutEffect, useRef } from 'react'
import { spriteAtlas, spriteAtlasKey, spriteExtent, spriteFrameIndex, spriteSheetUrl } from './spriteAtlas'
import { battleDirectionRow, canvasGroundAnchor, firingPose } from '../game/arenaMuzzle'
export { battleSpriteFootprint } from '../game/arenaMuzzle'

type Motion = 'idle' | 'walk' | 'attack' | 'charge' | 'shoot' | 'hurt' | 'dodge'
type CastFrame = { phase: 'windup' | 'active' | 'recovery'; progress: number }

interface Props {
  id: number
  formId?: string
  facing: { x: number; y: number }
  motion: Motion
  castFrame?: CastFrame
  heldBeam?: boolean
  paused?: boolean
  loop?: boolean
  className?: string
  alt?: string
}

export function BattleSprite({ id, formId, facing, motion, castFrame, heldBeam = false, paused = false, loop = false, className, alt = '' }: Props) {
  const key = spriteAtlasKey(id, formId)
  const atlas = spriteAtlas(key)
  const canvas = useRef<HTMLCanvasElement>(null)
  const pose = useRef({ facing, motion, paused, castFrame, heldBeam })
  useLayoutEffect(() => { pose.current = { facing, motion, paused, castFrame, heldBeam } }, [facing, motion, paused, castFrame, heldBeam])

  useEffect(() => {
    const target = canvas.current
    const ctx = target?.getContext('2d')
    if (!atlas || !target || !ctx) return
    ctx.clearRect(0, 0, target.width, target.height)
    const mouth = firingPose({ dex: id, formId })
    const sheet = new Image()
    let request = 0
    let previousMotion: Motion | undefined
    let previousFrame = ''
    let elapsed = 0
    let previousTime = 0
    function draw(now: number) {
      const { facing, motion, paused, castFrame, heldBeam } = pose.current
      if (motion !== previousMotion) elapsed = 0
      else if (!paused && previousTime) elapsed += Math.min(100, now - previousTime)
      previousMotion = motion
      previousTime = now
      const action = heldBeam && motion === 'charge' ? 'shoot' : motion === 'dodge' ? 'walk' : motion
      const hold = !atlas[action]
      const strip = atlas[action] ?? (action === 'charge' ? atlas.shoot : action === 'hurt' ? atlas.idle : undefined)
      if (!strip) {
        if (previousFrame) ctx!.clearRect(0, 0, target!.width, target!.height)
        previousFrame = ''
        request = requestAnimationFrame(draw)
        return
      }
      const [offset, w, h, anchorX, anchorY, rows, durations, hitTick, returnTick] = strip
      const row = rows === 1 ? 0 : battleDirectionRow(facing)
      const ticks = elapsed * .06 * (motion === 'dodge' ? 1.8 : 1)
      const period = durations.reduce((sum, duration) => sum + duration, 0)
      let remaining = hold ? 0 : loop || ['idle', 'walk', 'dodge', 'charge'].includes(motion) ? ticks % period : Math.min(ticks, period - 1)
      if ((action === 'attack' || action === 'shoot') && castFrame && hitTick !== undefined && returnTick !== undefined) {
        const bounds = castFrame.phase === 'windup' ? [0, hitTick] : castFrame.phase === 'active' ? [hitTick, returnTick] : [returnTick, period]
        remaining = Math.min(period - 1, bounds[0] + (bounds[1] - bounds[0]) * castFrame.progress)
      }
      let frame = spriteFrameIndex(durations, remaining)
      // Use the same authored release frame as the measured beam origin.
      const emitting = motion === 'shoot' && castFrame?.phase === 'active' && (heldBeam || castFrame.progress < .12)
      if (emitting && mouth) frame = mouth.frame
      const signature = [offset, row, frame].join('/')
      if (previousFrame !== signature) {
        // Allow attacks to extend outside the idle body rectangle without clipping.
        const unit = spriteExtent(atlas)
        ctx!.clearRect(0, 0, target!.width, target!.height)
        ctx!.save()
        const anchor = canvasGroundAnchor(unit)
        ctx!.translate(anchor.x, anchor.y)
        ctx!.imageSmoothingEnabled = false
        ctx!.drawImage(sheet, frame * w, offset + row * h, w, h, -anchorX, -anchorY, w, h)
        ctx!.restore()
        previousFrame = signature
      }
      request = requestAnimationFrame(draw)
    }
    sheet.onload = () => { request = requestAnimationFrame(draw) }
    sheet.src = spriteSheetUrl(key)
    return () => { sheet.onload = null; cancelAnimationFrame(request) }
  }, [key, atlas, id, formId, loop])

  if (!atlas?.walk || !atlas.attack) return null
  const size = spriteExtent(atlas) * 3
  return <canvas ref={canvas} className={className} width={size} height={size} role="img" aria-label={alt}
    data-atlas={key} style={{ position: 'absolute', inset: 'auto', left: '-100%', top: '-100%',
      width: '300%', height: '300%', imageRendering: 'pixelated', pointerEvents: 'none' }} />
}
