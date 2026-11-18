import { describe, expect, it } from 'vitest'
import { BOX_SIZE, MAX_PARTY_SIZE, createGame, dispatch, hydrateSave, tick, type GameSave, type PartyPokemon } from '../src/game/engine'

const bounds = { width: 1280, height: 720 }
const newGame = () => createGame('charmander', 1, bounds, Date.UTC(2026, 10, 17), 17)
const reload = (game: GameSave) => hydrateSave(JSON.parse(JSON.stringify(game)), 1)!

function member(id: number, active = true): PartyPokemon {
  return {
    instanceId: 'caught-' + id, speciesId: 'wooper', formId: 'wooper-paldea', level: 20, currentHP: 7,
    position: { x: 200 + id, y: 250 }, direction: -1, state: 'IDLE', active, destination: null,
    restMs: 0, roamSeed: id,
  }
}

function fullTeam(game: GameSave) {
  game.followers = Array.from({ length: MAX_PARTY_SIZE - 1 }, (_, i) => member(i + 1))
}

function weakEncounter(game: GameSave) {
  const id = game.runtime.nextId++
  game.wild = [{ id, speciesId: 'caterpie', level: 3, currentHP: 1, maxHP: 20,
    position: { ...game.player.position }, direction: -1 }]
  game.player.state = 'BATTLE'
  Object.assign(game.runtime, { rngState: 17, targetId: id, turn: 'player', captureIn: 0, stateIn: 0 })
}

describe('Pokémon storage boxes', () => {
  it('migrates each distinct v13 capture into a party or stable box slot, including multiple boxes of legacy reserves', () => {
    const game = newGame()
    const followers = [member(1, false), ...Array.from({ length: 6 }, (_, i) => member(i + 2)),
      ...Array.from({ length: BOX_SIZE }, (_, i) => member(10 + i, false))]
    const migrated = hydrateSave({ ...game, schemaVersion: 13, followers }, 1)!
    expect(migrated.player).toEqual(game.player)
    expect(migrated.followers.map(p => p.instanceId)).toEqual(followers.slice(1, 6).map(p => p.instanceId))
    expect(migrated.boxes).toHaveLength(2)
    expect(migrated.boxes.every(box => box.length === BOX_SIZE)).toBe(true)
    expect(migrated.boxes.flat().filter(Boolean)).toEqual([followers[0], { ...followers[6], active: false }, ...followers.slice(7)])
    expect(migrated.pokedexCaught).toContain('wooper')
    expect(migrated.runtime.nextId).toBeGreaterThan(39)
    expect(reload(migrated)).toEqual(migrated)
  })

  it('validates occupied positions and duplicate instance IDs across the party and boxes without shifting valid neighbors', () => {
    const game = newGame()
    fullTeam(game)
    const stored = member(33, false)
    const corrupted = { ...game, followers: [...game.followers, member(72)], boxes: [
      [null, game.followers[0], { ...stored, instanceId: game.player.instanceId }, null, stored, stored],
      [null, null, null, member(51, false)],
    ] }
    const loaded = hydrateSave(corrupted, 1)!
    expect(loaded.followers).toHaveLength(5)
    expect(loaded.boxes[0].slice(0, 6)).toEqual([{ ...member(72), active: false }, null, null, null, stored, null])
    expect(loaded.boxes[1][3]).toEqual(member(51, false))
    expect(loaded.runtime.nextId).toBeGreaterThan(72)
    expect(reload(loaded)).toEqual(loaded)
  })

  it('automatically sends catches to the next box when full and reuses empty slots for manual and automatic capture', () => {
    const game = newGame()
    fullTeam(game)
    game.runtime.nextId = 100
    game.boxes[0] = Array.from({ length: BOX_SIZE }, (_, i) => member(10 + i, false))
    weakEncounter(game)
    expect(dispatch(game, { type: 'throw-ball', itemId: 'pokeball' })).toBe(true)
    expect(game.boxes).toHaveLength(2)
    expect(game.boxes[1][0]).toMatchObject({ speciesId: 'caterpie', active: false })
    expect(game.history[0].text).toContain('박스 2')
    const secondBoxPokemon = game.boxes[1][0]
    game.boxes[0][8] = null
    weakEncounter(game)
    dispatch(game, { type: 'update-settings', settings: { autoCaptureBall: 'pokeball' } })
    tick(game, 200, bounds)
    expect(game.followers).toHaveLength(5)
    expect(game.boxes[0][8]).toMatchObject({ speciesId: 'caterpie', active: false })
    expect(game.boxes[1][0]).toEqual(secondBoxPokemon)
    expect(reload(game).boxes).toEqual(game.boxes)
  })

  it('deposits into a selected box, withdraws into a free slot and leaves full or invalid requests untouched', () => {
    const game = newGame()
    fullTeam(game)
    game.boxes[0] = Array.from({ length: BOX_SIZE }, (_, i) => member(10 + i, false))
    const first = game.followers[0]
    const move = (id: string, active: boolean, boxIndex?: number) =>
      dispatch(game, { type: 'set-follower-active', instanceId: id, active, boxIndex })
    const snapshot = JSON.stringify(game)
    expect(move(first.instanceId, false, 0)).toBe(false)
    expect(move(first.instanceId, false, 2)).toBe(false)
    expect(move(game.player.instanceId, false, 0)).toBe(false)
    expect(move('caught-10', true)).toBe(false)
    expect(JSON.stringify(game)).toBe(snapshot)
    expect(move(first.instanceId, false, 1)).toBe(true)
    expect(move(first.instanceId, false, 1)).toBe(true)
    expect(game.boxes[1][0]).toBe(first)
    const stored = game.boxes[0][2]!
    const position = { ...first.position }
    tick(game, 1000, bounds)
    expect(first.position).toEqual(position)
    expect(move(stored.instanceId, true)).toBe(true)
    expect(move(stored.instanceId, true)).toBe(true)
    expect(game.followers[4]).toBe(stored)
    expect(game.boxes[0][2]).toBeNull()
    expect(reload(game).boxes).toEqual(game.boxes)
  })

  it('swaps exact individuals in place at full party capacity and rejects stale exchanges atomically', () => {
    const game = newGame()
    fullTeam(game)
    const bond = { ...game.player }
    const stored = member(60, false)
    game.boxes[0][22] = stored
    const outgoing = game.followers[3]
    const swap = (partyInstanceId: string, boxInstanceId: string) =>
      dispatch(game, { type: 'swap-box-pokemon', partyInstanceId, boxInstanceId })
    expect(swap(outgoing.instanceId, stored.instanceId)).toBe(true)
    expect(game.followers[3]).toBe(stored)
    expect(game.boxes[0][22]).toBe(outgoing)
    expect(stored).toMatchObject({ active: true, formId: 'wooper-paldea', currentHP: 7, roamSeed: 60 })
    expect(outgoing).toMatchObject({ active: false, formId: 'wooper-paldea', currentHP: 7, roamSeed: 4 })
    const afterSwap = JSON.stringify(game)
    expect(swap(outgoing.instanceId, stored.instanceId)).toBe(false)
    expect(swap(stored.instanceId, stored.instanceId)).toBe(false)
    expect(JSON.stringify(game)).toBe(afterSwap)
    expect(game.player).toEqual(bond)
    expect(reload(game).boxes).toEqual(game.boxes)
  })
})
