import { describe, expect, it } from 'vitest'
import {
  createGame, currentTrainer, dispatch, hydrateSave, playerStats, statsFor, tick,
  type GameSave,
} from '../src/game/engine'
import { regionOrder, worldRegions } from '../src/game/regions/world'

const bounds = { width: 1280, height: 720 }
const now = Date.UTC(2026, 10, 17)

function companion(instanceId: string, speciesId: string, level = 12, formId?: string) {
  return {
    instanceId, speciesId, level, currentHP: 32, ...(formId && { formId }),
    position: { x: 250, y: 300 }, direction: -1, state: 'IDLE',
    active: true, destination: null, restMs: 0, roamSeed: 1,
  }
}

// v0.15 only recorded experience, moves and held items on the fixed starter.
function importV14() {
  const game = createGame('charmander', 1, bounds, now, 123)
  return hydrateSave({
    ...game, schemaVersion: 14, starterSpeciesId: undefined,
    player: { ...game.player, speciesId: 'charizard', level: 22, exp: 37, currentHP: 43,
      heldItemId: 'muscleBand', moveIds: ['tackle', 'flameCharge'] },
    inventory: { ...game.inventory, muscleBand: 1, guardCharm: 1 },
    followers: [companion('caught-2', 'squirtle'), companion('caught-3', 'sandshrew', 18, 'sandshrew-alola')],
    boxes: [[null, null, { ...companion('caught-4', 'squirtle'), active: false }]],
  }, 1)!
}

const reload = (game: GameSave) => hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
const order = (game: GameSave) => [game.player, ...game.followers].map(mon => mon.instanceId)
const move = (game: GameSave, instanceId: string, toIndex: number) =>
  dispatch(game, { type: 'move-party-member', instanceId, toIndex })
const bank = (game: GameSave, instanceId: string) =>
  dispatch(game, { type: 'set-follower-active', instanceId, active: false })
const swap = (game: GameSave, partyInstanceId: string, boxInstanceId: string) =>
  dispatch(game, { type: 'swap-box-pokemon', partyInstanceId, boxInstanceId })

describe('ordered party and lead combatant', () => {
  it('boxes the evolved original starter, restores personal progress, and keeps like-species individuals distinct', () => {
    let game = importV14()
    const original = game.player.instanceId
    const progress = { instanceId: original, speciesId: 'charizard', level: 22, exp: 37, currentHP: 43,
      heldItemId: 'muscleBand', moveIds: ['tackle', 'flameCharge'] }
    expect(game.starterSpeciesId).toBe('charmander')
    expect(bank(game, original)).toBe(true)
    expect(order(game)).toEqual(['caught-2', 'caught-3'])
    expect(game.boxes[0][0]).toMatchObject(progress)
    expect(game.player).toMatchObject({ instanceId: 'caught-2', speciesId: 'squirtle', level: 12, exp: 0, currentHP: 32 })
    expect(dispatch(game, { type: 'equip-item', itemId: 'muscleBand' })).toBe(false)
    expect(dispatch(game, { type: 'equip-item', itemId: 'guardCharm' })).toBe(true)
    expect(dispatch(game, { type: 'set-moves', moveIds: ['tackle', 'waterGun'] })).toBe(true)
    game.player.exp = 9
    game = reload(game)
    expect(swap(game, 'caught-2', 'caught-4')).toBe(true)
    expect(game.player).toMatchObject({ instanceId: 'caught-4', exp: 0, heldItemId: null })
    expect(game.boxes[0][2]).toMatchObject({ instanceId: 'caught-2', exp: 9, heldItemId: 'guardCharm', moveIds: ['tackle', 'waterGun'] })
    expect(swap(game, 'caught-4', original)).toBe(true)
    expect(reload(game).player).toMatchObject(progress)
    expect(dispatch(game, { type: 'equip-item', itemId: null })).toBe(true)
    expect(swap(game, original, 'caught-2')).toBe(true)
    expect(dispatch(game, { type: 'equip-item', itemId: 'muscleBand' })).toBe(true)
  })

  it('performs stable moves between arbitrary positions and preserves the regional form and its lead stats', () => {
    let game = importV14()
    const starter = game.player.instanceId
    expect(move(game, 'caught-3', 1)).toBe(true)
    expect(order(game)).toEqual([starter, 'caught-3', 'caught-2'])
    expect(move(game, starter, 2)).toBe(true)
    expect(order(game)).toEqual(['caught-3', 'caught-2', starter])
    game = reload(game)
    expect(game.player).toMatchObject({ instanceId: 'caught-3', speciesId: 'sandshrew', formId: 'sandshrew-alola', currentHP: 32 })
    expect(playerStats(game)).toEqual(statsFor('sandshrew', 18, null, 'sandshrew-alola'))
    expect(playerStats(game)).not.toEqual(statsFor('sandshrew', 18))
    expect(move(game, 'caught-2', 0)).toBe(true)
    expect(reload(game).followers[0]).toMatchObject({ instanceId: 'caught-3', formId: 'sandshrew-alola', currentHP: 32 })
    const before = JSON.stringify(game)
    for (const target of [-1, 3, 1.5]) expect(move(game, 'caught-2', target)).toBe(false)
    expect(move(game, 'missing', 0)).toBe(false)
    expect(JSON.stringify(game)).toBe(before)
  })

  it('executes both battle turns with the appointed lead, gives it the victory experience and gives its former lead the reserve share', () => {
    const game = importV14()
    expect(move(game, 'caught-2', 0)).toBe(true)
    const starter = { ...game.followers[0] }
    const id = game.runtime.nextId++
    const enemy = { id, speciesId: 'charmander', currentHP: 500, maxHP: 500, level: 12,
      position: { ...game.player.position }, direction: -1 as const }
    game.wild = [enemy]
    game.player.state = 'BATTLE'
    Object.assign(game.runtime, { targetId: id, stateIn: 0, turn: 'player' })
    tick(game, 100, bounds)
    expect(game.effects).toContainEqual(expect.objectContaining({ kind: 'attack', actor: 'partner', moveType: 'water' }))
    expect(enemy.currentHP).toBeLessThan(500)
    const hp = game.player.currentHP
    const xp = game.player.exp
    game.runtime.stateIn = 0
    tick(game, 100, bounds)
    expect(game.player.currentHP).toBeLessThan(hp)
    expect(game.followers[0]).toMatchObject({ instanceId: starter.instanceId, currentHP: starter.currentHP, exp: starter.exp })
    enemy.currentHP = 1
    game.runtime.stateIn = 0
    tick(game, 100, bounds)
    expect(game.wins).toBe(1)
    expect(game.player.exp).toBeGreaterThan(xp)
    expect(reload(game).followers[0]).toMatchObject({ instanceId: starter.instanceId, exp: 37 + Math.floor((13 + 12 * 3) / 2), currentHP: 43 })
  })

  it('keeps rival teams tied to the original starter and refuses lead edits during a trainer battle, including after reload', () => {
    let game = importV14()
    const starter = game.player.instanceId
    expect(bank(game, starter)).toBe(true)
    for (const id of regionOrder.filter(id => id !== 'paldea')) {
      game.regionProgress[id] = { champion: true, badges: worldRegions[id].gymTrainers.map(gym => gym.id) }
    }
    game.regionId = 'paldea'
    game.campaign = { badges: worldRegions.paldea.gymTrainers.map(gym => gym.id), champion: true, leagueIndex: null, battle: null }
    game.locationId = 'mesagoza'
    expect(dispatch(game, { type: 'challenge-finale' })).toBe(true)
    game = reload(game)
    expect(game.player.speciesId).toBe('squirtle')
    expect(currentTrainer(game)?.team.at(-1)?.speciesId).toBe('meowscarada')
    const before = JSON.stringify(game)
    expect(bank(game, 'caught-2')).toBe(false)
    expect(move(game, 'caught-3', 0)).toBe(false)
    expect(swap(game, 'caught-2', starter)).toBe(false)
    expect(JSON.stringify(game)).toBe(before)
  })

  it('retains at least one party member while permitting a one-for-one exchange with the box', () => {
    const game = importV14()
    expect(bank(game, 'caught-2')).toBe(true)
    expect(bank(game, 'caught-3')).toBe(true)
    const starter = game.player.instanceId
    expect(bank(game, starter)).toBe(false)
    expect(order(game)).toEqual([starter])
    expect(swap(game, starter, 'caught-4')).toBe(true)
    expect(order(game)).toEqual(['caught-4'])
    expect(game.boxes[0][2]).toMatchObject({ instanceId: starter, exp: 37, currentHP: 43 })
  })
  it('avoids healing from repeated switching at a regional cap and keeps a Lv.1 lead playable after reload', () => {
    let game = importV14()
    const starter = game.player.instanceId
    Object.assign(game.followers[0], { level: 75, currentHP: 23 })
    Object.assign(game.followers[1], { level: 1, currentHP: 9 })
    for (let i = 0; i < 3; i++) {
      expect(move(game, 'caught-2', 0)).toBe(true)
      game = reload(game)
      expect(game.player.level).toBe(75)
      expect(move(game, starter, 0)).toBe(true)
      expect(game.followers[0].currentHP).toBe(23)
    }
    expect(move(game, 'caught-3', 0)).toBe(true)
    expect(reload(game).player).toMatchObject({ level: 1, currentHP: 9, moveIds: ['tackle'], formId: 'sandshrew-alola' })
  })

  it('lets a promoted regional capture evolve and restores its distinct form transition on restart', () => {
    let game = importV14()
    Object.assign(game.followers[1], { speciesId: 'wooper', formId: 'wooper-paldea', level: 20 })
    expect(move(game, 'caught-3', 0)).toBe(true)
    expect(dispatch(game, { type: 'evolve' })).toBe(true)
    game = reload(game)
    expect(game.player).toMatchObject({ speciesId: 'clodsire', instanceId: 'caught-3', state: 'EVOLUTION' })
    expect(game.effects).toContainEqual(expect.objectContaining({
      kind: 'evolution', fromSpeciesId: 'wooper', fromFormId: 'wooper-paldea', toSpeciesId: 'clodsire',
    }))
    expect(move(game, 'caught-2', 0)).toBe(false)
    for (let i = 0; i < 60 && game.player.state === 'EVOLUTION'; i++) tick(game, 100, bounds)
    expect(bank(game, 'caught-3')).toBe(true)
    expect(reload(game).boxes[0][0]).toMatchObject({ speciesId: 'clodsire', instanceId: 'caught-3' })
  })
})
