import { describe, expect, it } from 'vitest'
import { starterIds, wildIds } from '../src/game/catalog'
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
        const next = evolutionFor(speciesId, formId)
        if (next && !actors.has(actorKey(next))) actors.set(actorKey(next), next)
      }
      const reachable = new Set([...actors.values()].map(mon => mon.speciesId))
      expect(expected.filter(id => !reachable.has(id)), starter).toEqual([])
    }
  })

  it('keeps former fossil Pokémon obtainable by exploring after the regional league', () => {
    expect(postgameVisitors['cinnabar-island'].map(mon => mon.speciesId)).toContain('aerodactyl')
    const game = fresh()
    game.campaign.badges = worldRegions.kanto.gymTrainers.map(gym => gym.id)
    game.campaign.champion = true
    expect(dispatch(game, { type: 'travel', locationId: 'cinnabar-island' })).toBe(true)
    game.runtime.spawnIn = 0
    game.runtime.rngState = firstRareRoll
    tick(game, 1, bounds)
    expect(['aerodactyl', 'omanyte', 'kabuto']).toContain(game.wild[0]?.speciesId)
    expect(reload(game).wild[0]?.speciesId).toBe(game.wild[0].speciesId)
    for (const [site, id] of [['blush-mountain', 'golem'], ['mount-lanakila', 'ninetales'], ['mount-lanakila', 'sandslash']]) {
      const visitor = worldLocationById[site].visitors!.find(mon => mon.speciesId === id)!
      expect(supportedWildForms('alola', site, id, visitor.level)[0].formId).toBe(id + '-alola')
    }
    expect(collectionGuide('aerodactyl', 'squirtle').join(' ')).toContain('홍련섬')
    expect(collectionGuide('alakazam', 'squirtle').join(' ')).not.toContain('연결의끈')
  })

  it('unlocks a real visitor after its own local league and resumes only legal encounters', () => {
    const game = fresh()
    game.campaign.badges = worldRegions.kanto.gymTrainers.slice(0, 4).map(gym => gym.id)
    expect(dispatch(game, { type: 'travel', locationId: 'silph-co' })).toBe(true)
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
