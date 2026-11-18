import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createArenaCast } from '../src/game/arenaMoves'
import { moves } from '../src/game/engine'
import { NativeMove } from '../src/renderer/NativeMove'

const origin = { x: .25, y: .5 }, target = { x: .65, y: .5 }

describe('Resonance move playback', () => {
  it('transitions a flying Ember into its native impact frames at the actual hit', () => {
    const cast = createArenaCast(1, 'player', moves.ember, origin, target)
    cast.elapsedMs = cast.profile.startupMs + 450
    const flight = renderToStaticMarkup(<svg><NativeMove cast={cast}/></svg>)
    expect(flight).toContain('PRAS-%20Fire.png')
    const position = { x: .51, y: .38 }
    cast.impact = { position, elapsedMs: cast.elapsedMs }
    cast.result = 'hit'
    const hit = renderToStaticMarkup(<svg><NativeMove cast={cast}/></svg>)
    expect(hit).toContain('data-source-frame="6"')
    expect(hit).toContain('translate(' + position.x * 1200 + ' ' + position.y * 760 + ')')
    expect(hit).not.toBe(flight)
  })

  it('plays the source background for Confusion, a technique with no cel sheet', () => {
    const cast = createArenaCast(2, 'enemy', moves.confusion, origin, target)
    cast.elapsedMs = cast.profile.startupMs / 2
    const html = renderToStaticMarkup(<svg><NativeMove cast={cast}/></svg>)
    expect(html).toContain('PRAS-%20Confusion%20BG.png')
    expect(html).toContain('data-native-move="confusion"')
  })
})
