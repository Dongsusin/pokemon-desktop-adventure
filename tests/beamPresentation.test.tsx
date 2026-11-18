import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { moves } from '../src/game/engine'
import { createArenaCast } from '../src/game/arenaMoves'
import { ArenaEffects } from '../src/renderer/ArenaEffects'

describe('beam contact on the battle screen', () => {
  it('draws both shafts exactly to the shared world point even with optional effects off', () => {
    const p = { x: .43, y: .5 }, e = { x: .59, y: .5 }, point = { x: .52, y: .46 }
    const player = createArenaCast(1, 'player', moves.waterGun, p, e)
    const enemy = createArenaCast(2, 'enemy', moves.thunderShock, e, p)
    for (const cast of [player, enemy]) {
      cast.elapsedMs = cast.profile.startupMs + 360
      cast.beamStop = point
    }
    const output = renderToStaticMarkup(<ArenaEffects casts={[player, enemy]} playing={false} effects={false}
      clash={{ playerCastId: 1, enemyCastId: 2, point, elapsedMs: 90, balance: .2, ratio: 1.1, origin: .5 }}/>)
    const shafts = [...output.matchAll(/data-beam-shaft="(player|enemy)"[^>]*transform="translate\(([^ ]+) ([^)]+)\) rotate\(([^)]+)\)"[^>]*><path d="M0 0H([^"]+)"/g)]
    expect(shafts).toHaveLength(2)
    for (const [, , x, y, angle, length] of shafts) {
      const radians = Number(angle) * Math.PI / 180
      expect(Number(x) + Number(length) * Math.cos(radians)).toBeCloseTo(point.x * 1200)
      expect(Number(y) + Number(length) * Math.sin(radians)).toBeCloseTo(point.y * 760)
    }
    expect(output).toContain('data-beam-clash="true"')
  })

  it('places the impact flash at the most recent contact and suppresses it during a clash', () => {
    const target = { x: .55, y: .4 }
    const cast = createArenaCast(9, 'player', moves.waterGun, { x: .34, y: .4 }, target)
    cast.elapsedMs = cast.profile.startupMs + 660
    cast.beam = { pulses: 4, hits: 3, lastHit: target, applied: 6, spent: false }
    const draw = () => renderToStaticMarkup(<ArenaEffects casts={[cast]} playing={false} effects clash={null}/>)
    const output = draw()
    expect(output).toContain('transform="translate(660 304)" data-beam-pulse="3"')
    cast.beamStop = { x: .46, y: .4 }
    expect(draw()).not.toContain('data-beam-pulse')
  })
})
