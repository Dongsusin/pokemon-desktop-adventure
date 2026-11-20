import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createGame, regionalWeather } from '../src/game/engine'
import { species } from '../src/game/catalog'
import { fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'
import { RegionMap } from '../src/renderer/RegionMap'
import { PlaceGuideContent } from '../src/renderer/MapLocationTooltip'
import { describePlace, placeTrainers } from '../src/renderer/mapLocationGuide'

beforeEach(() => vi.stubGlobal('document', { baseURI: 'http://localhost/' }))
afterEach(() => vi.unstubAllGlobals())

function opening(regionId: RegionId) {
  const game = createGame('squirtle', 1, { width: 1280, height: 720 }, 4000, 25)
  game.regionId = regionId
  game.locationId = worldRegions[regionId].startLocationId
  return game
}

function guide(game: ReturnType<typeof opening>, id: string) {
  const place = worldRegions[game.regionId].locationById[id]
  return renderToStaticMarkup(<PlaceGuideContent game={game} place={place} />)
}

const selectedMap = (game: ReturnType<typeof opening>, focus: string) =>
  renderToStaticMarkup(<RegionMap game={game} focus={focus} busy={false} begin={() => {}} travel={() => {}} />)

it.each([['지도 툴팁', guide], ['장소의 출현 목록', selectedMap]] as const)('%s marks each wild, rare and research species from the caught Pokédex', (_label, render) => {
  const game = opening('kanto')
  game.pokedexCaught.push('pikachu', 'mew')
  game.pokedexSeen.push('pikachu', 'weedle', 'mew', 'bulbasaur')
  const row = (html: string, name: string) => html.match(/<li\b[^>]*>[\s\S]*?<\/li>/g)?.find(li => li.includes('>' + name + '<'))
  const forest = render(game, 'viridian-forest')
  expect(forest).toContain('도감 포획 1/7종')
  expect(row(forest, '피카츄')).toContain('포획함')
  expect(row(forest, '뿔충이')).toContain('미포획')
  expect(row(forest, '이상해씨')).toContain('미포획')
  expect(row(render(game, 'pokemon-mansion'), '뮤')).toContain('포획함')
  game.pokedexCaught.push('weedle')
  const updated = render(game, 'viridian-forest')
  expect(updated).toContain('도감 포획 2/7종')
  expect(row(updated, '뿔충이')).toContain('포획함')
})

it('separates the forest encounters from post-league visitors and describes a city with no wild encounters', () => {
  const game = opening('kanto')
  const forest = guide(game, 'viridian-forest')
  expect(forest).toContain('숲길')
  expect(forest).toContain('지우')
  for (const name of ['피카츄', '뿔충이', '딱충이', '단데기', '캐터피']) expect(forest).toContain(name)
  expect(forest.indexOf('이상해씨')).toBeGreaterThan(forest.indexOf('리그 우승 후 조사 출현'))
  const start = guide(game, game.locationId)
  expect(start).toContain('현재 위치')
  expect(start).not.toContain('오박사')
  expect(guide(game, 'indigo-plateau')).toContain('오박사')
  expect(start).toContain('일반 야생 포켓몬이 없습니다')
  expect(start).not.toContain('피카츄')
})

it('keeps shared-pin trainers tied to their own location and distinguishes a locked rare encounter', () => {
  const johto = opening('johto')
  expect(guide(johto, 'goldenrod-city')).toContain('꼭두')
  expect(guide(johto, 'goldenrod-city')).not.toContain('아폴로')
  expect(guide(johto, 'goldenrod-radio-tower')).toContain('아폴로')
  expect(guide(johto, 'goldenrod-radio-tower')).toContain('이동 잠김')
  const game = opening('kanto')
  const mansion = guide(game, 'pokemon-mansion')
  expect(mansion).toContain('뮤')
  expect(mansion).toContain('리그 우승 후 출현')
  game.campaign.champion = true
  expect(guide(game, 'pokemon-mansion')).not.toContain('리그 우승 후 출현')
})

it('uses the encounter table for the current Galar weather and includes the entire Friend Safari roster', () => {
  const galar = opening('galar')
  const forecast = regionalWeather(galar, 'rolling-fields')!
  const fields = guide(galar, 'rolling-fields')
  expect(fields).toContain(forecast.weather)
  for (const slot of forecast.encounters) expect(fields).toContain(species[slot.speciesId].nameKo)
  const kalos = opening('kalos')
  const safari = guide(kalos, 'friend-safari')
  const roster = new Set(worldRegions.kalos.locationById['friend-safari'].encounters.map(slot => slot.speciesId))
  expect(roster.size).toBeGreaterThan(100)
  for (const id of roster) expect(safari).toContain(species[id].nameKo)
})

it.each(regionOrder)('describes every %s location and includes all resident trainers and league opponents', regionId => {
  const game = opening(regionId), region = worldRegions[regionId]
  for (const place of region.locations) {
    expect(describePlace(game, place).trim().length).toBeGreaterThan(5)
    const names = placeTrainers(region, place)
    for (const trainer of [...fieldTrainersByRegion[regionId], ...region.leagueTrainers].filter(t => t.locationId === place.id)) {
      expect(names.some(name => name.includes(trainer.name))).toBe(true)
    }
  }
})
