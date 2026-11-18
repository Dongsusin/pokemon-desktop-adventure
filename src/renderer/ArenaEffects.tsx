import { useEffect, useState, type CSSProperties } from 'react'
import { arenaCastFrame, type ArenaCast } from '../game/arenaMoves'
import type { Position } from '../game/engine'
import type { TrainerArena } from '../game/trainerArena'
import { BeamShaft, BeamContact, ClashCore, ClashFinish } from './ArenaBeams'
import { NativeMove } from './NativeMove'

// Both axes are measured in units of playfield width in the simulation.
const width = 1200
const height = 760
const pixel = (p: Position) => ({ x: p.x * width, y: p.y * height })

export const moveColors: Record<string, string> = {
  normal: '#d1ceda', fire: '#ff8049', water: '#50c9ff', grass: '#8ce65b', electric: '#ffdf36',
  ice: '#9bf6ff', fighting: '#ff9862', poison: '#d987fa', ground: '#d9a05b', flying: '#abebe9',
  psychic: '#ff94d3', bug: '#bddf66', rock: '#e0af6a', ghost: '#b88dff', dragon: '#9b8dff',
  dark: '#ae97b7', steel: '#d3e3f2', fairy: '#ffb6e8',
}

function Footprint({ cast }: { cast: ArenaCast }) {
  const { kind, range, radius, halfAngleDeg } = cast.profile
  const r = radius * width
  const origin = pixel(cast.origin), end = pixel(cast.end)
  if (kind === 'burst' || kind === 'self') {
    const at = kind === 'burst' ? pixel(cast.target) : origin
    return <circle cx={at.x} cy={at.y} r={r} />
  }
  if (kind === 'cone') {
    const a = Math.atan2(end.y - origin.y, end.x - origin.x)
    const delta = halfAngleDeg * Math.PI / 180, length = range * width
    const tip = (angle: number) => [origin.x + Math.cos(angle) * length, origin.y + Math.sin(angle) * length].join(' ')
    return <path d={'M ' + origin.x + ' ' + origin.y + ' L ' + tip(a - delta) + ' A ' + length + ' ' + length + ' 0 ' + (halfAngleDeg > 90 ? 1 : 0) + ' 1 ' + tip(a + delta) + ' Z'} />
  }
  return <>{cast.profile.spreadDeg.map(deg=>{
    const angle = deg * Math.PI / 180
    const dx = end.x - origin.x, dy = end.y - origin.y
    const tip = { x:origin.x + dx*Math.cos(angle)-dy*Math.sin(angle), y:origin.y+dx*Math.sin(angle)+dy*Math.cos(angle) }
    return <Capsule key={deg} origin={origin} end={tip} r={r}/>
  })}</>
}

function Capsule({ origin, end, r }: { origin: Position; end: Position; r: number }) {
  const dx = end.x - origin.x, dy = end.y - origin.y
  const length = Math.hypot(dx, dy)
  if (!length) return <circle cx={origin.x} cy={origin.y} r={r} />
  const x = -dy / length * r, y = dx / length * r
  const pt = (p: Position, sign: number) => [p.x + sign * x, p.y + sign * y].join(' ')
  return <path d={'M ' + pt(origin, 1) + ' L ' + pt(end, 1) + ' A ' + r + ' ' + r + ' 0 0 0 ' + pt(end, -1)
    + ' L ' + pt(origin, -1) + ' A ' + r + ' ' + r + ' 0 0 0 ' + pt(origin, 1) + ' Z'} />
}

export function ArenaEffects({ casts, preview, effects, playing, clash, lastClash }: {
  casts: ArenaCast[]; preview?: ArenaCast; effects: boolean; playing: boolean
  clash: TrainerArena['beamClash']; lastClash?: TrainerArena['lastClash']
}) {
  // Interpolate only until the next 50 ms simulation snapshot. Pausing displays the saved frame exactly.
  const [sample, setSample] = useState<{ casts: ArenaCast[]; delta: number } | null>(null)
  useEffect(() => {
    if (!playing || !casts.length) return
    const received = performance.now()
    let request = requestAnimationFrame(update)
    function update(now: number) {
      const delta = Math.min(50, now - received)
      setSample({ casts, delta })
      if (delta < 50) request = requestAnimationFrame(update)
    }
    return () => cancelAnimationFrame(request)
  }, [casts, playing])
  const delta = playing && sample?.casts === casts ? sample.delta : 0
  const clashColor = (id: number) => moveColors[casts.find(cast => cast.id === id)?.moveType ?? 'normal'] ?? moveColors.normal
  return <svg className="ring-effects" viewBox="0 0 1200 760" preserveAspectRatio="none" aria-hidden="true">
    {preview && <g className="ring-preview"><Footprint cast={preview}/></g>}
    {casts.map(snapshot => {
      const cast = delta ? { ...snapshot, elapsedMs: snapshot.elapsedMs + delta } : snapshot
      const frame = arenaCastFrame(cast)
      const enemy = cast.side === 'enemy'
      const label = pixel(cast.profile.kind === 'burst' ? cast.target : cast.origin)
      return <g key={cast.id} data-cast-id={cast.id} data-category={cast.profile.kind} data-phase={frame.phase} data-caster={cast.side}
        data-move={cast.moveId} data-threat={enemy && frame.phase === 'windup' ? true : undefined}
        style={{ '--element': moveColors[cast.moveType] ?? moveColors.normal } as CSSProperties}>
        {frame.phase === 'windup' && <>
          <g className={'ring-footprint ' + (enemy ? 'enemy' : 'ally')} style={{fillOpacity:.08+.16*frame.progress}}><Footprint cast={cast}/></g>
          <text x={label.x} y={Math.max(22,label.y-36)} className="ring-cast-name">{cast.moveName}</text></>}
        {(frame.phase === 'active' || !!cast.beamStop) && (cast.profile.kind === 'beam' ? <BeamShaft cast={cast} effects={effects}/> :
          !effects && <g className={'ring-footprint ' + (enemy ? 'enemy' : 'ally')}><Footprint cast={cast}/></g>)}
        {effects && !cast.beamStop && <NativeMove cast={cast}/>}
        {effects && cast.beam && <BeamContact cast={cast}/>}
      </g>
    })}
    {clash && <ClashCore clash={clash} delta={delta} effects={effects}
      playerColor={clashColor(clash.playerCastId)} enemyColor={clashColor(clash.enemyCastId)}/>}
    <ClashFinish outcome={lastClash} effects={effects}/>
  </svg>
}
