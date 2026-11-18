import { useEffect, useState, type CSSProperties } from 'react'
import { arenaCastFrame, type ArenaCast } from '../game/arenaMoves'
import type { Position } from '../game/engine'

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

function Projectile({ type, moveId }: { type: string; moveId: string }) {
  if (type === 'grass') return <><path fill="#214a27" d="M-23 5Q-11-20 24-11Q17 16-18 14Z" />
    <path fill="#a7ec52" d="M-19 6Q-6-13 19-10Q9 11-13 12Z" /><path stroke="#497737" strokeWidth="3" d="m-19 12 33-18" /></>
  if (type === 'ice') return <><path fill="#eaffff" stroke="#5297cb" strokeWidth="3" d="m-27 3 15-13 34-4-14 18-27 13Z" />
    <path fill="#85d9f5" d="m-21 12 32-23-10 14Z" /></>
  if (type === 'rock' || type === 'ground') return <><path fill="#77533e" stroke="#453748" strokeWidth="4" d="m-24-8 13-14 23 2 13 17-10 24-25 1-16-12Z"/>
    <path fill="#c29458" d="m-19-6 12-12 17 2 6 11-15 9-15-3Z"/><path fill="#e5c27e" d="m-12-7 8-8 10 1-7 8Z"/></>
  if (type === 'fire') return <><path fill="#bc3832" d="m-43-12 19 2-6-16 20 12q25-8 35 12Q21 20 0 21l-34-6 13-8-24-1Z"/>
    <path fill="#ff9031" d="m-25-14 21 10Q16-13 21 0q-5 15-22 14l-21-4 11-6Z"/><path fill="#fff3a0" d="M-6 0q15-7 21 1-9 11-20 7Z"/></>
  if (type === 'water') return <><ellipse rx="24" ry="17" fill="#4579db" stroke="#b6faff" strokeWidth="4" />
    <ellipse cx="5" cy="-5" rx="12" ry="6" fill="#a9fcff"/>{moveId === 'waterPulse' && <ellipse rx="31" ry="24" fill="none" stroke="#c7f9ff" strokeWidth="3"/>}</>
  if (type === 'poison') return <path d="m-36 5 20-13 41 6-16 6-31 5Z" fill="#eee0ff" stroke="#a849cf" strokeWidth="4"/>
  if (type === 'flying' || type === 'fairy') return <g fill="none" stroke="var(--element)" strokeWidth="5"><path d="M-23 15Q16 18 22-1Q26-16-12-14Q-29-11-15-6Q6 0 15-9"/><path stroke="#fff" strokeWidth="3" d="M-24 2Q-4 11 14 1"/></g>
  return <><circle r="21" fill="var(--element)" stroke="#ebeaff" strokeWidth="3"/><circle cx="5" cy="-4" r="8" fill="#fff"/></>
}

function Technique({ cast }: { cast: ArenaCast }) {
  const { kind, radius, range, halfAngleDeg } = cast.profile
  const frame = arenaCastFrame(cast)
  const p = frame.progress
  const origin = pixel(cast.origin), head = pixel(frame.head)
  const angle = Math.atan2(frame.direction.y, frame.direction.x) * 180 / Math.PI
  const r = radius * width
  const at = (v: Position) => 'translate(' + v.x + ' ' + v.y + ')'
  const rotate = ' rotate(' + angle + ')'
  const element = 'var(--element)'
  if (kind === 'projectile') return <>{frame.heads.map((h,i)=><g key={i} transform={at(pixel(h)) + ' rotate(' + (angle + cast.profile.spreadDeg[i]) + ')'}>
    <g transform={'scale(' + (r / 26) + ')'}><path d="M-58 5q23-11 49-8l1 12Z" fill={element} opacity=".72"/>
      <g transform={cast.moveType === 'rock' || cast.moveType === 'grass' ? 'rotate(' + p * 320 + ')' : undefined}>
        <Projectile type={cast.moveType} moveId={cast.moveId} /></g></g></g>)}</>
  if (kind === 'beam') {
    const tip = pixel(frame.beamTip)
    const len = Math.hypot(tip.x-origin.x,tip.y-origin.y)
    const wave = Math.sin(p * Math.PI * 6)
    const line = cast.moveType === 'electric'
      ? 'M0 0L' + len * .22 + ' ' + (wave * r*.45) + 'l' + (-len*.04) + ' ' + (-r*.60) + 'L' + len*.62 + ' ' + (r*.5) + 'l' + (-len*.06) + ' ' + (-r*.68) + 'L' + len + ' 0'
      : 'M0 0Q' + len*.5 + ' ' + r*.28*wave + ' ' + len + ' 0'
    return <g transform={at(origin) + rotate} fill="none" strokeLinecap="round">
      <path d={line} stroke={element} strokeWidth={r*1.7} opacity=".38"/><path d={line} stroke={element} strokeWidth={r*.95}/>
      <path d={line} stroke="#fff9ec" strokeWidth={r*.30}/><circle cx={len} r={r*.54} fill="#fffde3"/></g>
  }
  if (kind === 'dash') {
    const length = Math.min(108, Math.hypot(head.x - origin.x,head.y-origin.y))
    return <g transform={at(head) + rotate} fill={element}>
      {[0,1,2].map(i=><path key={i} opacity={.85-i*.14} d={'M0 ' + ((i-1)*r*.75) + 'l' + (-length*(1-Math.abs(i-1)*.2)) + ' 2 ' + (length*.7) + ' 4Z'}/>)}
      {cast.moveType === 'fire' && <path d={'M'+(-r*.3)+' '+(-r*.7)+'q'+(r*1.6)+' '+(r*.5)+' 0 '+(r*1.5)+'q'+(r*.8)+' '+(-r*.7)+' 0 '+(-r*1.5)+'Z'} fill="#fff3ad"/>}
    </g>
  }
  if (kind === 'cone') {
    const length = range * width, sweep = -halfAngleDeg + p * 2 * halfAngleDeg
    if (cast.moveId === 'bite' || cast.moveId === 'bugBite') return <g transform={at(origin)+rotate+' translate('+length*.66+' 0)'}
      fill="#f8ecd4" stroke={element} strokeWidth="4">
      {[-1,1].map(side=><g key={side} transform={'scale(1 '+side+') translate(0 '+(-11+10*p)+')'}>
        <path d="M-30-11q24-29 57-3l-2 9-7-4-6 10-5-14-9 11-4-13-11 9-2-13-10 5Z"/></g>)}</g>
    if (cast.moveId === 'lowKick') return <g transform={at(origin)+' rotate('+(angle+sweep)+')'} fill="none">
      <path d={'M'+length*.36+' '+(-length*.33)+' Q'+length*1.15+' 0 '+length*.67+' '+length*.25} stroke={element} strokeWidth="14"/>
      <path d={'M'+length*.48+' '+(-length*.25)+' Q'+length*1.02+' 0 '+length*.73+' '+length*.19} stroke="#fff5d0" strokeWidth="4"/></g>
    if (cast.moveId === 'vineWhip') return <g transform={at(origin) + ' rotate(' + (angle+sweep) + ')'} fill="none" strokeLinecap="round">
      <path d={'M0 0Q'+length*.34+' '+(-length*.10)+' '+length*.64+' '+(length*.06)+'T'+length+' 0'} stroke="#315c36" strokeWidth="12"/>
      <path d={'M0 -2Q'+length*.34+' '+(-length*.10-2)+' '+length*.64+' '+(length*.06-2)+'T'+length+' -2'} stroke="#a2ed66" strokeWidth="5"/></g>
    return <g transform={at(origin) + ' rotate('+(angle+sweep)+')'} fill="none" strokeLinecap="round">
      {[.61,.77,.93].map((k,i)=><path key={k} stroke={i===1?'#fffde6':element} strokeWidth={i===1?6:4} d={'M'+length*k*.92+' '+(-length*.22)+'Q'+length*k*1.1+' 0 '+length*k*.94+' '+length*.18}/>)}</g>
  }
  const center = pixel(kind === 'self' ? cast.origin : cast.target)
  return <g transform={at(center)} fill="none" stroke={element}>
    <circle r={r*(.25+p*.75)} strokeWidth={Math.max(2,(1-p)*8)} opacity={1-p*.55}/>
    <circle r={r*(.11+p*.55)} stroke="#fff7bd" strokeWidth="3"/>
    {Array.from({length:8},(_,i)=><g key={i} transform={'rotate('+i*45+') translate(0 '+(-r*(.28+p*.61))+')'}>
      {kind === 'self' ? <path fill="#c6ffb8" stroke="#4e934d" strokeWidth="2" d="M-3-9h6v6h6v6H3v6h-6V3h-6v-6h6Z"/>
        : <path fill={element} strokeWidth="0" d="m0-10 5 11-5 8-5-8Z"/>}</g>)}
  </g>
}

function Lob({ cast }: { cast: ArenaCast }) {
  if (!cast.profile.lobSpeed) return null
  const origin = pixel(cast.origin), target = pixel(cast.target)
  const distance = Math.hypot(target.x-origin.x,target.y-origin.y)
  const flight = distance / (cast.profile.lobSpeed * width) * 1000
  const p = Math.max(0,Math.min(1,1-(cast.profile.startupMs-cast.elapsedMs)/Math.max(1,flight)))
  if (!p) return null
  const x = origin.x+(target.x-origin.x)*p, y = origin.y+(target.y-origin.y)*p
  const rise = Math.sin(Math.PI*p)*Math.min(110,distance*.25)
  return <g><ellipse cx={x} cy={y} rx="13" ry="5" fill="#241c2e66"/>
    <g transform={'translate('+x+' '+(y-rise)+') rotate('+p*260+') scale(.7)'}><Projectile type="rock" moveId="rockThrow"/></g></g>
}

export function ArenaEffects({ casts, preview, effects, playing }: { casts: ArenaCast[]; preview?: ArenaCast; effects: boolean; playing: boolean }) {
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
          {effects && <Lob cast={cast}/>}
          <text x={label.x} y={Math.max(22,label.y-36)} className="ring-cast-name">{cast.moveName}</text></>}
        {frame.phase === 'active' && (effects ? (cast.profile.kind === 'projectile' && cast.result === 'hit' ? null : <Technique cast={cast}/>) :
          <g className={'ring-footprint ' + (enemy ? 'enemy' : 'ally')}><Footprint cast={cast}/></g>)}
      </g>
    })}
  </svg>
}
