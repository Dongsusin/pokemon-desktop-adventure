import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import { createGame, dispatch, hydrateSave } from '../src/game/engine'
import { regionOrder, worldRegions } from '../src/game/regions/world'
import { battleVenue } from '../src/renderer/battleGround'
import manifest from '../src/renderer/battle-venues.json'
import { TrainerArena } from '../src/renderer/TrainerArena'
import { ChallengeActions } from '../src/renderer/Campaign'

afterEach(() => vi.unstubAllGlobals())

it('ships one named, distinct 600 by 380 arena for every playable gym, trial and league opponent', () => {
  const drawings = new Set<string>()
  let gyms = 0, otherBattles = 0
  expect(Object.keys(manifest).sort()).toEqual([...regionOrder].sort())
  for (const id of regionOrder) {
    const region = worldRegions[id]
    const trainers = [...region.gymTrainers, ...region.leagueTrainers, ...(region.finaleTrainer ? [region.finaleTrainer] : [])]
    const ids = trainers.map(t => t.id).sort()
    expect(Object.keys(manifest[id]).sort()).toEqual(ids)
    expect(readdirSync(join('assets/battle/venues', id)).sort()).toEqual(ids.map(key => key + '.png').sort())
    gyms += region.gymTrainers.length
    otherBattles += trainers.length - region.gymTrainers.length
    for (const trainer of trainers) {
      const { name, image } = battleVenue(id, trainer)
      expect(name).toMatch(/[가-힣]/)
      const png = readFileSync(join('assets', image))
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([600, 380])
      const digest = createHash('sha256').update(png).digest('hex')
      expect(drawings.has(digest), image).toBe(false)
      drawings.add(digest)
    }
  }
  expect([gyms, otherBattles]).toEqual([75, 48])
})

it.each([false, true])('renders the correct venue in the live and resumed battle (practice %s)', practice => {
  vi.stubGlobal('document', { baseURI: 'http://localhost/' })
  const game = createGame('squirtle', 1, { width: 1280, height: 720 }, 4000, 25)
  const trainer = worldRegions.kanto.gymTrainers[0]
  if (practice) game.campaign.badges.push(trainer.id)
  expect(dispatch(game, { type: 'travel', locationId: trainer.locationId })).toBe(true)
  expect(dispatch(game, { type: practice ? 'practice-gym' : 'challenge-gym' })).toBe(true)
  const venue = battleVenue('kanto', trainer)
  for (const save of [game, hydrateSave(game, 1)!]) {
    const arena = renderToStaticMarkup(<TrainerArena game={save} />)
    expect(arena).toContain(venue.image)
    expect(arena).toContain(venue.name!)
    expect(arena).toContain('data-venue="kanto/' + trainer.id + '"')
  }
})

it('offers each freely selectable Elite Four opponent a challenge button', () => {
  const game = createGame('squirtle', 1, { width: 1280, height: 720 }, 4000, 25)
  const region = worldRegions.unova
  game.regionId = region.id
  game.locationId = region.leagueLocationId
  game.campaign.badges = region.gymTrainers.map(trainer => trainer.id)
  const html = renderToStaticMarkup(<ChallengeActions game={game} kind="league" busy={false} begin={() => {}} />)
  for (const trainer of region.leagueTrainers.filter(trainer => trainer.role === 'elite')) {
    expect(html).toContain(trainer.name + '에게 도전')
    expect(html).not.toContain(battleVenue(region.id, trainer).image)
  }
})
