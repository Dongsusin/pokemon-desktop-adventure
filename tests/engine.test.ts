import { castSkill, finishChallenge, idleUntilHit } from './trainerArenaDriver'
import { describe, expect, it } from 'vitest'
import { isMoveMotionSupported } from '../src/game/motionEligibility'
import { species, starterIds, wildIds } from '../src/game/catalog'
import { kantoLocationById, kantoLocations } from '../src/game/regions/kanto'
import { kantoGymTrainers, kantoLeagueTrainers } from '../src/game/regions/kantoCampaign'
import { regionOrder, worldRegions } from '../src/game/regions/world'
import {
  applyOffline,
  calculateDamage,
  canEvolve,
  canChallengeGym,
  canChallengeLeague,
  currentTrainer,
  canTransferRegion,
  effectiveLevel,
  levelCap,
  nextGymTrainer,
  nextLeagueTrainer,
  playerStats,
  movesFor,
  canThrowBall,
  captureChance,
  createGame,
  dispatch,
  hydrateSave,
  KANTO_LEGENDARY_ENCOUNTER_CHANCE,
  MAX_PARTY_SIZE,
  moves,
  requiredExp,
  statsFor,
  tick,
  typeMultiplier,
} from '../src/game/engine'
import type { GameSave, Wild } from '../src/game/engine'

const bounds = { width: 1280, height: 720 }
const startTime = Date.UTC(2026, 10, 17)
const makeGame = (id = 'charmander', seed = 17) => createGame(id, 1, bounds, startTime, seed)
const makeRouteGame = (id = 'charmander', seed = 17) => {
  const game = makeGame(id, seed)
  dispatch(game, { type: 'travel', locationId: 'route-1' })
  return game
}

function run(game: GameSave, seconds: number): void {
  for (let step = 0; step < seconds * 5; step++) tick(game, 200, bounds)
}

describe('starter selection and progression', () => {
  it('initializes each of the 27 unique starters into a valid saved game', () => {
    expect(new Set(starterIds).size).toBe(27)
    for (const id of starterIds) {
      const game = makeGame(id)
      expect(game.player).toMatchObject({ speciesId: id, level: 5, exp: 0, heldItemId: null })
      expect(game.locationId).toBe('pallet-town')
      expect(game.player.currentHP).toBe(statsFor(id, 5).hp)
      expect(game.inventory).toEqual({ potion: 5, pokeball: 8 })
      expect(game.player.moveIds).toContain('tackle')
      expect(game.player.moveIds.every(move => isMoveMotionSupported(id, undefined, move))).toBe(true)
      expect(hydrateSave(JSON.parse(JSON.stringify(game)), 1)).toEqual(game)
      expect(species[id].evolvesTo).toBeDefined()
      const next = species[species[id].evolvesTo!.speciesId]
      expect(next.evolvesTo).toBeDefined()
      expect(species[next.evolvesTo!.speciesId].evolvesTo).toBeUndefined()
    }
    expect(() => makeGame('not-a-species')).toThrow(RangeError)
    expect(() => createGame(starterIds[0], 4, bounds)).toThrow(RangeError)
  })

  it('retains identity, EXP, level, inventory, and held item when evolving', () => {
    const game = makeGame()
    const initialIdentity = game.player.instanceId
    game.player.level = 16
    game.player.exp = 9
    game.inventory.muscleBand = 1
    expect(dispatch(game, { type: 'equip-item', itemId: 'muscleBand' })).toBe(true)
    expect(canEvolve(game)).toBe(true)
    tick(game, 200, bounds)
    expect(game.player).toMatchObject({
      instanceId: initialIdentity, speciesId: 'charmeleon', level: 16, exp: 9,
      heldItemId: 'muscleBand', state: 'EVOLUTION',
    })
    expect(game.inventory).toEqual({ potion: 5, pokeball: 8, muscleBand: 1 })
    expect(game.pokedexCaught).toEqual(['charmander', 'charmeleon'])
    expect(canEvolve(game)).toBe(false)
    expect(game.effects).toContainEqual(expect.objectContaining({
      kind: 'evolution', actor: 'partner', fromSpeciesId: 'charmander',
      toSpeciesId: 'charmeleon', durationMs: 3200
    }))
    tick(game, 800, bounds)
    const loaded = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(loaded.player.state).toBe('EVOLUTION')
    expect(loaded.effects).toContainEqual(expect.objectContaining({
      kind: 'evolution', fromSpeciesId: 'charmander', toSpeciesId: 'charmeleon', remainingMs: 2400
    }))
    run(loaded, 3)
    expect(loaded.player.state).not.toBe('EVOLUTION')
    expect(loaded.runtime.evolutionFrom).toBeNull()
  })

  it('waits for a manual evolution request when automatic evolution is disabled', () => {
    const game = makeGame('bulbasaur')
    game.player.level = 16
    dispatch(game, { type: 'update-settings', settings: { autoEvolve: false } })
    run(game, 2)
    expect(game.player.speciesId).toBe('bulbasaur')
    expect(canEvolve(game)).toBe(true)
    expect(dispatch(game, { type: 'evolve' })).toBe(true)
    expect(game.player.speciesId).toBe('ivysaur')
  })
})

describe('Kanto travel and encounters', () => {
  function encounter(game: GameSave): Wild | undefined {
    game.wild = []
    game.player.state = 'IDLE'
    Object.assign(game.runtime, { spawnIn: 0, targetId: null })
    tick(game, 200, bounds)
    return game.wild[0]
  }

  it('starts in Pallet Town, validates travel, and never spawns wild Pokémon in encounterless towns', () => {
    const game = makeGame()
    expect(game.locationId).toBe('pallet-town')
    run(game, 180)
    expect(game.wild).toHaveLength(0)
    expect(game.wins + game.losses).toBe(0)
    expect(dispatch(game, { type: 'travel', locationId: '__proto__' })).toBe(false)
    expect(game.locationId).toBe('pallet-town')
    expect(dispatch(game, { type: 'travel', locationId: 'route-1' })).toBe(true)
    expect(game.history.at(-1)).toMatchObject({ kind: 'travel' })
    expect(game.effects).toContainEqual(expect.objectContaining({ kind: 'travel' }))
    expect(dispatch(game, { type: 'travel', locationId: 'route-1' })).toBe(true)
    expect(game.history.filter((entry) => entry.kind === 'travel')).toHaveLength(1)
    expect(encounter(game)).toBeDefined()
    expect(dispatch(game, { type: 'travel', locationId: 'pallet-town' })).toBe(true)
    expect(game.wild).toHaveLength(0)
    run(game, 180)
    expect(game.wild).toHaveLength(0)
  })

  it('uses each area’s actual regular species and levels independently of the player level', () => {
    const regularLocations = kantoLocations.filter((location) => location.encounters.length && !location.legends?.length)
    expect(regularLocations.length).toBeGreaterThan(15)
    const game = makeGame()
    game.player.level = 90
    for (const location of regularLocations) {
      dispatch(game, { type: 'travel', locationId: location.id })
      for (let trial = 0; trial < 40; trial++) {
        const wild = encounter(game)!
        expect(location.encounters.some((slot) => slot.speciesId === wild.speciesId && slot.level === wild.level)).toBe(true)
        expect(species[wild.speciesId].pokedexNumber).toBeLessThanOrEqual(151)
      }
    }
    dispatch(game, { type: 'travel', locationId: 'route-1' })
    const routeOne = Array.from({ length: 80 }, () => encounter(game)!)
    expect(new Set(routeOne.map((wild) => wild.speciesId))).toEqual(new Set(['rattata', 'pidgey']))
    expect(routeOne.every((wild) => wild.level >= 2 && wild.level <= 5)).toBe(true)
  })

  it('uses encounter weights and resumes the same local draws after reload', () => {
    const game = makeRouteGame('bulbasaur', 91)
    const counts = new Map<string, number>()
    const trials = 2000
    for (let trial = 0; trial < trials; trial++) {
      const id = encounter(game)!.speciesId
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    const local = kantoLocationById['route-1'].encounters
    const pidgeyChance = local.filter((slot) => slot.speciesId === 'pidgey').reduce((sum, slot) => sum + slot.weight, 0) /
      local.reduce((sum, slot) => sum + slot.weight, 0)
    expect(Math.abs(counts.get('pidgey')! / trials - pidgeyChance)).toBeLessThan(0.05)
    const resumed = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(resumed.locationId).toBe('route-1')
    expect(Array.from({ length: 40 }, () => encounter(resumed)?.speciesId))
      .toEqual(Array.from({ length: 40 }, () => encounter(game)?.speciesId))
  })

  it('keeps all four legends in their native areas with an independent 0.65% roll', () => {
    expect(KANTO_LEGENDARY_ENCOUNTER_CHANCE).toBe(0.0065)
    const expected = [
      ['power-plant', 'zapdos', 50],
      ['seafoam-islands', 'articuno', 50],
      ['victory-road', 'moltres', 50],
      ['cerulean-cave', 'mewtwo', 70],
    ] as const
    const fallbackRoll = Math.ceil((4294967296 - 1013904223) / 1664525)
    const game = makeGame()
    for (const [locationId, speciesId, level] of expected) {
      expect(dispatch(game, { type: 'travel', locationId })).toBe(true)
      game.runtime.rngState = fallbackRoll
      expect(encounter(game)).toMatchObject({ speciesId, level })
      game.runtime.rngState = 0
      expect(encounter(game)?.speciesId).not.toBe(speciesId)
      let rare = 0
      for (let draw = 1; draw <= 5000; draw++) {
        game.runtime.rngState = Math.imul(draw, 0x9e3779b9) >>> 0
        if (encounter(game)?.speciesId === speciesId) rare++
      }
      expect(rare).toBeGreaterThan(15)
      expect(rare).toBeLessThan(55)
    }
    for (const location of kantoLocations) {
      expect(location.encounters.every((slot) => !expected.some(([, speciesId]) => slot.speciesId === speciesId))).toBe(true)
      expect(location.legends?.every((slot) => expected.some(([id, speciesId]) => id === location.id && speciesId === slot.speciesId)) ?? true).toBe(true)
    }
  })

  it.each([
    ['chespin', 'chesnaught', 'articuno'],
    ['charmander', 'charizard', 'zapdos'],
    ['froakie', 'greninja', 'moltres'],
  ])('retains the post-League Kalos bird for an evolved %s across reload', (starter, evolution, bird) => {
    const game = makeGame(starter)
    game.player.speciesId = evolution
    game.regionId = 'kalos'
    game.locationId = 'sea-spirits-den'
    for (const region of regionOrder) {
      const wins = { champion: region !== 'kalos', badges: worldRegions[region].gymTrainers.map(trainer => trainer.id) }
      if (region === 'kalos') Object.assign(game.campaign, wins)
      else game.regionProgress[region] = wins
    }
    const rareRoll = Math.ceil((4294967296 - 1013904223) / 1664525)
    game.runtime.rngState = rareRoll
    expect(encounter(game)).toBeUndefined()
    game.runtime.rngState = rareRoll
    game.campaign.champion = true
    expect(encounter(game)).toMatchObject({ speciesId: bird, level: 70 })
    expect(hydrateSave(game, 1)?.wild).toEqual(game.wild)
    game.campaign.champion = false
    expect(hydrateSave(game, 1)?.wild).toHaveLength(0)
    game.campaign.champion = true
    game.wild[0].speciesId = bird === 'zapdos' ? 'moltres' : 'zapdos'
    expect(hydrateSave(game, 1)?.wild).toHaveLength(0)
  })

  it('settles prior loot once and clears the previous area’s opponent even if travel interrupts battle', () => {
    const game = makeRouteGame('squirtle')
    const oldWild = encounter(game)!
    game.player.state = 'LOOT'
    game.runtime.drop = { itemId: 'potion', position: { ...game.player.position } }
    expect(dispatch(game, { type: 'travel', locationId: 'pallet-town' })).toBe(true)
    expect(game.inventory.potion).toBe(6)
    expect(game.runtime.drop).toBeNull()
    expect(game.wild).toHaveLength(0)
    expect(game.player.state).toBe('IDLE')

    dispatch(game, { type: 'travel', locationId: 'route-1' })
    game.wild = [oldWild]
    game.runtime.targetId = oldWild.id
    game.runtime.autoCaptureTargetId = oldWild.id
    game.runtime.captureIn = 600
    game.player.state = 'BATTLE'
    expect(dispatch(game, { type: 'travel', locationId: 'pallet-town' })).toBe(true)
    expect(game.runtime.targetId).toBeNull()
    expect(game.runtime.autoCaptureTargetId).toBeNull()
    expect(game.runtime.captureIn).toBe(0)
    expect(game.inventory.potion).toBe(6)
    expect(game.coins).toBe(0)
    expect(game.wins + game.losses).toBe(0)
    expect(game.wild).toHaveLength(0)

    const stale = hydrateSave({
      ...game, wild: [oldWild], player: { ...game.player, state: 'BATTLE' },
      runtime: { ...game.runtime, targetId: oldWild.id },
    }, 1)!
    expect(stale.wild).toHaveLength(0)
    expect(stale.runtime.targetId).toBeNull()
    expect(stale.player.state).toBe('IDLE')
  })

  it('migrates existing profiles to Route 1 without refunding balls or losing earned drops', () => {
    const game = makeGame('squirtle')
    const { locationId: _oldLocation, ...saveFields } = game
    const old = {
      ...saveFields,
      schemaVersion: 3,
      coins: 72,
      inventory: { potion: 7, pokeball: 2 },
      player: { ...game.player, state: 'LOOT', level: 12 },
      runtime: { ...game.runtime, drop: { itemId: 'greatBall', position: game.player.position } },
    }
    const loaded = hydrateSave(old, 1)!
    expect(loaded).toMatchObject({
      schemaVersion: 16, locationId: 'route-1', coins: 72,
      inventory: { potion: 7, pokeball: 2, greatBall: 1 },
      player: { instanceId: game.player.instanceId, level: 12 },
    })
    expect(loaded.runtime.drop).toBeNull()
    expect(hydrateSave(JSON.parse(JSON.stringify(loaded)), 1)?.inventory.greatBall).toBe(1)
    expect(hydrateSave({ ...loaded, locationId: 'constructor' }, 1)?.locationId).toBe('route-1')
    const strolling = hydrateSave({ ...old, autoBattle: false }, 1)!
    expect(strolling.inventory.greatBall).toBe(1)
    expect(strolling.player.state).toBe('IDLE')
  })
})

describe('autonomous simulation', () => {
  it('walks across the desktop in both axes with short rests between destinations', () => {
    const game = makeGame('bulbasaur')
    game.runtime.spawnIn = 120000
    const positions = [game.player.position]
    const activities = new Set<string>()
    for (let step = 0; step < 240; step++) {
      tick(game, 200, bounds)
      positions.push(game.player.position)
      activities.add(game.player.state)
    }
    const xs = positions.map(({ x }) => x)
    const ys = positions.map(({ y }) => y)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(bounds.width * 0.55)
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(bounds.height * 0.5)
    expect(activities).toEqual(new Set(['IDLE', 'WANDER']))
    expect(game.wild).toHaveLength(0)
  })

  it('keeps walking with auto-hunt off, including after loading a legacy paused idle save', () => {
    const game = makeGame('bulbasaur')
    expect(dispatch(game, { type: 'set-auto-battle', value: false })).toBe(true)
    run(game, 8)
    expect(game.player.state).toBe('WANDER')
    expect(game.wild).toHaveLength(0)
    expect(game.runtime.spawnIn).toBe(5000)

    const legacy = {
      ...game, schemaVersion: 1, player: { ...game.player, state: 'PAUSED' },
      runtime: { ...game.runtime, pausedState: 'IDLE' },
    }
    const loaded = hydrateSave(legacy, 1)!
    const position = { ...loaded.player.position }
    expect(loaded.player.state).toBe('IDLE')
    expect(loaded.autoBattle).toBe(false)
    run(loaded, 10)
    expect(loaded.player.position).not.toEqual(position)
    expect(loaded.wins).toBe(0)
    expect(loaded.runtime.spawnIn).toBe(5000)
  })

  it('keeps a scaled sprite clear of the edges with its position anchored at the feet', () => {
    const game = makeGame('bulbasaur')
    dispatch(game, { type: 'update-settings', settings: { spriteScale: 2 } })
    game.player.position = { x: -40, y: -40 }
    tick(game, 0, bounds)
    expect(game.player.position.x).toBeGreaterThan(61)
    expect(game.player.position.y).toBeGreaterThan(122)
    game.player.position = { x: bounds.width + 40, y: bounds.height + 40 }
    tick(game, 0, bounds)
    expect(game.player.position.x).toBeLessThan(bounds.width - 61)
    expect(game.player.position.y).toBeLessThan(bounds.height - 12)
  })

  it('uses seedable randomness for encounters, battles and drops', () => {
    const games = [makeRouteGame('squirtle'), makeRouteGame('squirtle')]
    games.forEach((game) => run(game, 180))
    expect(games[0]).toEqual(games[1])
    expect(games[0].wins).toBeGreaterThan(1)
  })

  it('completes over 100 encounters while keeping battle and movement invariants', () => {
    const game = makeRouteGame('charmander', 12)
    let encountered = 0
    for (let step = 0; step < 48000; step++) {
      tick(game, 200, bounds)
      const total = game.wins + game.losses
      const { x, y } = game.player.position
      if (total < encountered || total > encountered + 1 ||
          game.wild.length > 2 || game.player.currentHP < 0 ||
          game.player.currentHP > statsFor(game.player.speciesId, game.player.level, game.player.heldItemId).hp ||
          x < 24 || y < 24 || x > bounds.width - 24 || y > bounds.height - 24) {
        throw new Error('Simulation invariant failed at step ' + step)
      }
      encountered = total
    }
    expect(encountered).toBeGreaterThan(100)
    expect(game.wins).toBeGreaterThan(100)
    expect(game.player.level).toBeGreaterThan(10)
    expect(game.coins).toBeGreaterThan(game.wins)
    expect(game.pokedexSeen.some((id) => wildIds.includes(id))).toBe(true)
    expect(Object.values(game.inventory).reduce((sum, count) => sum + count, 0)).toBeGreaterThan(5)
  })

  it('repositions the player and encounters when switching to a smaller work area', () => {
    const game = makeRouteGame()
    run(game, 6)
    expect(game.wild.length).toBeGreaterThan(0)
    tick(game, 200, { width: 45, height: 35 })
    for (const entry of [game.player, ...game.wild]) {
      expect(entry.position).toEqual({ x: 22.5, y: 17.5 })
    }
  })

  it('does not progress encounters while paused and resumes a saved active state', () => {
    const game = makeRouteGame()
    run(game, 6)
    const before = game.player.state
    dispatch(game, { type: 'set-auto-battle', value: false })
    const position = { ...game.player.position }
    const wild = structuredClone(game.wild)
    run(game, 60)
    expect(game.player.state).toBe('PAUSED')
    expect(game.player.position).toEqual(position)
    expect(game.wild).toEqual(wild)
    expect(game.wins + game.losses).toBe(0)
    const resumed = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    dispatch(resumed, { type: 'set-auto-battle', value: true })
    expect(resumed.player.state).toBe(before)
    run(resumed, 60)
    expect(resumed.wins).toBeGreaterThanOrEqual(1)
  })

  it('returns from a knockout without awarding EXP or coins', () => {
    const game = makeGame()
    const wildId = wildIds[0]
    const target: Wild = {
      id: 100, speciesId: wildId, currentHP: 200, maxHP: 200,
      direction: -1, level: 100, position: { ...game.player.position },
    }
    game.player.state = 'BATTLE'
    game.player.currentHP = 1
    game.wild = [target]
    Object.assign(game.runtime, { targetId: target.id, turn: 'wild', stateIn: 0 })
    tick(game, 200, bounds)
    expect(game.player.state).toBe('FAINT')
    expect(game.losses).toBe(1)
    expect(game.coins).toBe(0)
    expect(game.player.exp).toBe(0)
    run(game, 4)
    expect(game.player.currentHP).toBeGreaterThan(0)
  })
})

describe('combat, inventory, and save recovery', () => {
  it('migrates existing saves to topmost once while retaining progression and later opt-out', () => {
    const game = makeGame('bulbasaur')
    expect(game).toMatchObject({ schemaVersion: 16, settings: { alwaysOnTop: true } })
    const legacy = {
      ...game, schemaVersion: 1, settings: { ...game.settings, alwaysOnTop: false },
      player: { ...game.player, level: 10, exp: 22 },
      coins: 45, inventory: { potion: 7 },
    }
    const migrated = hydrateSave(legacy, 1)!
    expect(migrated).toMatchObject({
      schemaVersion: 16, locationId: 'route-1',
      settings: { alwaysOnTop: true }, coins: 45, inventory: { potion: 7, pokeball: 8 },
      player: { instanceId: game.player.instanceId, speciesId: 'bulbasaur', level: 10, exp: 22 },
    })
    expect(dispatch(migrated, { type: 'update-settings', settings: { alwaysOnTop: false } })).toBe(true)
    expect(hydrateSave(JSON.parse(JSON.stringify(migrated)), 1)?.settings.alwaysOnTop).toBe(false)
    expect(hydrateSave({ ...legacy, schemaVersion: migrated.schemaVersion + 1 }, 1)).toBeNull()
  })

  it('uses the abbreviated elemental damage formula and floors damage at one', () => {
    const attacker = statsFor('charmander', 5)
    const defender = statsFor('bulbasaur', 5)
    expect(typeMultiplier('fire', ['grass'])).toBe(1.5)
    expect(typeMultiplier('grass', ['fire'])).toBe(0.75)
    expect(typeMultiplier('fire', ['normal'])).toBe(1)
    expect(calculateDamage(moves.ember, attacker, defender, 5, ['grass'])).toBeGreaterThan(calculateDamage(moves.ember, attacker, defender, 5, ['water']))
    expect(calculateDamage(moves.tackle, { ...attacker, attack: 0 }, defender, 5, ['normal'])).toBe(1)
  })

  it('consumes only usable items and requires owned equipment', () => {
    const game = makeGame()
    expect(dispatch(game, { type: 'use-item', itemId: 'potion' })).toBe(false)
    game.player.currentHP = 1
    expect(dispatch(game, { type: 'use-item', itemId: 'potion' })).toBe(true)
    expect(game.inventory.potion).toBe(4)
    expect(game.player.currentHP).toBeGreaterThan(1)
    expect(dispatch(game, { type: 'equip-item', itemId: 'luckyEgg' })).toBe(false)
    game.inventory.luckyEgg = 1
    expect(dispatch(game, { type: 'equip-item', itemId: 'luckyEgg' })).toBe(true)
    expect(game.player.heldItemId).toBe('luckyEgg')
    expect(dispatch(game, { type: 'equip-item', itemId: null })).toBe(true)
    expect(game.inventory.luckyEgg).toBe(1)
  })

  it('collects a saved pending loot drop exactly once after restart', () => {
    const game = makeGame()
    game.runtime.drop = { itemId: 'potion', position: { ...game.player.position } }
    game.player.state = 'LOOT'
    game.runtime.stateIn = 0
    const loaded = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    run(loaded, 3)
    expect(loaded.inventory.potion).toBe(6)
    expect(loaded.runtime.drop).toBeNull()
    expect(loaded.history.filter((entry) => entry.kind === 'loot')).toHaveLength(1)
  })

  it('provides attacker, hit, defeat, drop and pickup data for the desktop presentation', () => {
    const game = makeGame('charmander', 12)
    const target: Wild = {
      id: 100, speciesId: 'bulbasaur', currentHP: 1, maxHP: 20,
      direction: -1, level: 3, position: { x: game.player.position.x + 60, y: game.player.position.y }
    }
    game.player.state = 'BATTLE'
    game.wild = [target]
    Object.assign(game.runtime, { targetId: target.id, turn: 'player', stateIn: 0 })
    tick(game, 200, bounds)
    expect(game.wins).toBe(1)
    expect(game.effects).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'attack', actor: 'partner', targetActor: target.id, moveType: 'fire' }),
      expect.objectContaining({ kind: 'damage', actor: target.id }),
      expect.objectContaining({ kind: 'defeat', actor: target.id, speciesId: target.speciesId })
    ]))
    const drop = game.runtime.drop!
    expect(drop.position).toEqual(target.position)
    expect(game.effects).toContainEqual(expect.objectContaining({ kind: 'loot', itemId: drop.itemId }))
    const previousCount = game.inventory[drop.itemId] ?? 0
    run(game, 2)
    expect(game.runtime.drop).toBeNull()
    expect(game.inventory[drop.itemId]).toBe(previousCount + 1)
    expect(game.effects).toContainEqual(expect.objectContaining({
      kind: 'pickup', actor: 'partner', itemId: drop.itemId, position: target.position, target: game.player.position
    }))
  })

  it('rejects invalid core fields and clamps unsupported setting or inventory values', () => {
    const game = makeGame()
    expect(hydrateSave(null, 1)).toBeNull()
    expect(hydrateSave(game, 2)).toBeNull()
    expect(hydrateSave({ ...game, player: { ...game.player, speciesId: 'constructor' } }, 1)).toBeNull()
    expect(hydrateSave({ ...game, player: { ...game.player, position: { x: NaN, y: 50 } } }, 1)).toBeNull()
    expect(hydrateSave({
      ...game,
      settings: { sound: 'false', fps: 345, spriteScale: 78, spawnRate: 0 },
      inventory: { potion: -1, luckyEgg: 2, fake: 10 },
    }, 1)).toMatchObject({
      settings: { sound: false, fps: 30, spriteScale: 2, spawnRate: 0.5 },
      inventory: { luckyEgg: 2 },
    })
  })
})

describe('capture and party', () => {
  function encounter(game: GameSave, speciesId: string, currentHP: number): Wild {
    const location = kantoLocations.find((entry) => [...entry.encounters, ...(entry.legends ?? [])].some((slot) => slot.speciesId === speciesId))!
    const slot = [...location.encounters, ...(location.legends ?? [])].find((entry) => entry.speciesId === speciesId)!
    dispatch(game, { type: 'travel', locationId: location.id })
    const wild: Wild = {
      id: game.runtime.nextId++, speciesId, level: slot.level, currentHP, maxHP: 20,
      position: { x: game.player.position.x + 60, y: game.player.position.y },
      direction: -1,
    }
    game.wild = [wild]
    game.player.state = 'BATTLE'
    Object.assign(game.runtime, { rngState: 17, targetId: wild.id, turn: 'player', spawnIn: 120000, stateIn: 200 })
    return wild
  }

  it('uses species, remaining HP and ball strength to calculate catch probability', () => {
    const game = makeGame()
    const rare = encounter(game, 'mewtwo', 20)
    const weak = { ...rare, currentHP: 1 }
    expect(captureChance(rare, 'pokeball')).toBeLessThan(captureChance(weak, 'pokeball'))
    expect(captureChance(weak, 'pokeball')).toBeLessThan(captureChance(weak, 'greatBall'))
    expect(captureChance(weak, 'greatBall')).toBeLessThan(captureChance(weak, 'ultraBall'))
    expect(captureChance(rare, 'pokeball')).toBeLessThan(captureChance({ ...rare, speciesId: 'caterpie' }, 'pokeball'))
    for (const speciesId of wildIds) {
      const chance = captureChance({ ...weak, speciesId }, 'ultraBall')
      expect(chance).toBeGreaterThan(0)
      expect(chance).toBeLessThan(1)
    }
  })

  it('spends one ball only in an active battle, appends the caught Pokémon and restores it after reload', () => {
    const game = makeGame()
    expect(canThrowBall(game, 'pokeball')).toBe(false)
    expect(dispatch(game, { type: 'throw-ball', itemId: 'pokeball' })).toBe(false)
    const wild = encounter(game, 'caterpie', 2)
    expect(canThrowBall(game, 'pokeball')).toBe(true)
    expect(canThrowBall(game, 'ultraBall')).toBe(false)
    expect(dispatch(game, { type: 'throw-ball', itemId: 'potion' })).toBe(false)
    expect(game.inventory.potion).toBe(5)
    expect(dispatch(game, { type: 'throw-ball', itemId: 'pokeball' })).toBe(true)
    expect(dispatch(game, { type: 'throw-ball', itemId: 'pokeball' })).toBe(false)
    expect(game.inventory.pokeball).toBe(7)
    expect(game.wild).toHaveLength(0)
    expect(game.runtime.targetId).toBeNull()
    expect(game.pokedexCaught).toContain(wild.speciesId)
    expect(game.wins).toBe(0)
    const follower = game.followers[0]
    expect(follower).toMatchObject({
      active: true, speciesId: wild.speciesId, level: wild.level, currentHP: statsFor(wild.speciesId, wild.level).hp,
    })
    expect(game.effects).toContainEqual(expect.objectContaining({
      kind: 'capture', captured: true, itemId: 'pokeball', targetActor: wild.id, caughtInstanceId: follower.instanceId,
    }))
    const loaded = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(loaded.followers).toEqual(game.followers)
    expect(loaded.inventory.pokeball).toBe(7)
    expect(loaded.pokedexCaught).toContain(wild.speciesId)
  })

  it('allows the wild Pokémon to act next after an unsuccessful throw and prevents immediate retries', () => {
    const game = makeGame()
    const wild = encounter(game, 'mewtwo', 20)
    const hp = game.player.currentHP
    expect(dispatch(game, { type: 'throw-ball', itemId: 'pokeball' })).toBe(true)
    expect(game.runtime.turn).toBe('wild')
    expect(game.runtime.targetId).toBe(wild.id)
    expect(game.inventory.pokeball).toBe(7)
    expect(game.followers).toHaveLength(0)
    expect(game.effects).toContainEqual(expect.objectContaining({ kind: 'capture', captured: false }))
    const restored = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(canThrowBall(restored, 'pokeball')).toBe(false)
    run(restored, 2)
    expect(restored.player.currentHP).toBe(hp)
    expect(dispatch(restored, { type: 'throw-ball', itemId: 'pokeball' })).toBe(false)
    tick(restored, 200, bounds)
    expect(restored.player.currentHP).toBeLessThan(hp)
    expect(restored.inventory.pokeball).toBe(7)
  })

  it('attempts optional automatic capture only once against the same weakened opponent, including after loading', () => {
    const game = makeGame()
    encounter(game, 'mewtwo', 7)
    expect(game.settings.autoCaptureBall).toBeNull()
    expect(dispatch(game, { type: 'update-settings', settings: { autoCaptureBall: 'pokeball' } })).toBe(true)
    tick(game, 200, bounds)
    expect(game.inventory.pokeball).toBe(7)
    expect(game.followers).toHaveLength(0)
    const restored = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(restored.settings.autoCaptureBall).toBe('pokeball')
    run(restored, 5)
    expect(restored.history.filter((entry) => entry.kind === 'capture')).toHaveLength(1)
    expect(restored.inventory.pokeball).toBe(7)
    expect(dispatch(restored, { type: 'update-settings', settings: { autoCaptureBall: null } })).toBe(true)
  })

  it('keeps five independent roaming followers and stores, activates and restores overflow members', () => {
    const game = makeGame()
    for (const id of ['caterpie', 'weedle', 'pidgey', 'rattata', 'spearow', 'metapod']) {
      encounter(game, id, 1)
      expect(dispatch(game, { type: 'throw-ball', itemId: 'pokeball' })).toBe(true)
      run(game, 3)
    }
    expect(game.followers).toHaveLength(5)
    const active = game.followers.filter((entry) => entry.active)
    expect(active).toHaveLength(MAX_PARTY_SIZE - 1)
    const stored = game.boxes[0][0]!
    const activeSet = (follower: typeof stored, active: boolean) =>
      dispatch(game, { type: 'set-follower-active', instanceId: follower.instanceId, active })
    expect(activeSet(stored, true)).toBe(false)
    expect(activeSet(active[0], false)).toBe(true)
    expect(activeSet(stored, true)).toBe(true)
    expect(game.followers.filter((entry) => entry.active)).toHaveLength(MAX_PARTY_SIZE - 1)

    dispatch(game, { type: 'set-auto-battle', value: false })
    const storedPosition = { ...active[0].position }
    const positions = new Map(game.followers.map((entry) => [entry.instanceId, { ...entry.position }]))
    run(game, 8)
    const moved = game.followers.filter((entry) => entry.active)
    expect(moved.every((entry) => entry.position.x !== positions.get(entry.instanceId)!.x ||
      entry.position.y !== positions.get(entry.instanceId)!.y)).toBe(true)
    expect(new Set(moved.map((entry) => JSON.stringify(entry.position))).size).toBe(moved.length)
    expect(active[0].position).toEqual(storedPosition)
    expect(hydrateSave(JSON.parse(JSON.stringify(game)), 1)?.followers).toEqual(game.followers)
  })

  it('grants migrated players basic capture stock once while keeping higher legacy stock and window settings', () => {
    const game = makeGame()
    const oldSave = {
      ...game, schemaVersion: 2, settings: { alwaysOnTop: false }, inventory: { potion: 7 },
    }
    const migrated = hydrateSave(oldSave, 1)!
    expect(migrated).toMatchObject({
      schemaVersion: 16, settings: { alwaysOnTop: false, autoCaptureBall: null }, inventory: { potion: 7, pokeball: 8 },
      followers: [], player: { instanceId: game.player.instanceId },
    })
    delete migrated.inventory.pokeball
    expect(hydrateSave(migrated, 1)?.inventory.pokeball).toBeUndefined()
    expect(hydrateSave({ ...oldSave, inventory: { pokeball: 12 } }, 1)?.inventory.pokeball).toBe(12)
  })
})

describe('offline progression', () => {
  it('settles elapsed time without paying for safe towns or encounters the party cannot tackle', () => {
    const game = makeGame()
    expect(applyOffline(game, startTime + 3_600_000)).toEqual({ minutes: 0, exp: 0, coins: 0 })
    expect(dispatch(game, { type: 'travel', locationId: 'cerulean-cave' })).toBe(true)
    expect(applyOffline(game, startTime + 7_200_000)).toEqual({ minutes: 0, exp: 0, coins: 0 })
    expect(game.lastSavedAt).toBe(new Date(startTime + 7_200_000).toISOString())
    expect(dispatch(game, { type: 'travel', locationId: 'route-1' })).toBe(true)
    expect(applyOffline(game, startTime + 7_260_000)).toMatchObject({ minutes: 1 })
    expect(game.player.exp).toBeGreaterThan(0)
  })

  it('caps eligible time at eight hours and settles once', () => {
    const game = makeRouteGame()
    const later = startTime + 24 * 3600000
    const reward = applyOffline(game, later)
    expect(reward.minutes).toBe(480)
    expect(reward.coins).toBeGreaterThan(0)
    expect(game.coins).toBe(reward.coins)
    expect(game.player.level).toBeGreaterThan(5)
    expect(applyOffline(game, later)).toEqual({ minutes: 0, exp: 0, coins: 0 })
  })

  it('gives no rewards for a reversed clock or during a paused game', () => {
    const game = makeGame()
    expect(applyOffline(game, startTime - 60_000).minutes).toBe(0)
    dispatch(game, { type: 'set-auto-battle', value: false })
    expect(applyOffline(game, startTime + 3_600_000)).toEqual({ minutes: 0, exp: 0, coins: 0 })
    expect(game.lastSavedAt).toBe(new Date(startTime + 3_600_000).toISOString())
  })

  it('does not accumulate XP beyond level 100', () => {
    const game = makeRouteGame()
    game.campaign.badges = kantoGymTrainers.map(trainer => trainer.id)
    game.player.level = 99
    game.player.exp = requiredExp(99) - 1
    expect(applyOffline(game, startTime + 3_600_000).exp).toBe(1)
    expect(game.player.level).toBe(100)
    expect(game.player.exp).toBe(0)
    expect(requiredExp(100)).toBe(0)
  })
})

describe('regional gyms and Pokémon Leagues', () => {
  function train(game: GameSave, speciesId: string, level: number) {
    game.player.speciesId = speciesId
    game.player.level = level
    game.player.currentHP = playerStats(game).hp
    game.player.moveIds = movesFor(speciesId, level).map(move => move.id)
  }

  it('runs a complete first gym at low level without consuming balls or requiring auto-hunt', () => {
    const game = makeGame('squirtle', 1)
    train(game, 'squirtle', 12)
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(false)
    dispatch(game, { type: 'travel', locationId: 'pewter-city' })
    dispatch(game, { type: 'set-auto-battle', value: false })
    dispatch(game, { type: 'update-settings', settings: { autoCaptureBall: 'pokeball' } })
    expect(canChallengeGym(game)).toBe(true)
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    expect(canChallengeGym(game)).toBe(false)
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(false)
    expect(currentTrainer(game)?.id).toBe('brock')
    expect(game.wild).toMatchObject([{ trainerId: 'brock', speciesId: 'geodude', level: 12 }])
    expect(canThrowBall(game, 'pokeball')).toBe(false)
    expect(dispatch(game, { type: 'throw-ball', itemId: 'pokeball' })).toBe(false)
    finishChallenge(game)
    expect(game.autoBattle).toBe(false)
    expect(game.campaign.badges).toEqual(['brock'])
    expect(game.wins).toBe(1)
    expect(game.inventory.pokeball).toBe(8)
    expect(game.runtime.drop).toBeNull()
    expect(game.history.some(log => log.text.includes('회색배지 획득'))).toBe(true)
    expect(game.pokedexSeen).toEqual(expect.arrayContaining(['geodude', 'onix']))
    const coins = game.coins
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(false)
    expect(game.coins).toBe(coins)
  })

  it('awards all eight badges and saves the ordered Elite Four and champion wins', () => {
    const game = makeGame('charmander', 2)
    train(game, 'charizard', 80)
    dispatch(game, { type: 'set-auto-battle', value: false })
    dispatch(game, { type: 'travel', locationId: 'indigo-plateau' })
    expect(canChallengeLeague(game)).toBe(false)
    expect(dispatch(game, { type: 'challenge-league' })).toBe(false)

    dispatch(game, { type: 'travel', locationId: 'cerulean-city' })
    expect(nextGymTrainer(game)?.id).toBe('brock')
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(false)
    const caps = [25, 30, 35, 40, 45, 50, 55, 60, 100]
    const partners = ['blastoise', 'venusaur', 'charizard', 'charizard', 'charizard', 'charizard', 'blastoise', 'blastoise']
    expect(levelCap(game)).toBe(caps[0])
    for (const [index, trainer] of kantoGymTrainers.entries()) {
      train(game, partners[index], 80)
      dispatch(game, { type: 'travel', locationId: trainer.locationId })
      expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
      finishChallenge(game)
      expect(game.campaign.badges).toContain(trainer.id)
      expect(levelCap(game)).toBe(caps[index + 1])
    }
    expect(game.campaign.badges).toHaveLength(8)
    expect(levelCap(game)).toBe(100)
    expect(dispatch(game, { type: 'transfer-region', regionId: 'johto' })).toBe(false)
    expect(dispatch(game, { type: 'challenge-league' })).toBe(false)
    dispatch(game, { type: 'travel', locationId: 'indigo-plateau' })
    const beforeLeague = game.coins
    for (const trainer of kantoLeagueTrainers) {
      expect(nextLeagueTrainer(game)?.id).toBe(trainer.id)
      expect(dispatch(game, { type: 'challenge-league' })).toBe(true)
      expect(currentTrainer(game)?.id).toBe(trainer.id)
      finishChallenge(game)
      expect(game.player.currentHP).toBe(statsFor(game.player.speciesId, game.player.level).hp)
      if (trainer.role === 'elite') expect(game.coins).toBe(beforeLeague)
    }
    expect(game.losses).toBe(0)
    expect(game.campaign).toMatchObject({ champion: true, leagueIndex: null, battle: null })
    expect(game.wins).toBe(13)
    expect(game.coins).toBeGreaterThan(beforeLeague)
    expect(dispatch(game, { type: 'challenge-league' })).toBe(false)
    const restored = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(restored.campaign).toEqual(game.campaign)
    expect(restored.locationId).toBe('indigo-plateau')
    expect(canChallengeLeague(restored)).toBe(false)
    expect(canTransferRegion(restored, 'johto')).toBe(true)
  })

  it('limits both battle and offline EXP to the current badge cap', () => {
    const game = makeRouteGame('squirtle')
    train(game, 'squirtle', 24)
    game.player.exp = requiredExp(24) - 1
    const target: Wild = {
      id: 100, speciesId: 'rattata', currentHP: 1, maxHP: 10,
      direction: -1, level: 3, position: { ...game.player.position },
    }
    game.wild = [target]
    game.player.state = 'BATTLE'
    Object.assign(game.runtime, { targetId: target.id, turn: 'player', stateIn: 0 })
    tick(game, 200, bounds)
    expect(game.player).toMatchObject({ level: 25, exp: 0 })
    expect(game.history.some(entry => entry.text.includes('+1 EXP'))).toBe(true)
    expect(applyOffline(game, startTime + 3_600_000)).toMatchObject({ exp: 0, minutes: 60 })
    expect(game.player.exp).toBe(0)

    dispatch(game, { type: 'travel', locationId: 'pewter-city' })
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    finishChallenge(game)
    expect(levelCap(game)).toBe(30)
    expect(game.player.exp).toBeGreaterThan(0)
    dispatch(game, { type: 'travel', locationId: 'route-1' })
    expect(applyOffline(game, startTime + 7_200_000).exp).toBeGreaterThan(0)
  })

  it('migrates a Kanto champion and carries the party through Johto badges and the league', () => {
    const game = makeGame('squirtle', 53)
    const johto = worldRegions.johto
    const kantoBadges = kantoGymTrainers.map(trainer => trainer.id)
    expect(dispatch(game, { type: 'travel', locationId: johto.startLocationId })).toBe(false)
    expect(dispatch(game, { type: 'transfer-region', regionId: 'johto' })).toBe(false)
    train(game, 'blastoise', 80)
    game.player.exp = 21
    let veteran = hydrateSave({
      ...game, schemaVersion: 5, locationId: worldRegions.kanto.leagueLocationId, coins: 330,
      campaign: { badges: kantoBadges, champion: true, leagueIndex: null, battle: null },
    }, 1)!
    expect(veteran.regionId).toBe('kanto')
    expect(levelCap(veteran)).toBe(100)
    expect(dispatch(veteran, { type: 'transfer-region', regionId: 'johto' })).toBe(true)
    expect(veteran).toMatchObject({
      regionId: 'johto', locationId: johto.startLocationId, coins: 330,
      campaign: { badges: [], champion: false },
      regionProgress: { kanto: { badges: kantoBadges, champion: true } },
      player: { instanceId: game.player.instanceId, speciesId: 'blastoise', level: 80, exp: 21 },
    })
    expect(levelCap(veteran)).toBe(25)
    expect(effectiveLevel(veteran)).toBe(25)
    expect(veteran.player.currentHP).toBe(statsFor('blastoise', 25).hp)
    expect(dispatch(veteran, { type: 'travel', locationId: 'pallet-town' })).toBe(false)
    expect(dispatch(veteran, { type: 'travel', locationId: 'route-29' })).toBe(true)
    veteran.runtime.spawnIn = 0
    tick(veteran, 200, bounds)
    const wild = veteran.wild[0]
    expect(wild).toBeDefined()
    expect(johto.locationById['route-29'].encounters).toContainEqual(expect.objectContaining({
      speciesId: wild.speciesId, level: wild.level
    }))
    expect(applyOffline(veteran, startTime + 3_600_000).exp).toBe(0)
    expect(veteran.player.exp).toBe(21)

    dispatch(veteran, { type: 'set-auto-battle', value: false })
    dispatch(veteran, { type: 'travel', locationId: johto.leagueLocationId })
    expect(dispatch(veteran, { type: 'challenge-league' })).toBe(false)
    for (const [index, trainer] of johto.gymTrainers.entries()) {
      expect(nextGymTrainer(veteran)?.id).toBe(trainer.id)
      train(veteran, ['blastoise', 'charizard', 'blastoise', 'blastoise', 'charizard', 'charizard', 'charizard', 'blastoise'][index], 80)
      dispatch(veteran, { type: 'travel', locationId: trainer.locationId })
      expect(dispatch(veteran, { type: 'challenge-gym' })).toBe(true)
      if (index === 0) {
        const saved = hydrateSave(JSON.parse(JSON.stringify(veteran)), 1)!
        expect(currentTrainer(saved)?.id).toBe(trainer.id)
        expect(saved.wild).toEqual(veteran.wild)
        const control = structuredClone(saved)
        control.player.level = effectiveLevel(saved)
        for (const challenger of [saved, control]) {
          castSkill(challenger)
        }
        const cappedDamage = saved.effects.find(entry => entry.kind === 'damage')
        expect(cappedDamage?.text).toMatch(/^−\d+$/)
        expect(cappedDamage?.text).toBe(control.effects.find(entry => entry.kind === 'damage')?.text)
        veteran = saved
      }
      finishChallenge(veteran)
      expect(veteran.campaign.badges).toContain(trainer.id)
      expect(levelCap(veteran)).toBe(johto.levelCaps[index + 1])
    }
    expect(levelCap(veteran)).toBe(100)
    dispatch(veteran, { type: 'travel', locationId: johto.leagueLocationId })
    for (const trainer of johto.leagueTrainers) {
      expect(nextLeagueTrainer(veteran)?.id).toBe(trainer.id)
      expect(dispatch(veteran, { type: 'challenge-league' })).toBe(true)
      expect(currentTrainer(veteran)?.id).toBe(trainer.id)
      finishChallenge(veteran)
    }
    expect(veteran.campaign.champion).toBe(true)
    expect(veteran.history.some(entry => entry.text.includes('성도 포켓몬 리그 우승'))).toBe(true)
    const restored = hydrateSave(JSON.parse(JSON.stringify(veteran)), 1)!
    expect(restored.regionId).toBe('johto')
    expect(restored.regionProgress).toEqual(veteran.regionProgress)
    expect(restored.campaign).toEqual(veteran.campaign)
    expect(dispatch(restored, { type: 'transfer-region', regionId: 'kanto' })).toBe(true)
    expect(restored.campaign).toMatchObject({ champion: true, badges: kantoBadges })
    expect(dispatch(restored, { type: 'transfer-region', regionId: 'johto' })).toBe(true)
    expect(restored.campaign).toEqual(veteran.campaign)
    expect(levelCap(restored)).toBe(100)
  })

  it.each([
    { schema: 6, from: 'johto', to: 'hoenn', start: 'littleroot-town', route: 'route-101' },
    { schema: 7, from: 'hoenn', to: 'sinnoh', start: 'twinleaf-town', route: 'route-201' },
    { schema: 8, from: 'sinnoh', to: 'unova', start: 'aspertia-city', route: 'unova-route-19' },
    { schema: 9, from: 'unova', to: 'kalos', start: 'vaniville-town', route: 'kalos-route-2' },
    { schema: 10, from: 'kalos', to: 'alola', start: 'alola-route-1', route: 'alola-route-2' },
    { schema: 11, from: 'alola', to: 'galar', start: 'postwick', route: 'galar-route-1' },
    { schema: 12, from: 'galar', to: 'paldea', start: 'cabo-poco', route: 'south-province-area-one' },
  ] as const)('continues a schema $schema champion through $to and restores every regional record', ({ schema, from, to, start, route }) => {
    const previous = makeGame('mudkip', 37)
    const region = worldRegions[to]
    const journey = regionOrder.slice(0, regionOrder.indexOf(to) + 1)
    const earned = Object.fromEntries(journey.slice(0, -1).map(id => [
      id, { champion: true, badges: worldRegions[id].gymTrainers.map(gym => gym.id) },
    ]))
    const { [from]: lastWin, ...archived } = earned
    const oldSave = {
      ...previous, schemaVersion: schema, regionId: from, regionProgress: archived,
      locationId: worldRegions[from].leagueLocationId, campaign: { ...previous.campaign, ...lastWin },
    }
    expect(canTransferRegion(previous, to)).toBe(false)
    const runnerUp = hydrateSave({ ...oldSave, campaign: { ...lastWin, champion: false } }, 1)!
    expect(dispatch(runnerUp, { type: 'transfer-region', regionId: to })).toBe(false)
    expect(dispatch(runnerUp, { type: 'travel', locationId: route })).toBe(false)

    let game = hydrateSave(oldSave, 1)!
    train(game, 'swampert', 100)
    expect(dispatch(game, { type: 'transfer-region', regionId: to })).toBe(true)
    expect(game.regionProgress).toEqual(earned)
    expect(game.locationId).toBe(start)
    expect(levelCap(game)).toBe(25)
    expect(effectiveLevel(game)).toBe(25)
    expect(game.player.instanceId).toBe(previous.player.instanceId)
    expect(dispatch(game, { type: 'travel', locationId: route })).toBe(true)
    game.runtime.spawnIn = 0
    tick(game, 200, bounds)
    expect(region.locationById[route].encounters).toContainEqual(expect.objectContaining({
      speciesId: game.wild[0].speciesId, level: game.wild[0].level,
    }))
    dispatch(game, { type: 'set-auto-battle', value: false })
    expect(dispatch(game, { type: 'travel', locationId: region.leagueLocationId })).toBe(true)
    expect(dispatch(game, { type: 'challenge-league' })).toBe(false)

    for (const [index, trainer] of region.gymTrainers.entries()) {
      expect(nextGymTrainer(game)?.id).toBe(trainer.id)
      expect(dispatch(game, { type: 'travel', locationId: trainer.locationId })).toBe(true)
      expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
      game = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
      expect(currentTrainer(game)?.id).toBe(trainer.id)
      finishChallenge(game)
      expect(game.campaign.badges).toHaveLength(index + 1)
      expect(levelCap(game)).toBe(region.levelCaps[index + 1])
    }
    expect(dispatch(game, { type: 'travel', locationId: region.leagueLocationId })).toBe(true)
    const elites = region.leagueTrainers.filter(trainer => trainer.role === 'elite')
    const champion = region.leagueTrainers.find(trainer => trainer.role === 'champion')!
    expect(dispatch(game, { type: 'challenge-league', trainerId: champion.id })).toBe(false)
    const opponents = [...(region.freeEliteOrder ? elites.reverse() : elites), champion]
    for (const trainer of opponents) {
      if (!region.freeEliteOrder) expect(nextLeagueTrainer(game)?.id).toBe(trainer.id)
      expect(dispatch(game, { type: 'challenge-league', trainerId: trainer.id })).toBe(true)
      game = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
      expect(currentTrainer(game)?.id).toBe(trainer.id)
      finishChallenge(game)
      expect(dispatch(game, { type: 'challenge-league', trainerId: trainer.id })).toBe(false)
      if (region.freeEliteOrder && game.campaign.leagueIndex === 1) {
        const leftLeague = structuredClone(game)
        dispatch(leftLeague, { type: 'travel', locationId: start })
        expect(leftLeague.campaign.leagueIndex).toBeNull()
        expect(leftLeague.campaign.eliteWins).toBeUndefined()

        const lost = structuredClone(game)
        expect(dispatch(lost, { type: 'challenge-league' })).toBe(true)
        lost.player.currentHP = 1
        idleUntilHit(lost)
        expect(lost.campaign.leagueIndex).toBeNull()
        expect(lost.campaign.eliteWins).toBeUndefined()
        expect(lost.campaign.badges).toHaveLength(region.gymTrainers.length)
        expect(dispatch(lost, { type: 'challenge-league', trainerId: trainer.id })).toBe(true)
      }
    }
    expect(game.campaign.champion).toBe(true)
    for (const regionId of journey) {
      expect(dispatch(game, { type: 'transfer-region', regionId })).toBe(true)
      game = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
      expect(game.regionId).toBe(regionId)
      expect(Object.keys(game.regionProgress)).toHaveLength(journey.length - 1)
      expect(game.campaign.champion).toBe(true)
      expect(levelCap(game)).toBe(100)
    }
  })

  it('resumes the exact trainer opponent and health on save reload', () => {
    const game = makeGame('bulbasaur')
    train(game, 'ivysaur', 20)
    dispatch(game, { type: 'travel', locationId: 'pewter-city' })
    dispatch(game, { type: 'set-auto-battle', value: false })
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    run(game, 3)
    expect(game.campaign.battle).toBeTruthy()
    const restored = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(restored.campaign.battle?.trainerId).toBe(game.campaign.battle?.trainerId)
    expect(restored.campaign.battle?.opponentIndex).toBe(game.campaign.battle?.opponentIndex)
    expect(restored.campaign.battle?.arena.paused).toBe(true)
    expect(restored.wild).toEqual(game.wild)
    expect(restored.player.state).toBe('BATTLE')
    expect(restored.autoBattle).toBe(false)
    finishChallenge(restored)
    expect(restored.campaign.badges).toEqual(['brock'])
  })

  it('resumes an already accepted legacy gym challenge when the badge order changes', () => {
    const game = makeGame('bulbasaur')
    game.campaign.badges = ['brock']
    train(game, 'venusaur', 30)
    dispatch(game, { type: 'travel', locationId: 'cerulean-city' })
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    const old = structuredClone(game)
    old.campaign.badges = []
    const restored = hydrateSave({ ...old, schemaVersion: 5 }, 1)!
    expect(nextGymTrainer(restored)?.id).toBe('brock')
    expect(currentTrainer(restored)?.id).toBe('misty')
    expect(restored.player.currentHP).toBe(statsFor('venusaur', 25).hp)
    expect(hydrateSave(JSON.parse(JSON.stringify(restored)), 1)?.campaign).toEqual(restored.campaign)
    finishChallenge(restored)
    expect(restored.campaign.badges).toEqual(['misty'])
    expect(nextGymTrainer(restored)?.id).toBe('brock')
  })

  it('resets a defeated or abandoned league run without losing badges or lending rewards', () => {
    const game = makeGame()
    const badges = kantoGymTrainers.map(trainer => trainer.id)
    game.campaign.badges = [...badges]
    dispatch(game, { type: 'travel', locationId: 'indigo-plateau' })
    game.campaign.leagueIndex = 2
    game.player.currentHP = 1
    expect(dispatch(game, { type: 'challenge-league' })).toBe(true)
    expect(currentTrainer(game)?.id).toBe('agatha')
    idleUntilHit(game)
    expect(game.losses).toBe(1)
    expect(game.campaign).toEqual({ badges, champion: false, leagueIndex: null, battle: null })
    expect(game.coins).toBe(0)
    expect(game.player.currentHP).toBeGreaterThan(0)
    expect(dispatch(game, { type: 'challenge-league' })).toBe(true)
    expect(currentTrainer(game)?.id).toBe('lorelei')
    dispatch(game, { type: 'travel', locationId: 'pallet-town' })
    expect(game.losses).toBe(2)
    expect(game.campaign).toEqual({ badges, champion: false, leagueIndex: null, battle: null })
    expect(game.wild).toHaveLength(0)
  })

  it('preserves a version 4 Kanto location and rejects stale challenge data', () => {
    const game = makeGame()
    dispatch(game, { type: 'travel', locationId: 'saffron-city' })
    game.coins = 93
    game.inventory.greatBall = 6
    const { campaign: _campaign, ...old } = structuredClone(game)
    const restored = hydrateSave({ ...old, schemaVersion: 4 }, 1)!
    expect(restored).toMatchObject({
      schemaVersion: 16, locationId: 'saffron-city', coins: 93, inventory: { greatBall: 6 },
      campaign: { badges: [], champion: false, leagueIndex: null, battle: null }
    })
    const stale = hydrateSave({
      ...restored, campaign: { badges: ['brock', 'brock', 'unknown'], champion: true, leagueIndex: 3,
        battle: { trainerId: 'lance', opponentIndex: 0 } }
    }, 1)!
    expect(stale.campaign).toEqual({ badges: ['brock'], champion: false, leagueIndex: null, battle: null })
  })
})
