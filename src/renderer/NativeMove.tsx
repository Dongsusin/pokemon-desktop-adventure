import type { CSSProperties } from 'react'
import clipsJson from './move-clips.json?raw'
import { arenaCastFrame, arenaMoveProfile, castDuration, type ArenaCast } from '../game/arenaMoves'
import type { Position } from '../game/engine'

interface Clip {
  sheet: string | null
  n: number
  f: number[][]
  lau: number
  imp: number
  hue: number
  spr?: number[][]
  ov?: (number | null)[][]
  img?: string[]
  fx?: number[][]
}

const clips: Record<string, Clip> = JSON.parse(clipsJson)
const cell = 192
const cellScale = .75
const fps = 20
const user = { x: 128, y: 224 }
const victim = { x: 384, y: 96 }
const axis = { x: victim.x - user.x, y: victim.y - user.y }
const world = (p: Position) => ({ x: 1200 * p.x, y: 760 * p.y })
const unit = (value: number) => Math.min(1, Math.max(0, value))
const asset = (name: string) => 'battle/moves/' + encodeURIComponent(name)

function playback(cast: ArenaCast, clip: Clip) {
  const phase = arenaCastFrame(cast)
  const { kind, startupMs, activeMs, recoveryMs } = cast.profile
  const impact = Math.max(0, clip.imp)
  const launch = Math.max(0, clip.lau)
  let index: number
  if (clip.imp < 0) {
    index = clip.n * cast.elapsedMs / castDuration(cast)
  } else if (cast.impact) {
    // An early hit starts the original impact sequence at the collision point.
    index = impact + (cast.elapsedMs - cast.impact.elapsedMs) * fps / 1000
  } else if (cast.profile.lobSpeed && phase.phase === 'windup') {
    const prep = arenaMoveProfile({ id: cast.moveId }).startupMs
    index = cast.elapsedMs < prep ? launch * cast.elapsedMs / prep :
      launch + (impact - launch) * unit((cast.elapsedMs - prep) / Math.max(1, startupMs - prep))
  } else if (phase.phase === 'windup') {
    const end = kind === 'projectile' || kind === 'beam' ? launch : impact
    index = end > 0 ? Math.min(end - .001, phase.progress * end) : -1
  } else if (phase.phase === 'active') {
    index = kind === 'projectile' ? launch + Math.max(0, impact - launch) * phase.progress :
      kind === 'beam' ? impact + Math.floor((cast.elapsedMs - startupMs) * fps / 1000) % Math.max(1, clip.n - impact) :
      impact + (clip.n - impact) * (cast.elapsedMs - startupMs) / (activeMs + recoveryMs)
  } else {
    index = impact + (clip.n - impact) * (cast.elapsedMs - startupMs) / (activeMs + recoveryMs)
  }
  return Math.floor(index)
}

function tintFilter(clip: Clip, effect: number, id: string) {
  const tone = effect > 0 ? clip.fx?.[effect - 1] : undefined
  if (!tone) return undefined
  const alpha = unit(tone[7] / 255)
  return <filter id={id} colorInterpolationFilters="sRGB">
    <feColorMatrix type="saturate" values={String(1 - unit(tone[3] / 255))} />
    <feComponentTransfer>
      {(['R', 'G', 'B'] as const).map((channel, i) => {
        const Component = ('feFunc' + channel) as 'feFuncR' | 'feFuncG' | 'feFuncB'
        return <Component key={channel} type="linear" slope={1 - alpha}
          intercept={((1 - alpha) * tone[i] + alpha * tone[i + 4]) / 255}/>
      })}
    </feComponentTransfer>
  </filter>
}

export function nativeBodyStyle(casts: ArenaCast[], side: ArenaCast['side']): CSSProperties | undefined {
  for (const cast of casts) {
    const clip = clips[cast.moveId]
    if (!clip?.spr?.length) continue
    const index = playback(cast, clip)
    const pose = clip.spr.find(([t, target]) => t === index && target === Number(cast.side !== side))
    if (!pose || (pose[1] && cast.result === 'miss')) continue
    const [, , overlay, alpha, , fx, zx, zy] = pose
    return { transform: 'scale(' + zx / 100 + ',' + zy / 100 + ')',
      opacity: overlay ? undefined : alpha / 255,
      filter: fx ? 'url(#move-tone-' + cast.id + '-' + fx + ')' : undefined }
  }
}

function OverlayPlane({ cast, clip, index, center }: { cast: ArenaCast; clip: Clip; index: number; center: Position }) {
  if (!clip.img?.length || !clip.ov?.length) return null
  let image: string | undefined
  let opacity = 0, ox = 0, oy = 0
  for (const [start, kind, imageId, duration, op, , , , , x, y] of clip.ov) {
    if (start == null || start > index) continue
    if (kind === 1 || kind === 3) {
      image = clip.img[imageId ?? -1]
      opacity = op ?? 0
      ox = x ?? 0
      oy = y ?? 0
    } else {
      const progress = unit((index - start) / Math.max(1, duration ?? 1))
      if (op != null) opacity += (op - opacity) * progress
      if (x != null) ox += (x - ox) * progress
      if (y != null) oy += (y - oy) * progress
    }
  }
  if (!image || !opacity) return null
  const key = 'move-plane-' + cast.id
  const radius = Math.max(52, cast.profile.radius * 1200)
  return <g opacity={opacity / 255}>
    <defs>
      <pattern id={key} width={radius * 2} height={radius * 1.5} patternUnits="userSpaceOnUse" x={-ox * cellScale} y={-oy * cellScale}>
        <image href={asset(image)} width={radius * 2} height={radius * 1.5}/>
      </pattern>
      <radialGradient id={key + '-fade'}><stop offset=".48" stopColor="white"/><stop offset="1" stopColor="black"/></radialGradient>
      <mask id={key + '-mask'}><circle cx={center.x} cy={center.y} r={radius} fill={'url(#' + key + '-fade)'}/></mask>
    </defs>
    <circle cx={center.x} cy={center.y} r={radius} fill={'url(#' + key + ')'} mask={'url(#' + key + '-mask)'}/>
  </g>
}

export function NativeMove({ cast }: { cast: ArenaCast }) {
  const clip = clips[cast.moveId]
  if (!clip) return null
  const index = playback(cast, clip)
  const frame = clip.f[index]
  if (!frame) return null
  const view = arenaCastFrame(cast)
  const kind = cast.profile.kind
  const origin = world(cast.origin)
  const aim = world(cast.target)
  const end = world(cast.end)
  const beyondReach = Math.hypot(aim.x - origin.x, aim.y - origin.y) > cast.profile.range * 1200
  const target = cast.impact ? world(cast.impact.position) : kind === 'beam' ? world(view.beamTip) :
    kind === 'self' ? origin : beyondReach && kind !== 'burst' ? end : aim
  const flip = (kind === 'self' ? cast.side === 'enemy' : target.x < origin.x) ? -1 : 1
  const flight = kind === 'projectile' && view.phase === 'active' && !cast.impact
  const heads = flight ? view.heads.map(world) : [target]
  const sheetId = 'move-sheet-' + cast.id
  const first = Array.from({ length: frame.length / 9 }, (_, i) => i * 9)
  const visualCells = first.filter(i => frame[i + 6] > 0)
  // Put the authored cluster's center on each simulated projectile head.
  const mean = (j: number) => visualCells.reduce((sum, i) => sum + frame[i + j], 0) / Math.max(1, visualCells.length)
  const cx = mean(0), cy = mean(1)
  return <g data-native-move={cast.moveId} data-source-frame={index} style={{imageRendering: 'pixelated'}}>
    <defs>
      {clip.sheet && <image id={sheetId} href={asset(clip.sheet)} />}
      {clip.fx?.map((_, i) => <g key={i}>{tintFilter(clip, i + 1, 'move-tone-' + cast.id + '-' + (i + 1))}</g>)}
    </defs>
    <OverlayPlane cast={cast} clip={clip} index={index} center={target}/>
    {clip.sheet && !(view.phase === 'recovery' && cast.result === 'miss' && kind === 'projectile') &&
      heads.map((head, j) => <g key={j}>
        {visualCells.map(i => {
          const [x, y, pattern, sx, sy, rotation, opacity, flags, fx] = frame.slice(i, i + 9)
          const focus = (flags >> 3) & 7
          let at: Position
          if (flight) {
            at = { x: head.x + (x - cx) * cellScale * flip, y: head.y + (y - cy) * cellScale }
          } else if (focus === 1 || focus === 2) {
            const a = focus === 1 ? target : origin, b = focus === 1 ? victim : user
            at = { x: a.x + (x - b.x) * cellScale * flip, y: a.y + (y - b.y) * cellScale }
          } else if (focus === 3) {
            const t = ((x - user.x) * axis.x + (y - user.y) * axis.y) / (axis.x ** 2 + axis.y ** 2)
            at = { x: origin.x + t * (target.x - origin.x) + flip * (x - user.x - axis.x * t) * cellScale,
              y: origin.y + t * (target.y - origin.y) + (y - user.y - axis.y * t) * cellScale }
          } else {
            at = { x: (origin.x + target.x) / 2 + (x - 256) * cellScale * flip,
              y: (origin.y + target.y) / 2 + (y - 192) * cellScale }
          }
          const blend = (flags >> 1) & 3
          return <g key={i} transform={'translate(' + at.x + ' ' + at.y + ') rotate(' + (-rotation * flip) +
            ') scale(' + ((flags & 1 ? -1 : 1) * flip * sx / 100 * cellScale) + ' ' + (sy / 100 * cellScale) + ')'}
            opacity={opacity / 255} filter={fx ? 'url(#move-tone-' + cast.id + '-' + fx + ')' : undefined}
            style={{mixBlendMode: blend === 1 ? 'plus-lighter' : blend === 2 ? 'multiply' : undefined}}>
            <svg x={-cell / 2} y={-cell / 2} width={cell} height={cell}
              viewBox={[pattern % 5 * cell, Math.floor(pattern / 5) * cell, cell, cell].join(' ')} overflow="hidden">
              <use href={'#' + sheetId} style={{filter: clip.hue ? 'hue-rotate(' + clip.hue + 'deg)' : undefined}}/>
            </svg>
          </g>
        })}
      </g>)}
  </g>
}
