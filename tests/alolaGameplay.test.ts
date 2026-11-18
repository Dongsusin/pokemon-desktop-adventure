import { castSkill } from './trainerArenaDriver'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { battleForm, pokemonForms } from '../src/game/forms'
import { createGame, dispatch, hydrateSave, tick } from '../src/game/engine'
import { regionOrder, worldRegions } from '../src/game/regions/world'

const bounds = { width: 1200, height: 780 }

function arriveInAlola() {
  const previous = createGame('litten', 1, bounds, Date.UTC(2026, 0, 1), 17)
  previous.regionId = 'kalos'
  previous.locationId = worldRegions.kalos.leagueLocationId
  for (const id of regionOrder.slice(0, regionOrder.indexOf('alola'))) {
    const record = { champion: true, badges: worldRegions[id].gymTrainers.map(trainer => trainer.id) }
    if (id === 'kalos') Object.assign(previous.campaign, record)
    else previous.regionProgress[id] = record
  }
  const game = hydrateSave({ ...previous, schemaVersion: 10 }, 1)!
  expect(dispatch(game, { type: 'transfer-region', regionId: 'alola' })).toBe(true)
  return game
}

describe('Alola forms and Totem battles', () => {
  it('ships a transparent PNG for each supported form without creating extra Pokédex entries', () => {
    for (const [id, form] of Object.entries(pokemonForms)) {
      expect(species[form.base]).toBeDefined()
      expect(species[id]).toBeUndefined()
      const png = readFileSync(resolve('assets/sprites/forms', id + '.png'))
      expect(png.toString('hex', 0, 8)).toBe('89504e470d0a1a0a')
      expect(png.readUInt32BE(16)).toBeGreaterThan(0)
      expect(png.readUInt32BE(20)).toBeGreaterThan(0)
      expect([4, 6].includes(png[25]) || png.includes(Buffer.from('tRNS'))).toBe(true)
    }
  })

  it('spawns, saves and catches Alolan Rattata, retaining its form on a return trip', () => {
    const game = arriveInAlola()
    const location = worldRegions.alola.locations.find(place => place.encounters.some(slot => slot.speciesId === 'rattata'))!
    dispatch(game, { type: 'travel', locationId: location.id })
    for (let draw = 0; draw < 1000 && game.wild[0]?.speciesId !== 'rattata'; draw++) {
      game.wild = []
      game.player.state = 'IDLE'
      Object.assign(game.runtime, { spawnIn: 0, stateIn: 1000, targetId: null })
      tick(game, 200, bounds)
    }
    const target = game.wild[0]
    expect(target).toMatchObject({ speciesId: 'rattata', formId: 'rattata-alola' })
    expect(hydrateSave(game, 1)?.wild).toEqual(game.wild)
    game.player.state = 'BATTLE'
    target.currentHP = 1
    game.runtime.targetId = target.id
    game.runtime.rngState = Math.ceil((4294967296 - 1013904223) / 1664525)
    expect(dispatch(game, { type: 'throw-ball', itemId: 'pokeball' })).toBe(true)
    expect(game.followers[0]).toMatchObject({ speciesId: 'rattata', formId: 'rattata-alola' })
    expect(game.pokedexCaught).toContain('rattata')
    expect(dispatch(game, { type: 'transfer-region', regionId: 'kalos' })).toBe(true)
    expect(hydrateSave(game, 1)?.followers[0].formId).toBe('rattata-alola')
    const corrupt = structuredClone(game)
    corrupt.followers[0].formId = 'raichu-alola'
    expect(hydrateSave(corrupt, 1)?.followers[0].formId).toBeUndefined()
  })

  it('draws both Sun canyon Lycanroc forms and restores the selected form without rerolling', () => {
    const game = arriveInAlola()
    dispatch(game, { type: 'travel', locationId: 'vast-poni-canyon' })
    const seen = new Set<string>()
    for (let i = 0; i < 2000 && seen.size < 2; i++) {
      game.player.state = 'IDLE'
      game.wild = []
      Object.assign(game.runtime, { spawnIn: 0, stateIn: 1000, targetId: null })
      tick(game, 200, bounds)
      const mon = game.wild[0]
      if (mon?.speciesId === 'lycanroc') {
        seen.add(mon.formId ?? 'midday')
        expect(hydrateSave(game, 1)?.wild).toEqual(game.wild)
      }
    }
    expect(seen).toEqual(new Set(['midday', 'lycanroc-midnight']))
  })

  it('applies the first Totem’s Defense aura to damage and resumes a weakened School Wishiwashi', () => {
    const game = arriveInAlola()
    const trials = worldRegions.alola.gymTrainers
    dispatch(game, { type: 'travel', locationId: trials[0].locationId })
    dispatch(game, { type: 'set-auto-battle', value: false })
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    expect(trials[0].totemAura).toMatchObject({ stat: 'defense', stages: 1 })
    game.player.moveIds = ['tackle']
    game.player.level = 25
    Object.assign(game.runtime, { stateIn: 0, turn: 'player' })
    const ordinary = structuredClone(game)
    ordinary.wild[0].trainerId = 'alola-hala' // Same species, but without the Totem’s aura.
    castSkill(game, 'tackle')
    castSkill(ordinary, 'tackle')
    expect(game.wild[0].currentHP).toBeGreaterThan(ordinary.wild[0].currentHP)

    const water = arriveInAlola()
    const index = trials.findIndex(trainer => trainer.team[0].speciesId === 'wishiwashi')
    water.campaign.badges = trials.slice(0, index).map(trainer => trainer.id)
    dispatch(water, { type: 'travel', locationId: trials[index].locationId })
    expect(dispatch(water, { type: 'challenge-gym' })).toBe(true)
    expect(battleForm(water.wild[0])).toBe('wishiwashi-school')
    water.wild[0].currentHP = Math.floor(water.wild[0].maxHP / 4)
    const resumed = hydrateSave(water, 1)!
    expect(resumed.campaign.battle).toMatchObject({ trainerId: trials[index].id, opponentIndex: 0, arena: { paused: true } })
    expect(resumed.wild).toEqual(water.wild)
    expect(battleForm(resumed.wild[0])).toBeUndefined()
  })
})
