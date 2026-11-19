import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createGame, nextGymTrainer, type GameSave } from '../src/game/engine'
import { locationGateRules } from '../src/game/regions/locationGates'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'
import { RegionMap } from '../src/renderer/RegionMap'

beforeEach(() => vi.stubGlobal('document', { baseURI: 'http://localhost/' }))
afterEach(() => vi.unstubAllGlobals())

function opening(id: RegionId) {
  const game = createGame('charmander', 1, { width: 1280, height: 720 }, 12345, 30)
  game.regionId = id
  game.locationId = worldRegions[id].startLocationId
  return game
}

function render(game: GameSave, focus: string) {
  const html = renderToStaticMarkup(<RegionMap game={game} focus={focus} busy={false} begin={() => {}} travel={() => {}} />)
  const action = html.match(/<button class="primary kanto-travel"[^>]*>[^<]*<\/button>/)?.[0]
  expect(action).toBeDefined()
  return { html, action }
}

it('shows the regional map and location description without loading a terrain inset for any Kanto destination', () => {
  const game = opening('kanto')
  for (const place of worldRegions.kanto.locations) {
    const { html } = render(game, place.id)
    expect(html).toContain('maps/kanto/illustrated-map.png')
    expect(html).toContain('class="kanto-place-description"')
    expect(html.includes('maps/kanto/areas/'), place.id).toBe(false)
  }
})

it.each(regionOrder)('keeps locked %s destinations selectable and shows where to earn entry', id => {
  const game = opening(id)
  const region = worldRegions[id]
  const [destination, required] = Object.entries(locationGateRules[id]).find(([, count]) => count > 0)!
  const locked = render(game, destination)
  expect(locked.action).toContain('disabled=""')
  expect(locked.action).toContain('aria-describedby="map-travel-requirements"')
  expect(locked.html).toContain(region.locationById[destination].name + ' · 이동 잠김</option>')
  expect(locked.html).toContain('0/' + required + ' 완료')
  expect(locked.html).toMatch(/class="kanto-pin [^"]*is-locked[^"]*"/)
  game.campaign.badges = region.gymTrainers.slice(0, required).map(gym => gym.id)
  const open = render(game, destination)
  expect(open.action).toContain('이곳으로 이동')
  expect(open.action).not.toContain('disabled=')
  expect(open.html).not.toContain('id="map-travel-requirements"')
})

it.each(['kanto', 'alola'] as const)('names the next %s gym or trial and shows local progress', id => {
  const game = opening(id), region = worldRegions[id]
  const [destination, gate] = Object.entries(locationGateRules[id]).find(([place, rule]) =>
    rule > 1 && !region.locationById[place].afterFinale)!
  game.campaign.badges = [region.gymTrainers[0].id]
  const next = nextGymTrainer(game)!
  const { html } = render(game, destination)
  expect(html).toContain((id === 'alola' ? '시련·큰 시련 ' : '배지 ') + gate + '개')
  expect(html).toContain('1/' + gate + ' 완료')
  expect(html).toContain(next.name)
  expect(html).toContain('aria-label="' + region.locationById[next.locationId].name + ' 지도에서 보기"')
})

it('prioritizes the accessible Goldenrod city on its shared pin and keeps the locked tower in the place list', () => {
  const game = opening('johto')
  const region = worldRegions.johto
  game.campaign.badges = region.gymTrainers.slice(0, 2).map(gym => gym.id)
  const city = region.locationById['goldenrod-city'].name
  const tower = region.locationById['goldenrod-radio-tower'].name
  const { html } = render(game, region.startLocationId)
  const marker = (html.match(/<button[^>]*class="kanto-pin [^>]*>/g) ?? []).find(tag => tag.includes(tower))
  expect(marker).toContain('aria-description="' + city + ' 선택"')
  expect(marker).toContain(tower + ' · 이동 잠김')
  const towerSelection = render(game, 'goldenrod-radio-tower')
  const selectedPin = (towerSelection.html.match(/<button[^>]*class="kanto-pin [^>]*>/g) ?? []).find(tag => tag.includes(tower))
  expect(selectedPin).toContain('kanto-pin-dungeon')
  expect(selectedPin).toContain('is-locked')
  expect(towerSelection.action).toContain('disabled=""')
  expect(render(game, 'goldenrod-city').action).toContain('이곳으로 이동')
})

it.each([['kanto', 'mt-moon'], ['paldea', 'area-zero']] as const)('shows an open %s destination with badges alone', (id, location) => {
  const game = opening(id)
  game.campaign.badges = worldRegions[id].gymTrainers.map(gym => gym.id)
  const { action, html } = render(game, location)
  expect(action).toContain('이곳으로 이동')
  expect(action).not.toContain('disabled=')
  expect(html).not.toContain('id="map-travel-requirements"')
})

it('shows the current place and the conditions for returning to a legacy save location', () => {
  const game = opening('kanto')
  game.locationId = worldRegions.kanto.leagueLocationId
  const { html, action } = render(game, game.locationId)
  expect(action).toContain('이곳에 도착했습니다')
  expect(html).toContain('다시 방문하려면')
  expect(html).toContain('현재 위치 · ' + worldRegions.kanto.locationById[game.locationId].name)
})
