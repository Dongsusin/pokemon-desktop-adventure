import { describe, expect, it } from 'vitest'
import { createGame, dispatch, hydrateSave, statsFor, type PartyPokemon } from '../src/game/engine'
import { worldRegions } from '../src/game/regions/world'

const bounds = { width: 1280, height: 720 }
const fresh = () => createGame('charmander', 1, bounds, Date.UTC(2026, 10, 17), 132)
const copy = (value: unknown) => JSON.parse(JSON.stringify(value))
function member(speciesId: string, instanceId: string, level = 8): PartyPokemon {
  return { speciesId, instanceId, level, exp: 13, currentHP: 11, destination: null, direction: 1, state: 'IDLE',
    position: { x: 180, y: 200 }, roamSeed: 23, restMs: 0, active: true }
}

describe('v15 motion roster migration', () => {
  it('archives the old lead and unsupported followers with identity, moves, equipment and historical records intact', () => {
    const old = fresh()
    old.player = { ...old.player, instanceId: 'caught-40', speciesId: 'miraidon', level: 14,
      exp: 27, currentHP: 17, heldItemId: 'muscleBand', moveIds: ['tackle', 'thunderShock'] }
    old.inventory.muscleBand = 1
    old.coins = 154
    old.campaign.badges = ['brock']
    old.followers = [member('beedrill', 'caught-41'), member('squirtle', 'caught-42'), member('pikachu', 'caught-43')]
    old.followers[0].currentHP = 0
    old.boxes[0][5] = { ...member('dragonair', 'caught-44'), active: false }
    const game = hydrateSave({ ...copy(old), schemaVersion: 15 }, 1)!
    expect(game.player).toMatchObject({ speciesId: 'squirtle', instanceId: 'caught-42', currentHP: 11, exp: 13 })
    expect(game.followers.map(m => m.instanceId)).toEqual(['caught-43'])
    expect(game.boxes[0][0]).toMatchObject({ speciesId: 'miraidon', instanceId: 'caught-40', currentHP: 17, level: 14,
      exp: 27, moveIds: ['tackle', 'thunderShock'], heldItemId: 'muscleBand', active: false })
    expect(game.boxes[0][1]).toMatchObject({ instanceId: 'caught-41', currentHP: 0, active: false })
    expect(game.boxes[0][5]?.instanceId).toBe('caught-44')
    expect(game).toMatchObject({ starterSpeciesId: 'charmander', campaign: { badges: ['brock'] }, coins: 154, inventory: old.inventory })
    expect(game.pokedexCaught).toEqual(expect.arrayContaining(['miraidon', 'beedrill', 'dragonair']))
    expect(dispatch(game, { type: 'set-follower-active', instanceId: 'caught-40', active: true })).toBe(false)
    expect(dispatch(game, { type: 'swap-box-pokemon', boxInstanceId: 'caught-41', partyInstanceId: 'caught-42' })).toBe(false)
    const again = hydrateSave(copy(game), 1)!
    expect(again.history).toEqual(game.history)
    expect(again.boxes).toEqual(game.boxes)
    expect(again.player).toEqual(game.player)
  })

  it('retains the exact archived regional form even when its standard species can enter the party', () => {
    const old = fresh()
    old.followers = [{ ...member('stunfisk', 'caught-310'), formId: 'stunfisk-galar', moveIds: ['tackle', 'mudShot'] }]
    const game = hydrateSave({ ...copy(old), schemaVersion: 15 }, 1)!
    expect(game.player.instanceId).toBe(old.player.instanceId)
    expect(game.followers).toHaveLength(0)
    expect(game.boxes[0][0]).toMatchObject({ instanceId: 'caught-310', speciesId: 'stunfisk', formId: 'stunfisk-galar',
      moveIds: ['tackle', 'mudShot'], level: 8, exp: 13, currentHP: 11 })
    expect(dispatch(game, { type: 'set-follower-active', instanceId: 'caught-310', active: true })).toBe(false)
  })

  it('uses the first eligible boxed individual; grants a level-five starter only if all owned individuals must be archived', () => {
    const old = fresh()
    old.player.speciesId = 'miraidon'
    old.player.instanceId = 'caught-100'
    old.boxes[0][4] = member('pikachu', 'caught-101')
    const game = hydrateSave({ ...copy(old), schemaVersion: 15 }, 1)!
    expect(game.player.instanceId).toBe('caught-101')
    expect(game.boxes[0][4]).toBeNull()
    old.boxes[0][4] = member('beedrill', 'caught-101')
    const rescued = hydrateSave({ ...copy(old), schemaVersion: 15 }, 1)!
    expect(rescued.player).toMatchObject({ speciesId: 'charmander', exp: 0, level: 5, currentHP: statsFor('charmander', 5).hp })
    expect(['caught-100', 'caught-101']).not.toContain(rescued.player.instanceId)
    expect(rescued.boxes.flat().filter(Boolean)).toHaveLength(2)
    expect(hydrateSave(copy(rescued), 1)!.player.instanceId).toBe(rescued.player.instanceId)
  })

  it('keeps league progress, remaps a later surviving enemy and does not resume a retired enemy', () => {
    const old = fresh()
    const region = worldRegions.kanto
    const trainer = region.trainerById.lance!
    const index = region.leagueTrainers.findIndex(t => t.id === trainer.id)
    const position = { x: 200, y: 200 }
    const base = { ...copy(old), schemaVersion: 15, locationId: region.leagueLocationId,
      runtime: { ...old.runtime, targetId: 77 }, player: { ...old.player, state: 'BATTLE' } }
    function resume(opponentIndex: number) {
      const mon = trainer.team[opponentIndex]
      return hydrateSave({ ...base, campaign: { badges: region.gymTrainers.map(t => t.id), champion: false, leagueIndex: index,
        battle: { trainerId: trainer.id, opponentIndex } }, wild: [{ id: 77, trainerId: trainer.id, speciesId: mon.speciesId,
        level: mon.level, currentHP: 7, position, direction: 1 }] }, 1)!
    }
    const continued = resume(3)
    expect(continued.campaign.battle).toMatchObject({ trainerId: 'lance', opponentIndex: 1 })
    expect(continued.wild[0]).toMatchObject({ speciesId: 'aerodactyl', currentHP: 7 })
    expect(hydrateSave(copy(continued), 1)!.campaign.battle?.opponentIndex).toBe(1)
    const retired = resume(2)
    expect(retired.campaign).toMatchObject({ leagueIndex: index, battle: null })
    expect(retired.wild).toEqual([])
    expect(retired.runtime.targetId).toBeNull()
  })
})
