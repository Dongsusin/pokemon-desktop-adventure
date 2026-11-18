import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createGame, dispatch } from '../src/game/engine'
import { parseCommand } from '../src/main/commands'
import { SaveRepository } from '../src/main/saveRepository'

const start = Date.parse('2026-10-01T00:00:00Z')
const bounds = { width: 1280, height: 720 }

describe('local save repository', () => {
  let directory: string
  let repository: SaveRepository

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'adventure-save-'))
    repository = new SaveRepository(directory)
  })

  afterEach(() => {
    const target = resolve(directory)
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('adventure-save-')) {
      throw new Error('Invalid test save directory')
    }
    rmSync(target, { recursive: true, force: true })
  })

  it('keeps three independent slots and remembers the selected slot', () => {
    expect(repository.readSelectedSlot()).toBe(1)
    const first = createGame('charmander', 1, bounds, start)
    const second = createGame('squirtle', 2, bounds, start)
    first.coins = 35
    repository.write(first, start + 2000)
    repository.write(second, start + 3000)
    repository.writeSelectedSlot(2)

    const reloaded = new SaveRepository(directory)
    expect(reloaded.readSelectedSlot()).toBe(2)
    expect(reloaded.read(1)).toMatchObject({ status: 'clean', game: { coins: 35, lastSavedAt: new Date(start + 2000).toISOString() } })
    expect(reloaded.read(2)).toMatchObject({ status: 'clean', game: { player: { speciesId: 'squirtle' } } })
    expect(reloaded.read(3)).toEqual({ status: 'empty', game: null })
  })

  it('migrates a v13 party into boxes, saves a swap and recovers the migrated roster from backup', () => {
    const current = createGame('bulbasaur', 1, bounds, start)
    const legacy = {
      ...current, schemaVersion: 13, boxes: undefined,
      followers: Array.from({ length: 38 }, (_, index) => ({
        instanceId: 'caught-' + (index + 1), speciesId: 'wooper', formId: 'wooper-paldea',
        level: 10 + index, currentHP: 13, active: index < 5, position: { x: 20, y: 40 }
      }))
    }
    const primary = join(directory, 'slot1.json')
    writeFileSync(primary, JSON.stringify(legacy))
    const read = repository.read(1)
    expect(read.status).toBe('clean')
    const game = read.game!
    expect(game.followers.map(mon => mon.instanceId)).toEqual(legacy.followers.slice(0, 5).map(mon => mon.instanceId))
    expect(game.boxes.map(box => box.filter(Boolean).length)).toEqual([30, 3])
    expect(dispatch(game, { type: 'swap-box-pokemon', partyInstanceId: 'caught-5', boxInstanceId: 'caught-38' })).toBe(true)
    repository.write(game, start + 1000)
    expect(JSON.parse(readFileSync(primary + '.bak', 'utf8')).schemaVersion).toBe(13)

    const restored = new SaveRepository(directory).read(1).game!
    expect(restored.followers[4]).toMatchObject({ instanceId: 'caught-38', level: 47, formId: 'wooper-paldea' })
    expect(restored.boxes[1][2]).toMatchObject({ instanceId: 'caught-5', level: 14, formId: 'wooper-paldea' })
    expect(restored.player.instanceId).toBe(legacy.player.instanceId)
    expect(restored.pokedexCaught).toContain('wooper')

    repository.write(restored, start + 2000)
    writeFileSync(primary, '{')
    const backup = repository.read(1)
    expect(backup.status).toBe('recovered')
    expect(backup.game!.boxes).toEqual(restored.boxes)
    expect(backup.game!.followers).toEqual(restored.followers)
  })

  it('recovers the previous validated state and preserves a broken primary', () => {
    const game = createGame('bulbasaur', 1, bounds, start)
    repository.write(game, start)
    game.coins = 40
    repository.write(game, start + 2000)
    writeFileSync(join(directory, 'slot1.json'), '{truncated')
    const restored = repository.read(1)
    expect(restored).toMatchObject({ status: 'recovered', game: { coins: 0 } })
    repository.write(restored.game!, start + 4000)
    expect(repository.read(1)).toMatchObject({ status: 'clean', game: { coins: 0 } })
    const archived = readdirSync(directory).find((name) => name.startsWith('slot1.json.corrupt-'))
    expect(archived).toBeTruthy()
    expect(readFileSync(join(directory, archived!), 'utf8')).toBe('{truncated')
    expect(readdirSync(directory).some((name) => name.endsWith('.tmp'))).toBe(false)
  })

  it('rejects mismatched or invalid save files', () => {
    const game = createGame('squirtle', 2, bounds, start)
    writeFileSync(join(directory, 'slot1.json'), JSON.stringify(game))
    writeFileSync(join(directory, 'slot1.json.bak'), JSON.stringify({ schemaVersion: 500 }))
    expect(repository.read(1)).toEqual({ status: 'damaged', game: null })
  })
})

describe('desktop command validation', () => {
  it('limits renderer commands to known operations and names', () => {
    expect(parseCommand({ type: 'selectSlot', slot: 7 })).toBeNull()
    expect(parseCommand({ type: 'start', speciesId: '../slot' })).toBeNull()
    expect(parseCommand({ type: 'shell', path: 'file:///example' })).toBeNull()
    expect(parseCommand({ type: 'observe', alwaysOnTop: true })).toEqual({ type: 'observe' })
    expect(parseCommand({ type: 'useItem', itemId: 'potion' })).toEqual({ type: 'useItem', itemId: 'potion' })
    expect(parseCommand({ type: 'equip', itemId: 'muscleBand' })).toEqual({ type: 'equip', itemId: 'muscleBand' })
    expect(parseCommand({ type: 'throwBall', itemId: 'ultraBall' })).toEqual({ type: 'throwBall', itemId: 'ultraBall' })
    expect(parseCommand({ type: 'throwBall', itemId: 'potion' })).toBeNull()
    expect(parseCommand({ type: 'travel', locationId: 'route-1' })).toEqual({ type: 'travel', locationId: 'route-1' })
    expect(parseCommand({ type: 'travel', locationId: 'route-29' })).toEqual({ type: 'travel', locationId: 'route-29' })
    expect(parseCommand({ type: 'travel', locationId: 'route-999' })).toBeNull()
    expect(parseCommand({ type: 'transferRegion', regionId: 'johto' })).toEqual({ type: 'transferRegion', regionId: 'johto' })
    expect(parseCommand({ type: 'transferRegion', regionId: 'kanto' })).toEqual({ type: 'transferRegion', regionId: 'kanto' })
    expect(parseCommand({ type: 'transferRegion', regionId: 'hoenn' })).toEqual({ type: 'transferRegion', regionId: 'hoenn' })
    expect(parseCommand({ type: 'transferRegion', regionId: 'sinnoh' })).toEqual({ type: 'transferRegion', regionId: 'sinnoh' })
    expect(parseCommand({ type: 'transferRegion', regionId: 'unova' })).toEqual({ type: 'transferRegion', regionId: 'unova' })
    expect(parseCommand({ type: 'transferRegion', regionId: 'kalos' })).toEqual({ type: 'transferRegion', regionId: 'kalos' })
    expect(parseCommand({ type: 'transferRegion', regionId: 'alola' })).toEqual({ type: 'transferRegion', regionId: 'alola' })
    expect(parseCommand({ type: 'transferRegion', regionId: 'galar' })).toEqual({ type: 'transferRegion', regionId: 'galar' })
    expect(parseCommand({ type: 'transferRegion', regionId: 'paldea' })).toEqual({ type: 'transferRegion', regionId: 'paldea' })
    expect(parseCommand({ type: 'transferRegion', regionId: 'unknown' })).toBeNull()
    expect(parseCommand({ type: 'challengeFinale' })).toEqual({ type: 'challengeFinale' })
    expect(parseCommand({ type: 'travel', locationId: 'alola-route-2' })).toEqual({ type: 'travel', locationId: 'alola-route-2' })
    expect(parseCommand({ type: 'travel', locationId: 'kalos-route-2' })).toEqual({ type: 'travel', locationId: 'kalos-route-2' })
    expect(parseCommand({ type: 'travel', locationId: 'unova-route-19' })).toEqual({ type: 'travel', locationId: 'unova-route-19' })
    expect(parseCommand({ type: 'challengeLeague', trainerId: 'unova-caitlin' })).toEqual({ type: 'challengeLeague', trainerId: 'unova-caitlin' })
    expect(parseCommand({ type: 'challengeLeague', trainerId: '../outside' })).toBeNull()
    expect(parseCommand({ type: 'travel', locationId: 'route-201' })).toEqual({ type: 'travel', locationId: 'route-201' })
    expect(parseCommand({ type: 'travel', locationId: 'route-101' })).toEqual({ type: 'travel', locationId: 'route-101' })
    expect(parseCommand({ type: 'challengeGym', trainerId: 'blue' })).toEqual({ type: 'challengeGym' })
    expect(parseCommand({ type: 'challengeLeague' })).toEqual({ type: 'challengeLeague' })
    expect(parseCommand({ type: 'travel', locationId: '__proto__' })).toBeNull()
    expect(parseCommand({ type: 'setFollowerActive', instanceId: '../member', active: true })).toBeNull()
    expect(parseCommand({ type: 'setFollowerActive', instanceId: 'caught-1', active: false })).toEqual({
      type: 'setFollowerActive', instanceId: 'caught-1', active: false
    })
    expect(parseCommand({ type: 'settings', settings: { autoCaptureBall: 'greatBall' } })).toEqual({
      type: 'settings', settings: { autoCaptureBall: 'greatBall' }
    })
  })

  it('accepts box deposits and instance swaps and rejects malformed selections', () => {
    const deposit = { type: 'setFollowerActive', instanceId: 'caught-7', active: false, boxIndex: 1 }
    const swap = { type: 'swapBoxPokemon', partyInstanceId: '파티-1', boxInstanceId: 'caught-' + '8'.repeat(90) }
    expect(parseCommand(deposit)).toEqual(deposit)
    expect(parseCommand(swap)).toEqual(swap)
    for (const boxIndex of [-1, 1.5, '0', null, Number.MAX_SAFE_INTEGER + 1]) {
      expect(parseCommand({ ...deposit, boxIndex })).toBeNull()
    }
    expect(parseCommand({ ...deposit, active: true })).toBeNull()
    expect(parseCommand({ ...swap, boxInstanceId: swap.partyInstanceId })).toBeNull()
    expect(parseCommand({ ...swap, partyInstanceId: '' })).toBeNull()
    expect(parseCommand({ ...swap, boxInstanceId: 'a'.repeat(129) })).toBeNull()
  })

  it('accepts party moves to any of the six positions and rejects invalid indices', () => {
    const move = { type: 'movePartyMember', instanceId: 'caught-7', toIndex: 0 }
    for (const toIndex of [0, 1, 2, 3, 4, 5]) {
      expect(parseCommand({ ...move, toIndex })).toEqual({ ...move, toIndex })
    }
    for (const toIndex of [-1, 6, 0.5, '1', NaN, undefined]) {
      expect(parseCommand({ ...move, toIndex })).toBeNull()
    }
    expect(parseCommand({ ...move, instanceId: '' })).toBeNull()
  })

  it('normalizes supported settings and requires a separate login command', () => {
    expect(parseCommand({
      type: 'settings',
      settings: { fps: 15, overlayVisible: false, spriteScale: 9999, startOnLogin: true, shell: true }
    })).toEqual({
      type: 'settings',
      settings: { fps: 15, overlayVisible: false }
    })
    expect(parseCommand({ type: 'setLaunchAtLogin', enabled: true }))
      .toEqual({ type: 'setLaunchAtLogin', enabled: true })
  })
})
