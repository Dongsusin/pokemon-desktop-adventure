import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import atlasData from './battle-atlases.json?raw'

type Motion = 'idle' | 'walk' | 'attack' | 'charge' | 'shoot' | 'hurt' | 'dodge'
// Sheet offset, frame size, ground anchor, direction rows, durations (60 Hz).
type Strip = [number, number, number, number, number, number, number[], number?, number?]
type Atlas = { idle: Strip; columns?: number } & Partial<Record<Motion, Strip>>
const atlases: Record<string, Atlas> = JSON.parse(atlasData)
const spriteKey = (id: number, formId?: string) => formId || String(id)
const extent = (atlas: Atlas) => Math.max(16, atlas.idle[1], atlas.idle[2])

export function battleSpriteFootprint(id: number, formId?: string) {
  const atlas = atlases[spriteKey(id, formId)]
  return atlas ? Math.min(24, Math.max(3.3, extent(atlas) / (atlas.columns ? 15 : 6))) : 6.8
}

type CastFrame = { phase: 'windup' | 'active' | 'recovery'; progress: number }

// Some published sets have one drawing per direction or only a front view.
// Move the drawing around its planted feet for actions with no authored frames.
function bodyMotion(motion: Motion, elapsed: number, facing: { x: number; y: number }, cast?: CastFrame) {
  const pulse = (cycle: number) => (1 - Math.cos(elapsed * Math.PI * 2 / cycle)) / 2
  if (motion === 'idle') return [0, -pulse(900), 0]
  if (motion === 'walk') return [0, -2 * pulse(230), .05 * Math.sin(elapsed * Math.PI / 230)]
  if (motion === 'dodge') return [0, -3 * pulse(230), facing.x * .22]
  if (motion === 'hurt') return [-facing.x * 2, -1, -.1 * facing.x]
  const progress = cast?.progress ?? pulse(340)
  const lean = cast?.phase === 'windup' ? -progress : 1 - progress
  return [facing.x * lean * 3, facing.y * lean * 2 - 1, facing.x * lean * .15]
}

interface Props {
  id: number
  formId?: string
  facing: { x: number; y: number }
  motion: Motion
  castFrame?: CastFrame
  paused?: boolean
  className?: string
  alt?: string
}

export function BattleSprite({ id, formId, facing, motion, castFrame, paused = false, className, alt = '' }: Props) {
  const key = spriteKey(id, formId)
  const atlas = atlases[key]
  const [failed, setFailed] = useState('')
  const canvas = useRef<HTMLCanvasElement>(null)
  const pose = useRef({ facing, motion, paused, castFrame })
  useLayoutEffect(() => { pose.current = { facing, motion, paused, castFrame } }, [facing, motion, paused, castFrame])

  useEffect(() => {
    const target = canvas.current
    const ctx = target?.getContext('2d')
    if (!atlas || !target || !ctx) return
    const sheet = new Image()
    let request = 0
    let previousMotion: Motion | undefined
    let previousFrame = ''
    let elapsed = 0
    let previousTime = 0
    function draw(now: number) {
      const { facing, motion, paused, castFrame } = pose.current
      if (motion !== previousMotion) elapsed = 0
      else if (!paused && previousTime) elapsed += Math.min(100, now - previousTime)
      previousMotion = motion
      previousTime = now
      const strip = atlas[motion === 'dodge' ? 'walk' : motion]
        ?? (motion === 'shoot' || motion === 'charge' ? atlas.attack : undefined) ?? atlas.idle
      const [offset, w, h, anchorX, anchorY, rows, durations, hitTick, returnTick] = strip
      const angle = Math.atan2(facing.x, facing.y)
      const row = rows === 1 ? 0 : (Math.round(angle / (Math.PI / 4)) + 8) % 8
      const ticks = elapsed * .06 * (motion === 'dodge' ? 1.8 : 1)
      const period = durations.reduce((sum, duration) => sum + duration, 0)
      let remaining = (atlas.columns || ['idle', 'walk', 'dodge', 'charge'].includes(motion)) ? ticks % period : Math.min(ticks, period - 1)
      if ((motion === 'attack' || motion === 'shoot') && castFrame && hitTick !== undefined && returnTick !== undefined) {
        const bounds = castFrame.phase === 'windup' ? [0, hitTick] : castFrame.phase === 'active' ? [hitTick, returnTick] : [returnTick, period]
        remaining = Math.min(period - 1, bounds[0] + (bounds[1] - bounds[0]) * castFrame.progress)
      }
      let frame = 0
      while (frame < durations.length - 1 && remaining >= durations[frame]) remaining -= durations[frame++]
      const mirrored = Boolean(atlas.columns && facing.x > 0)
      const improvised = durations.length === 1 || (atlas.columns && motion !== 'idle')
      const [shiftX, shiftY, angleOffset] = improvised ? bodyMotion(motion, elapsed, facing, castFrame) : [0, 0, 0]
      const x = Math.round(shiftX), y = Math.round(shiftY), lean = Math.round(angleOffset * 16) / 16
      const signature = [offset, row, frame, mirrored, x, y, lean].join('/')
      if (previousFrame !== signature) {
        // Allow attacks to extend outside the idle body rectangle without clipping.
        const unit = extent(atlas)
        ctx!.clearRect(0, 0, target!.width, target!.height)
        const column = atlas.columns ? frame % atlas.columns : frame
        const line = atlas.columns ? Math.floor(frame / atlas.columns) : row
        ctx!.save()
        ctx!.translate(Math.round(unit * 1.5) + x, Math.round(unit * 1.72) + y)
        ctx!.rotate(lean)
        ctx!.imageSmoothingEnabled = false
        if (mirrored) ctx!.scale(-1, 1)
        ctx!.drawImage(sheet, column * w, offset + line * h, w, h, -anchorX, -anchorY, w, h)
        ctx!.restore()
        previousFrame = signature
      }
      request = requestAnimationFrame(draw)
    }
    sheet.onload = () => { request = requestAnimationFrame(draw) }
    sheet.onerror = () => setFailed(key)
    sheet.src = new URL('battle/sprites/' + key + '.png', document.baseURI).href
    return () => { sheet.onload = null; sheet.onerror = null; cancelAnimationFrame(request) }
  }, [key, atlas])

  if (!atlas || failed === key) {
    const path = formId ? 'sprites/forms/' + formId : 'sprites/pokemon/' + id
    return <img className={className} src={new URL(path + '.png', document.baseURI).href} alt={alt}
      draggable={false} style={{ transform: facing.x > 0 ? 'scaleX(-1)' : undefined }} />
  }
  const size = extent(atlas) * 3
  return <canvas ref={canvas} className={className} width={size} height={size} role="img" aria-label={alt}
    data-atlas={key} style={{ position: 'absolute', inset: 'auto', left: '-100%', top: '-100%',
      width: '300%', height: '300%', imageRendering: 'pixelated', pointerEvents: 'none' }} />
}
