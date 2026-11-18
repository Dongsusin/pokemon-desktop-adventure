import { describe, expect, it } from 'vitest'
import { starterIds, wildIds } from '../src/game/catalog'
import { collectionItems, fieldItems, itemEvolution } from '../src/game/collectionItems'
import { collectionGuide } from '../src/game/collectionGuide'
import { createGame, dispatch, eligibleLegends, evolutionFor, hydrateSave, tick, type GameSave } from '../src/game/engine'
import { isSpeciesMotionSupported } from '../src/game/motionEligibility'
import { postgameRare, postgameVisitors } from '../src/game/regions/collectionEncounters'
import { supportedWildForms } from '../src/game/regions/motionEncounters'
import { regionOrder, worldLocationById, worldRegions } from '../src/game/regions/world'

const bounds = { width: 1280, height: 720 }
const fresh = () => createGame('squirtle', 1, bounds, Date.UTC(2026, 10, 18), 17)
const reload = (game: GameSave) => hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
const firstRareRoll = Math.ceil((4294967296 - 1013904223) / 1664525)

describe('National Pokédex collection paths', () => {
  it('allows every supported species from every starting partner after all local campaigns', () => {
    type Actor = { speciesId: string; formId?: string }
    const actorKey = (actor: Actor) => actor.formId ?? actor.speciesId
    const ordinary = new Map<string, Actor>()
    const expected = wildIds.filter(id => isSpeciesMotionSupported(id)).sort()
    expect(expected.length).toBe(961)
    for (const locationId of [...Object.keys(postgameRare), ...Object.keys(postgameVisitors)]) {
      expect(worldLocationById[locationId], locationId).toBeDefined()
    }
    for (const id of regionOrder) {
      for (const place of worldRegions[id].locations) {
        for (const mon of [...place.encounters, ...(place.visitors ?? [])]) {
          for (const form of supportedWildForms(id, place.id, mon.speciesId, mon.level)) {
            const actor = { speciesId: mon.speciesId, formId: form.formId === 'wishiwashi-school' ? undefined : form.formId }
            ordinary.set(actorKey(actor), actor)
          }
        }
      }
    }
    for (const [id, item] of Object.entries(collectionItems)) {
      expect(worldLocationById[item.site].encounters.length, id).toBeGreaterThan(0)
      expect(fieldItems[item.site]).toContain(id)
      if (item.fossil) {
        expect(worldLocationById[item.fossil.lab]).toBeDefined()
        expect(isSpeciesMotionSupported(item.fossil.speciesId)).toBe(true)
        ordinary.set(item.fossil.speciesId, { speciesId: item.fossil.speciesId })
      }
    }
    for (const starter of starterIds) {
      const actors = new Map(ordinary)
      actors.set(starter, { speciesId: starter })
      for (const id of regionOrder) {
        for (const place of worldRegions[id].locations) {
          for (const mon of eligibleLegends(place, starter, true, worldRegions[id].gymTrainers.length)) {
            for (const form of supportedWildForms(id, place.id, mon.speciesId, mon.level)) {
              const actor = { speciesId: mon.speciesId, formId: form.formId }
              actors.set(actorKey(actor), actor)
            }
          }
        }
      }
      // Map iteration includes newly obtained evolutions and therefore follows complete chains.
      for (const { speciesId, formId } of actors.values()) {
        for (const next of [evolutionFor(speciesId, formId),
          ...Object.keys(collectionItems).map(id => itemEvolution(id, speciesId, formId))]) {
          if (next && !actors.has(actorKey(next))) actors.set(actorKey(next), next)
        }
      }
      expect([...new Set([...actors.values()].map(mon => mon.speciesId))].sort(), starter).toEqual(expected)
    }
  })

  it('applies a compatible evolution item exactly once, including regional forms and saves during the animation', () => {
    const game = fresh()
    game.inventory.linkingCord = 2
    expect(dispatch(game, { type: 'use-item', itemId: 'linkingCord' })).toBe(false)
    game.player.speciesId = 'kadabra'
    const identity = game.player.instanceId
    expect(dispatch(game, { type: 'use-item', itemId: 'linkingCord' })).toBe(true)
    const revived = reload(game)
    expect(revived.player).toMatchObject({ instanceId: identity, speciesId: 'alakazam', state: 'EVOLUTION' })
    expect(revived.runtime.evolutionFrom).toBe('kadabra')
    expect(revived.pokedexCaught).toContain('alakazam')
    expect(revived.inventory.linkingCord).toBe(1)
    expect(dispatch(revived, { type: 'use-item', itemId: 'linkingCord' })).toBe(false)
    expect(itemEvolution('linkingCord', 'graveler', 'graveler-alola')).toEqual({ speciesId: 'golem', formId: 'golem-alola' })
    expect(itemEvolution('fireStone', 'vulpix', 'vulpix-alola')).toBeUndefined()
    expect(collectionGuide('alakazam', 'squirtle').join(' ')).toContain('연결의끈')
  })

  it('finds and collects new field supplies through ordinary hunts at their excavation site', () => {
    const game = fresh()
    dispatch(game, { type: 'travel', locationId: 'mt-moon' })
    const wanted = new Set(fieldItems['mt-moon'])
    const found = new Set<string>()
    for (let seed = 1; seed <= 1500 && found.size < wanted.size; seed++) {
      game.player.state = 'BATTLE'
      game.runtime.drop = null
      game.wild = [{ id: 42, speciesId: 'zubat', currentHP: 1, maxHP: 12, level: 8,
        position: { ...game.player.position }, direction: 1 }]
      Object.assign(game.runtime, { rngState: Math.imul(seed, 0x9e3779b9) >>> 0, targetId: 42, turn: 'player', spawnIn: 120000, stateIn: 0 })
      tick(game, 20, bounds)
      const drop = (game as GameSave).runtime.drop
      if (!drop || !wanted.has(drop.itemId)) continue
      game.runtime.stateIn = 0
      tick(game, 20, bounds)
      expect(game.inventory[drop.itemId]).toBeGreaterThan(0)
      found.add(drop.itemId)
    }
    expect(found).toEqual(wanted)
  })

  it('revives fossils only in the specified laboratory, puts overflow in the PC, and persists every individual', () => {
    const game = fresh()
    game.inventory.oldAmber = 6
    expect(dispatch(game, { type: 'use-item', itemId: 'oldAmber' })).toBe(false)
    expect(game.inventory.oldAmber).toBe(6)
    expect(dispatch(game, { type: 'travel', locationId: 'cinnabar-island' })).toBe(true)
    for (let i = 0; i < 6; i++) expect(dispatch(game, { type: 'use-item', itemId: 'oldAmber' })).toBe(true)
    const again = reload(game)
    expect(again.inventory.oldAmber).toBeUndefined()
    expect(again.followers).toHaveLength(5)
    expect(again.boxes[0][0]).toMatchObject({ speciesId: 'aerodactyl', level: 20, active: false })
    expect(new Set([...again.followers, again.boxes[0][0]!].map(mon => mon.instanceId)).size).toBe(6)
    expect(again.pokedexCaught.filter(id => id === 'aerodactyl')).toHaveLength(1)
    expect(collectionGuide('aerodactyl', 'squirtle').join(' ')).toContain('홍련섬')
  })

  it('unlocks a real visitor after its own local league and resumes only legal encounters', () => {
    const game = fresh()
    dispatch(game, { type: 'travel', locationId: 'silph-co' })
    function draw() {
      game.wild = []
      game.runtime.spawnIn = 0
      game.runtime.rngState = firstRareRoll
      tick(game, 1, bounds)
      return game.wild[0]
    }
    expect(draw()).toBeUndefined()
    game.campaign.badges = worldRegions.kanto.gymTrainers.map(gym => gym.id)
    game.campaign.champion = true
    expect(draw()).toMatchObject({ speciesId: 'porygon', level: 30 })
    expect(reload(game).wild[0]?.speciesId).toBe('porygon')
    game.campaign.champion = false
    expect(reload(game).wild).toHaveLength(0)
    expect(postgameRare['dragons-den']).toContainEqual({ speciesId: 'dragonite', level: 55, weight: 1, championOnly: true })
    expect(eligibleLegends(worldLocationById['dragons-den'], 'squirtle', false)).toHaveLength(0)
    expect(collectionGuide('dragonite', 'squirtle').join(' ')).toContain('용의굴')
  })
})
