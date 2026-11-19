import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import { createGame, dispatch } from '../src/game/engine'
import { worldRegions, type RegionId } from '../src/game/regions/world'
import { parseCommand } from '../src/main/commands'
import { TrainerArena } from '../src/renderer/TrainerArena'
import { figures } from '../src/renderer/desktopSprites'

afterEach(() => vi.unstubAllGlobals())

function gym(region: RegionId, partner = 'squirtle') {
  const game = createGame('squirtle', 1, { width: 1280, height: 720 }, 4000, 25)
  game.regionId = region
  game.locationId = worldRegions[region].gymTrainers[0].locationId
  game.player.speciesId = partner
  game.player.level = 20
  game.player.moveIds = ['tackle', partner === 'charizard' ? 'ember' : 'waterGun']
  expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
  return game
}

it('shows the F shortcut and armed Z slot, keeping the fighter separate from a tera crystal', () => {
  vi.stubGlobal('document', { baseURI: 'http://localhost/' })
  const game = gym('alola')
  const html = () => renderToStaticMarkup(<TrainerArena game={game}/>)
  expect(html()).toContain('aria-keyshortcuts="F"')
  expect(parseCommand({ type: 'arenaInput', action: { type: 'arena-gimmick' } })).toEqual({
    type: 'arenaInput', action: { type: 'arena-gimmick' }
  })
  expect(dispatch(game, { type: 'arena-gimmick' })).toBe(true)
  const armed = html()
  expect(armed).toContain('data-skill-slot="1" data-gimmick="z"')
  expect(armed).toContain('data-aura="z"')
  expect(armed).toContain('물 타입의 다음 공격')
  expect(armed).not.toContain('class="ring-tera"')
  expect(figures(game)[0]).toMatchObject({ gimmick: 'z', teraType: undefined })
  game.settings.effects = false
  expect(html()).not.toContain('gimmick-flare')
  expect(html()).toContain('data-phase="active"')
})

it('draws Dynamax only on its active side, including when the desktop has other wild Pokémon', () => {
  const game = gym('galar')
  const other = { ...game.wild[0], id: 750, trainerId: undefined }
  game.wild.unshift(other)
  expect(dispatch(game, { type: 'arena-gimmick' })).toBe(true)
  const roster = figures(game)
  expect(roster[0].gimmick).toBe('dynamax')
  expect(roster.find(f => f.id === '750')?.gimmick).toBeUndefined()
  expect(roster[0].scale).toBeGreaterThan(roster.find(f => f.id === '750')!.scale)
})

it('lists both Charizard forms before activation and displays the selected native atlas', () => {
  vi.stubGlobal('document', { baseURI: 'http://localhost/' })
  const game = gym('kalos', 'charizard')
  const html = () => renderToStaticMarkup(<TrainerArena game={game}/>)
  const ready = html()
  expect(ready).toContain('aria-label="메가진화 모습"')
  expect(ready).toContain('value="charizard-mega-x"')
  expect(ready).toContain('value="charizard-mega-y"')
  const action = { type: 'arena-gimmick', formId: 'charizard-mega-y' } as const
  expect(parseCommand({ type: 'arenaInput', action })).toEqual({ type: 'arenaInput', action })
  expect(parseCommand({ type: 'arenaInput', action: { ...action, formId: 7 } })).toBeNull()
  expect(dispatch(game, action)).toBe(true)
  const active = html()
  expect(active).not.toContain('aria-label="메가진화 모습"')
  expect(active).toContain('data-atlas="charizard-mega-y"')
})
