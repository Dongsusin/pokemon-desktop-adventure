import { describe, expect, it } from 'vitest'
import { createGame, type Effect, type GameSave, type PartyPokemon } from '../src/game/engine'
import { fieldFrame, figures, poseFor } from '../src/renderer/desktopSprites'
import { spriteAtlas } from '../src/renderer/spriteAtlas'

const at = { x: 250, y: 200 }
const origin = () => createGame('squirtle', 1, { width: 1280, height: 720 }, 100, 7)
const bearings = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]]
const destination = (row: number) => ({ x: at.x + bearings[row][0] * 60, y: at.y + bearings[row][1] * 60 })
function appearance(game: GameSave, now: number, effects: Effect[] = [], lastRow?: number) {
  return figures(game).map(f => {
    const pose = poseFor(f, effects, 0)
    return { pose, frame: fieldFrame(f, pose, lastRow, now)! }
  })
}

describe('desktop directional actors', () => {
  it('reads all eight original Walk rows and progresses through authored frames', () => {
    const game = origin()
    game.player.position = at
    game.player.state = 'WANDER'
    for (let row = 0; row < 8; row++) {
      game.runtime.destination = destination(row)
      const { pose, frame } = appearance(game, 0)[0]
      expect(pose.motion).toBe('walk')
      const [y, , h, ax, ay] = spriteAtlas('7').walk
      expect(frame).toMatchObject({ key: '7', row, y: y + row * h, anchorX: ax, anchorY: ay })
      const nextFrameMs = (spriteAtlas('7').walk[6][0] + .1) / .06
      expect(appearance(game, nextFrameMs)[0].frame.frame).toBe(1)
    }
  })

  it('uses an independent direction for each of six party members, including duplicates and regional forms', () => {
    const game = origin()
    game.player.position = at
    game.player.state = 'WANDER'
    game.runtime.destination = destination(0)
    game.followers = Array.from({ length: 5 }, (_, i): PartyPokemon => ({
      instanceId: 'caught-' + i, speciesId: i === 4 ? 'rattata' : 'squirtle',
      ...(i === 4 && { formId: 'rattata-alola' }), direction: 1, position: at, active: true,
      destination: destination(i + 1), currentHP: 10, level: 5, state: 'WANDER', restMs: 0, roamSeed: 0,
    }))
    const sampled = appearance(game, 100)
    expect(sampled.map(a => a.frame.row)).toEqual([0, 1, 2, 3, 4, 5])
    expect(sampled[5].frame.key).toBe('rattata-alola')
    game.followers[0].state = 'IDLE'
    game.followers[0].destination = null
    const stopped = appearance(game, 200, [], 1)[1]
    expect(stopped.pose.motion).toBe('idle')
    expect(stopped.frame.row).toBe(1)
  })

  it('turns toward loot and opponents and distinguishes authored shot and contact strips', () => {
    const game = origin()
    game.player.position = at
    game.player.state = 'LOOT'
    game.runtime.destination = destination(2)
    game.runtime.drop = { itemId: 'potion', position: destination(7) }
    expect(appearance(game, 0)[0].frame.row).toBe(7)
    game.player.state = 'BATTLE'
    game.runtime.targetId = 17
    game.wild = [{ id: 17, speciesId: 'pikachu', direction: -1, level: 7, currentHP: 20, maxHP: 20, position: destination(3) }]
    expect(appearance(game, 0).map(a => a.frame.row)).toEqual([3, 7])
    const attack: Effect = { id: 21, kind: 'attack', moveId: 'waterGun', actor: 'partner', position: at, target: destination(3), durationMs: 560, remainingMs: 280 }
    expect(appearance(game, 0, [attack])[0].pose.motion).toBe('shoot')
    expect(appearance(game, 0, [{ ...attack, moveId: 'tackle' }])[0].pose.motion).toBe('attack')
  })

  it('swaps evolution atlases through the flash and reveals a captured party member after its ball opens', () => {
    const game = origin()
    game.player.speciesId = 'wartortle'
    const evolution: Effect = { id: 35, kind: 'evolution', actor: 'partner', fromSpeciesId: 'squirtle',
      toSpeciesId: 'wartortle', position: at, durationMs: 3200, remainingMs: 2560 }
    function leadKey() {
      const f = figures(game, evolution)[0]
      return fieldFrame(f, poseFor(f, [evolution], 0, evolution), 2, 0)!.key
    }
    expect(leadKey()).toBe('7')
    evolution.remainingMs = 800
    expect(leadKey()).toBe('8')

    const caught: Effect = { id: 36, kind: 'capture', actor: 'partner', targetActor: 23, speciesId: 'pikachu',
      captured: true, caughtInstanceId: 'caught-54', target: destination(2), position: at, durationMs: 1000, remainingMs: 800 }
    game.followers = [{ instanceId: 'caught-54', speciesId: 'pikachu', currentHP: 10, level: 5, direction: -1,
      active: true, position: destination(2), destination: null, state: 'IDLE', restMs: 0, roamSeed: 42 }]
    const early = figures(game, undefined, caught)
    expect(early.map(f => f.id)).toEqual(['partner', 'follower:caught-54', '23'])
    expect(poseFor(early[1], [caught], 0, undefined, caught).alpha).toBe(0)
    caught.remainingMs = 20
    const late = figures(game, undefined, caught)
    expect(late.map(f => f.id)).toEqual(['partner', 'follower:caught-54'])
    expect(poseFor(late[1], [caught], 0, undefined, caught).alpha).toBe(1)
  })
})
