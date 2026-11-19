import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import { createGame, dispatch, hydrateSave, tick } from '../src/game/engine'
import { worldRegions } from '../src/game/regions/world'
import { trainerAvatars } from '../src/game/trainerAvatar'
import { parseCommand } from '../src/main/commands'
import { TrainerArena } from '../src/renderer/TrainerArena'
import { ArenaTrainers } from '../src/renderer/ArenaTrainers'
import { TrainerChoices, WildTrainer } from '../src/renderer/PlayerTrainer'

afterEach(() => vi.unstubAllGlobals())
const fresh = (slot = 1) => createGame('squirtle', slot, { width: 1280, height: 720 }, 4000, 25)

it('validates the avatar and the slot and persists an independent, one-time selection per save', () => {
  expect(parseCommand({ type: 'chooseTrainer', slot: 4, avatar: 'male' })).toBeNull()
  expect(parseCommand({ type: 'chooseTrainer', slot: 2, avatar: 'unknown' })).toBeNull()
  expect(parseCommand({ type: 'start', speciesId: 'squirtle', trainerAvatar: 'unknown' })).toBeNull()
  for (const [index, avatar] of trainerAvatars.entries()) {
    const slot = index + 1
    const game = fresh(slot)
    const request = { type: 'chooseTrainer', slot, avatar }
    expect(parseCommand(request)).toEqual(request)
    expect(parseCommand({ type: 'start', speciesId: 'squirtle', trainerAvatar: avatar })).toMatchObject({ trainerAvatar: avatar })
    expect(dispatch(game, { type: 'choose-trainer', avatar })).toBe(true)
    expect(dispatch(game, { type: 'choose-trainer', avatar: avatar === 'male' ? 'female' : 'male' })).toBe(false)
    expect(hydrateSave(game, slot)?.trainerAvatar).toBe(avatar)
  }
})

it('lets an old save choose a trainer and resume the same in-progress fight and party', () => {
  const game = fresh()
  const trainer = worldRegions.kanto.gymTrainers[0]
  dispatch(game, { type: 'travel', locationId: trainer.locationId })
  expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
  const { trainerAvatar, ...old } = game
  expect(trainerAvatar).toBeNull()
  for (const raw of [{ ...old, schemaVersion: 17 }, { ...old, trainerAvatar: 'unknown' }]) {
    const restored = hydrateSave(raw, 1)!
    expect(restored.trainerAvatar).toBeNull()
    expect(restored.player.instanceId).toBe(game.player.instanceId)
    expect(restored.campaign.battle?.trainerId).toBe(trainer.id)
    expect(restored.campaign.battle?.arena.paused).toBe(true)
    expect(dispatch(restored, { type: 'choose-trainer', avatar: 'female' })).toBe(true)
    const reopened = hydrateSave(restored, 1)!
    expect([reopened.trainerAvatar, reopened.campaign.battle?.trainerId]).toEqual(['female', trainer.id])
  }
})

it('uses six distinct transparent portraits and poses for selection and the battle sideline', () => {
  vi.stubGlobal('document', { baseURI: 'http://localhost/' })
  const drawings = new Set<string>()
  for (const avatar of trainerAvatars) {
    const selection = renderToStaticMarkup(<TrainerChoices value={avatar} choose={() => {}} busy={false} />)
    expect(selection.match(/type="radio"/g)).toHaveLength(2)
    expect(selection).toContain('trainers/player/' + avatar + '/front.png')
    expect(selection).toContain('trainers/player/' + avatar + '/portrait.png 160w')
    const portrait = readFileSync('assets/trainers/player/' + avatar + '/portrait.png')
    expect([portrait.readUInt32BE(16), portrait.readUInt32BE(20), portrait[25]]).toEqual([160, 160, 6])
    for (const pose of ['front', 'idle', 'command'] as const) {
      const path = 'trainers/player/' + avatar + '/' + pose + '.png'
      const png = readFileSync('assets/' + path)
      expect([png.readUInt32BE(16), png.readUInt32BE(20), png[25]]).toEqual([64, 64, 6])
      drawings.add(createHash('sha256').update(png).digest('hex'))
      if (pose === 'front') continue
      const arena = renderToStaticMarkup(<ArenaTrainers trainer={worldRegions.kanto.gymTrainers[0]}
        avatar={avatar} commanding={pose === 'command'} />)
      expect(arena).toContain(path)
      expect(arena).toContain('data-trainer-sprite="brock"')
    }
  }
  expect(drawings.size).toBe(6)
})

it('places the selected trainer behind the partner during wild encounters and changes pose on allied actions', () => {
  const game = fresh()
  dispatch(game, { type: 'choose-trainer', avatar: 'female' })
  expect(dispatch(game, { type: 'travel', locationId: 'route-1' })).toBe(true)
  game.effects = []
  game.settings.effects = false
  game.player.position = { x: 150, y: 200 }
  const field = () => renderToStaticMarkup(<WildTrainer game={game} viewportWidth={800} />)
  expect(field()).toBe('')
  game.player.state = 'CHASE'
  game.wild = [{ id: 9, speciesId: 'pidgey', level: 3, currentHP: 100, maxHP: 100, direction: 1, position: { x: 170, y: 200 } }]
  game.runtime.targetId = 9
  tick(game, 100, { width: 800, height: 600 })
  expect(game.player.state).toBe('BATTLE')
  const opening = structuredClone(game.runtime.fieldTrainerSpot!)
  expect(opening.x).toBeLessThan(game.player.position.x)
  const position = () => field().match(/style="([^"]+)"/)?.[1]
  const initialStyle = position()
  expect(initialStyle).toBeTruthy()
  expect(field()).toContain('female/idle.png')
  expect(field()).toContain('scaleX(1)')
  game.wild[0].position.x = 50
  game.player.position = { x: 440, y: 400 }
  expect(position()).toBe(initialStyle)
  expect(hydrateSave(game, 1)?.runtime.fieldTrainerSpot).toEqual(opening)
  const legacy = structuredClone(game)
  delete legacy.runtime.fieldTrainerSpot
  expect(hydrateSave(legacy, 1)?.runtime.fieldTrainerSpot).toMatchObject({ direction: -1 })
  game.runtime.turn = 'player'
  game.runtime.stateIn = 0
  tick(game, 100, { width: 800, height: 600 })
  expect(game.effects).toEqual([])
  expect(field()).toContain('female/command.png')
  tick(game, 580, { width: 800, height: 600 })
  expect(field()).toContain('female/idle.png')
  game.runtime.captureIn = 200
  game.runtime.targetId = null
  game.wild = []
  game.player.state = 'RECOVER'
  expect(position()).toBe(initialStyle)
  expect(field()).toContain('female/command.png')
  game.settings.overlayVisible = false
  expect(field()).toBe('')
})

it('keeps the arena trainer attached to the same floor position when camera and combatants move', () => {
  vi.stubGlobal('document', { baseURI: 'http://localhost/' })
  const game = fresh()
  dispatch(game, { type: 'choose-trainer', avatar: 'male' })
  dispatch(game, { type: 'travel', locationId: worldRegions.kanto.gymTrainers[0].locationId })
  expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
  const arena = game.campaign.battle!.arena
  const snapshot = () => {
    const html = renderToStaticMarkup(<TrainerArena game={game} />)
    const world = html.slice(html.indexOf('class="ring-world"'))
    return { camera: world.match(/transform:([^"]+)/)?.[1], trainer: world.match(/<img[^>]+class="player-trainer-sprite ring-player-trainer"[^>]+>/)?.[0] }
  }
  const start = snapshot()
  expect(start.trainer).toBeTruthy()
  arena.player.x = .82
  arena.enemy.x = .9
  const moved = snapshot()
  expect(moved.camera).not.toBe(start.camera)
  expect(moved.trainer).toEqual(start.trainer)
})
