import { useState } from 'react'
import type { ArenaCast } from '../game/arenaMoves'
import { arenaCastFrame } from '../game/arenaMoves'
import type { Position } from '../game/engine'
import type { TrainerArena } from '../game/trainerArena'

type Clash = NonNullable<TrainerArena['beamClash']>
type Outcome = NonNullable<TrainerArena['lastClash']>
const world = (p: Position) => ({ x: p.x * 1200, y: p.y * 760 })

export function BeamShaft({ cast, effects }: { cast: ArenaCast; effects: boolean }) {
  const frame = arenaCastFrame(cast)
  const from = world(frame.origin), to = world(frame.beamTip)
  const dx = to.x - from.x, dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  const radius = cast.profile.radius * 1200
  const wave = Math.sin(cast.elapsedMs * .016)
  const path = !effects ? 'M0 0H' + length : cast.moveType === 'electric'
    ? 'M0 0L' + length*.22 + ' ' + wave*radius*.45 + 'l' + (-length*.04) + ' ' + (-radius*.60)
      + 'L' + length*.62 + ' ' + radius*.5 + 'l' + (-length*.06) + ' ' + (-radius*.68) + 'L' + length + ' 0'
    : 'M0 0Q' + length*.5 + ' ' + radius*.28*wave + ' ' + length + ' 0'
  if (!length) return null
  return <g data-beam-shaft={cast.side} data-from-x={from.x} data-from-y={from.y} data-to-x={to.x} data-to-y={to.y}
    transform={'translate('+from.x+' '+from.y+') rotate('+angle+')'} fill="none" strokeLinecap="round">
    {effects && <path d={path} stroke="var(--element)" strokeWidth={radius*1.7} opacity=".42"/>}
    <path d={path} stroke="var(--element)" strokeWidth={radius}/>
    <path d={path} stroke="#fff9ec" strokeWidth={radius*.31}/>
    {effects && !cast.beamStop && <circle cx={length} r={radius*.54} fill="#fffde3"/>}
  </g>
}

export function BeamContact({ cast }: { cast: ArenaCast }) {
  if (!cast.beam?.lastHit || !cast.beam.hits || cast.beamStop) return null
  const at = world(cast.beam.lastHit)
  return <g transform={'translate('+at.x+' '+at.y+')'} data-beam-pulse={cast.beam.hits} data-caster={cast.side}>
    <g className="ring-beam-pulse" key={cast.beam.hits}>
      <circle r="10" fill="none" stroke="var(--element)" strokeWidth="3"/>
      <path d="m0-15 2 8 9-5-5 9 10 3-10 2 6 9-10-5-2 10-3-10-8 5 5-9-10-2 10-3-5-8 8 4Z" fill="#fffce2"/>
    </g>
  </g>
}

export function ClashCore({ clash, playerColor, enemyColor, effects, delta }: {
  clash: Clash; playerColor: string; enemyColor: string; effects: boolean; delta: number
}) {
  const at = world(clash.point)
  const age = clash.elapsedMs + delta
  // The source foreground uses a 12 px core, six alternating rays and a half-circle advantage meter.
  const phase = age * .013, beat = Math.floor(phase)
  const radius = effects ? 12 + 3.4 * Math.sin(phase * Math.PI * 2) : 12
  const balance = Math.max(-1, Math.min(1, clash.balance))
  const leadingColor = balance >= 0 ? playerColor : enemyColor
  const arc = Math.PI * balance
  return <g transform={'translate('+at.x+' '+at.y+')'} data-beam-clash="true" data-world-x={at.x} data-world-y={at.y}
    data-player-cast={clash.playerCastId} data-enemy-cast={clash.enemyCastId} data-balance={balance}>
    {effects && <g className="ring-clash-sparks">
      <circle r={radius*2.25} fill={leadingColor} opacity=".14"/>
      <circle r={radius*1.65} fill="#fffce5" opacity=".23"/>
      {Array.from({ length: 6 }, (_, i) => {
        const rotation = (i * 60 + beat * 29 + (i % 2) * 11) % 360
        const length = 22 + 4 * ((beat + i * 3) % 6)
        return <path key={i} transform={'rotate('+rotation+')'} d={'M8 0l8 -3 5 4L'+length+' -3'}
          fill="none" stroke={i % 2 === 0 ? playerColor : enemyColor} strokeWidth="3" strokeLinecap="round"/>
      })}
    </g>}
    <circle r={radius*1.18} fill={leadingColor} stroke="#fffde5" strokeWidth="2.3"/>
    <circle r={radius*.56} fill="#fff"/>
    {balance !== 0 && <path d={'M0 -26 A26 26 0 0 '+(balance>0 ? 1 : 0)+' '+26*Math.sin(arc)+' '+(-26*Math.cos(arc))}
      fill="none" stroke={leadingColor} strokeWidth="4" strokeLinecap="round"/>}
    {age < 680 && <text className="ring-clash-label" y="-36">맞대결!</text>}
  </g>
}

export function ClashFinish({ outcome, effects }: { outcome?: Outcome | null; effects: boolean }) {
  // A restored battle should not replay a previous resolution.
  const [dismissed, setDismissed] = useState(outcome?.id)
  if (!outcome || outcome.id === dismissed) return null
  const at = world(outcome.point)
  const label = outcome.outcome === 'draw' ? '무승부' : outcome.outcome === 'escape' ? '맞대결 해제' :
    outcome.winner === 'player' ? '밀어냈다!' : '밀렸다…'
  const color = outcome.winner === 'player' ? '#ffe486' : '#ebe8fd'
  return <g key={outcome.id} transform={'translate('+at.x+' '+at.y+')'} data-clash-outcome={outcome.outcome}>
    <g className="ring-clash-finish" onAnimationEnd={event => {
      if (event.target === event.currentTarget) setDismissed(outcome.id)
    }}>
      {effects && <g fill="none" stroke={color} className="ring-clash-rings">
        <circle r="18" strokeWidth="4"/><circle r="31" strokeWidth="2"/>
      </g>}
      <text y="-29" className="ring-clash-label" style={{fill:color}}>{label}</text>
    </g>
  </g>
}
