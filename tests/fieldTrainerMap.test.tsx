import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createGame, dispatch, hydrateSave, type GameSave } from '../src/game/engine'
import { fieldTrainerById, fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { parseCommand } from '../src/main/commands'
import { Campaign, TrainerBattleCard } from '../src/renderer/Campaign'
import { FieldTrainerCard } from '../src/renderer/FieldTrainerCard'
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

it.each(regionOrder)('renders only a named challenge button for each %s field opponent', regionId => {
  const game = inRegion(regionId)
  for (const trainer of fieldTrainersByRegion[regionId]) {
    const button = () => renderToStaticMarkup(<FieldTrainerCard trainer={trainer} game={game} busy={false} challenge={() => {}} />)
    const name = renderToStaticMarkup(<>{trainer.name}</>)
    game.locationId = trainer.locationId
    expect(button()).toMatch(/^<button [^>]*>[^<]+<\/button>$/)
    expect(button()).toContain(name + '에게 도전</button>')
    expect(button()).not.toContain('disabled')
    const html = renderMap(game, trainer.locationId)
    expect(html).toContain('data-field-trainer="' + trainer.id + '"')
    expect(html).not.toMatch(/상대 기술과 기믹|상대 파티|trainer-team|field-party-picker|venue-preview|원작 파트너/)
    expect(html.slice(html.indexOf('class="kanto-map-image'), html.indexOf('class="kanto-map-key'))).not.toContain(fieldTrainerPortrait(trainer))
    game.campaign.fieldWins = [trainer.id]
    expect(button()).toContain(name + ' 연습 재대결</button>')
    game.campaign.fieldWins = []
    game.locationId = worldRegions[regionId].locations.find(p => p.id !== trainer.locationId)!.id
    expect(button()).toContain('disabled')
  }
})

it('hides gym, Elite Four, champion and finale rosters on the map and in the campaign', () => {
  for (const id of regionOrder) {
    const game = inRegion(id), region = worldRegions[id]
    for (const place of [region.gymTrainers[0].locationId, region.leagueLocationId, region.finaleTrainer?.locationId]) {
      if (!place) continue
      game.locationId = place
      game.campaign.badges = region.gymTrainers.map(t => t.id)
      game.campaign.champion = place === region.finaleTrainer?.locationId
      const html = renderMap(game) + renderToStaticMarkup(<Campaign game={game} busy={false} begin={() => {}} locate={() => {}} />)
      expect(html).not.toMatch(/상대 기술과 기믹|trainer-team|venue-preview|상대 파티/)
    }
  }
})

it('follows a previewed route encounter through a real challenge and a restored battle', () => {
  const game = inRegion('kanto'), trainer = fieldTrainerById['field-kanto-ash']!
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

it('sends only a valid party number for the selected source opponent', () => {
  const regular = { type: 'challengeFieldTrainer', trainerId: 'field-kanto-ash' } as const
  expect(parseCommand(regular)).toEqual(regular)
  expect(parseCommand({ ...regular, teamNumber: 3 })).toEqual({ ...regular, teamNumber: 3 })
  for (const teamNumber of [null, 0, fieldTrainerById[regular.trainerId]!.teams.length + 1, 1.5, '2']) expect(parseCommand({ ...regular, teamNumber })).toBeNull()
  const boss = { ...regular, trainerId: 'field-kanto-rocket-duo', teamNumber: 4 }
  expect(parseCommand(boss)).toEqual(boss)
})

it('reveals the active Pokémon alone when the battle panel opens', () => {
  const game = inRegion('kanto'), trainer = fieldTrainerById['field-kanto-ash']!
  game.locationId = trainer.locationId
  expect(dispatch(game, { type: 'challenge-field-trainer', trainerId: trainer.id })).toBe(true)
  const html = renderToStaticMarkup(<TrainerBattleCard game={game} />)
  expect(html).toContain('피카츄')
  expect(html).not.toMatch(/팬텀|루카리오|망나뇽|어래곤|상대 기술과 기믹|trainer-team|남은 포켓몬/)
  const arena = renderToStaticMarkup(<TrainerArena game={game} />)
  expect(arena.match(/class="ring-reserves"/g)).toHaveLength(1)
  expect(arena).not.toMatch(/팬텀|루카리오|망나뇽|어래곤/)
})
