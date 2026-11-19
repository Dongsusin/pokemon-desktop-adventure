import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createGame, dispatch, fieldTrainerRewards, hydrateSave, type GameSave } from '../src/game/engine'
import { fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'
import { RegionMap } from '../src/renderer/RegionMap'
import { TrainerArena } from '../src/renderer/TrainerArena'
import { fieldTrainerGround, fieldTrainerPortrait } from '../src/renderer/fieldTrainerArt'

beforeEach(() => vi.stubGlobal('document', { baseURI: 'http://localhost/' }))
afterEach(() => vi.unstubAllGlobals())

function inRegion(regionId: RegionId): GameSave {
  const game = createGame('squirtle', 1, { width: 1280, height: 720 }, 4000, 25)
  game.regionId = regionId
  game.locationId = worldRegions[regionId].startLocationId
  return game
}
const renderMap = (game: GameSave, focus?: string) =>
  renderToStaticMarkup(<RegionMap game={game} focus={focus} busy={false} begin={() => {}} travel={() => {}} />)

it.each(regionOrder)('lets players discover the named trainers on the %s map and inspect their actual teams', regionId => {
  const game = inRegion(regionId)
  for (const trainer of fieldTrainersByRegion[regionId]) {
    const html = renderMap(game, trainer.locationId)
    const marker = html.match(/<button[^>]+class="kanto-pin [^"]*has-field-trainer[^"]*"[^>]+>/g) ?? []
    expect(marker.some(node => node.includes(trainer.name))).toBe(true)
    expect(html).toContain('data-field-trainer="' + trainer.id + '"')
    expect(html).toContain(trainer.name + '의 포켓몬')
    expect(html).toContain(fieldTrainerPortrait(trainer))
    expect(html).toContain(fieldTrainerGround(trainer))
    if (game.locationId !== trainer.locationId) expect(html).not.toContain(trainer.name + '에게 도전</button>')
  }
})

it('shows the badge gate, exact payout, available challenge, and first-win status at a villain hideout', () => {
  const game = inRegion('kanto')
  const trainer = fieldTrainersByRegion.kanto.find(t => t.kind === 'villain' && t.requiredBadges > 0)!
  // A save from before route gates can already be at the encounter without its badge.
  game.locationId = trainer.locationId
  const html = () => renderMap(game)
  expect(html()).toContain('배지 ' + trainer.requiredBadges + '개 필요')
  expect(html()).toContain('disabled="">'+ trainer.name + '에게 도전')
  game.campaign.badges = worldRegions.kanto.gymTrainers.slice(0, trainer.requiredBadges).map(t => t.id)
  expect(html()).not.toContain('disabled="">'+ trainer.name + '에게 도전')
  const reward = fieldTrainerRewards(trainer)
  expect(html()).toContain('첫 승리 보상 · 기본 경험치 ' + reward.experience + ' · ' + reward.coins + '코인')
  game.campaign.fieldWins = [trainer.id]
  expect(html()).toContain('승리 완료')
  expect(html()).not.toContain(trainer.name + '에게 도전</button>')
})

it('shows which destinations need this win and distinguishes an optional trainer', () => {
  const game = inRegion('kanto')
  const ash = renderMap(game, 'viridian-forest')
  expect(ash).toContain('승리가 필요한 장소')
  expect(ash).toContain('>3번도로</button>')
  expect(ash).toContain('>달맞이산</button>')
  expect(renderMap(game, 'rock-tunnel')).toContain('트레이너 · 게임 · 자유 대결')
})

it('follows a previewed route encounter through a real challenge and a restored battle', () => {
  const game = inRegion('kanto'), trainer = fieldTrainersByRegion.kanto[0]
  expect(dispatch(game, { type: 'travel', locationId: trainer.locationId })).toBe(true)
  expect(renderMap(game)).toContain(trainer.name + '에게 도전</button>')
  expect(dispatch(game, { type: 'challenge-field-trainer', trainerId: trainer.id })).toBe(true)
  for (const save of [game, hydrateSave(game, 1)!]) {
    const html = renderToStaticMarkup(<TrainerArena game={save} />)
    expect(html).toContain('지역 트레이너전')
    expect(html).toContain(trainer.name)
    expect(html).toContain(fieldTrainerGround(trainer))
  }
})
