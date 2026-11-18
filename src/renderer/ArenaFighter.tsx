import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ArenaCast } from '../game/arenaMoves'
import { arenaCastFrame, arenaHeightRatio, arenaMoveProfile } from '../game/arenaMoves'
import { species } from '../game/catalog'
import type { Position } from '../game/engine'
import type { ArenaFeedback } from '../game/trainerArena'
import { BattleSprite, battleSpriteFootprint } from './BattleSprite'
import { pokemonName, TeraIcon } from './shared'

export function ArenaFighter({ side, id, formId, pos, direction, casting, bodyStyle, feedback, health, playing, invincible, dynamax, tera }: {
  side: 'player' | 'enemy'; id: string; formId?: string; pos: Position; direction?: Position; bodyStyle?: CSSProperties
  casting?: ArenaCast; feedback: ArenaFeedback | null; health: number; playing: boolean; invincible?: boolean; dynamax?: boolean; tera?: string
}) {
  const previous = useRef(pos)
  const facing = useRef({ x: side === 'player' ? 1 : -1, y: 0 })
  const [hurt, setHurt] = useState(false)
  const lastMotion = useRef<'idle'|'walk'|'attack'|'shoot'|'charge'|'hurt'|'dodge'>('idle')
  const dx = pos.x - previous.current.x, dy = (pos.y - previous.current.y) * arenaHeightRatio
  const step = direction ?? { x: dx, y: dy }
  const walking = Math.hypot(step.x,step.y) > .0001
  const frame = casting && arenaCastFrame(casting)
  const freeToWalk = casting?.profile.kind === 'projectile' && casting.elapsedMs > casting.profile.startupMs + 150
  const acting = !!frame && !(freeToWalk && walking)
  const aim = acting ? frame.facing : walking ? step : facing.current
  useLayoutEffect(() => {
    previous.current = { ...pos }
    if (aim.x || aim.y) facing.current = { ...aim }
  })
  useEffect(() => {
    if (feedback?.kind !== 'hit' || feedback.actor === side) return
    setHurt(true)
    const timeout = window.setTimeout(() => setHurt(false), 200)
    return () => { window.clearTimeout(timeout); setHurt(false) }
  }, [feedback?.id, side])
  const heldBeam = casting?.profile.kind === 'beam' && (frame?.phase === 'active' || !!casting.beamStop)
  const ranged = casting && !['dash','cone'].includes(casting.profile.kind)
  const lobStart = casting?.profile.lobSpeed ? arenaMoveProfile({ id: casting.moveId }).startupMs : undefined
  const inFlight = casting && lobStart !== undefined && frame?.phase === 'windup' && casting.elapsedMs >= lobStart
  const spriteFrame = inFlight ? { phase: 'active' as const, progress: (casting.elapsedMs - lobStart) / Math.max(1, casting.profile.startupMs - lobStart) } : frame
  const motion = !playing ? lastMotion.current : invincible ? 'dodge' : heldBeam ? 'shoot' : hurt ? 'hurt' : acting ? (ranged ? (frame.phase === 'windup' && !inFlight ? 'charge' : 'shoot') : 'attack') : walking ? 'walk' : 'idle'
  useLayoutEffect(() => { lastMotion.current = motion }, [motion])
  const name = pokemonName(id, formId)
  const size = battleSpriteFootprint(species[id].pokedexNumber, formId, Boolean(dynamax))
  const style = { left: pos.x*100+'%', top: pos.y*100+'%', '--actor-size': size+'%', zIndex: 3 + Math.round(pos.y * 70) } as CSSProperties
  return <div className={'ring-fighter ' + side + (dynamax ? ' dynamax' : '')} data-motion={motion}
    data-side={side} data-emitting={ranged && acting ? true : undefined} data-beam-hit={heldBeam && hurt ? true : undefined} data-x={pos.x} data-y={pos.y} data-species={id} style={style}>
    <i className="ring-fighter-shadow"/>
    <div className="ring-fighter-motion" style={bodyStyle}>
      <BattleSprite id={species[id].pokedexNumber} formId={formId} facing={aim} motion={motion} paused={!playing} heldBeam={casting?.profile.kind === 'beam'} castFrame={spriteFrame} className="ring-actor-image" alt={name}/>
    </div>
    <div className="ring-fighter-label"><b>{name}</b><i><span style={{width: Math.max(0,Math.min(1,health))*100+'%'}}/></i></div>
    {tera && <span className="ring-tera"><TeraIcon type={tera}/></span>}
  </div>
}
