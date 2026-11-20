import { describe, expect, it } from 'vitest'
import { createGame, dispatch, evolutionFor, movesFor, nextGymTrainer, regionalWeather, resolveTrainer } from '../src/game/engine'
import { locationForm } from '../src/game/forms'
import { isMoveMotionSupported, isSpeciesMotionSupported } from '../src/game/motionEligibility'
import { galarWildAreaIds } from '../src/game/regions/galar-encounters'
import { supportedWildForms } from '../src/game/regions/motionEncounters'
import { regionOrder, worldRegions } from '../src/game/regions/world'

const bounds = { width: 1280, height: 720 }

describe('playable motion roster', () => {
  it('rejects unavailable species and moves at evolution and move-selection entry points', () => {
    const game = createGame('charmander', 1, bounds)
    game.player.speciesId = 'pichu'
    game.player.moveIds = movesFor('pichu', 5).map(move => move.id)
    expect(game.player.moveIds).toEqual(['tackle'])
    expect(dispatch(game, { type: 'set-moves', moveIds: ['tackle', 'thunderShock'] })).toBe(false)
    expect(movesFor('pikachu', 5).map(move => move.id)).toContain('thunderShock')
    expect(evolutionFor('dratini')).toBeUndefined()
    expect(evolutionFor('charmander')?.speciesId).toBe('charmeleon')
    expect(movesFor('beedrill', 100)).toEqual([])
  })

  it('offers only playable encounter forms on every map and in changing Wild Area weather', () => {
    for (const region of Object.values(worldRegions)) {
      for (const location of region.locations) {
        const valid = [...location.encounters, ...(location.legends ?? [])].every(slot => {
          const forms = supportedWildForms(region.id, location.id, slot.speciesId, slot.level)
          return forms.length > 0 && forms.every(form => isSpeciesMotionSupported(slot.speciesId, form.formId))
        })
        expect(valid, location.id).toBe(true)
      }
    }
    expect(worldRegions.paldea.locationById['grasswither-shrine'].legends).toEqual([])
    const game = createGame('squirtle', 1, bounds)
    game.regionId = 'galar'
    for (const zone of galarWildAreaIds) {
      for (let month = 0; month < 12; month++) {
        const forecast = regionalWeather(game, zone, new Date(2026, month, 1))!
        expect(forecast.encounters.every(slot => supportedWildForms('galar', zone, slot.speciesId, slot.level).length > 0), zone).toBe(true)
      }
    }
  })

  it('keeps every gym, trial, league and finale playable for all starter variants', () => {
    for (const id of regionOrder) {
      const region = worldRegions[id]
      for (const trainer of [...region.gymTrainers, ...region.leagueTrainers, ...(region.finaleTrainer ? [region.finaleTrainer] : [])]) {
        for (const starter of ['squirtle', 'bulbasaur', 'charmander']) {
          const resolved = resolveTrainer(region, trainer, starter)
          expect(resolved.team.length, trainer.id).toBeGreaterThan(0)
          for (const member of resolved.team) {
            const form = member.formId ?? locationForm(id, trainer.locationId, member.speciesId)
            expect(isMoveMotionSupported(member.speciesId, form, 'tackle'), trainer.id).toBe(true)
            if (member.dynamax === 'gigantamax') {
              expect(isSpeciesMotionSupported(member.speciesId, member.speciesId + '-gmax')).toBe(true)
            }
          }
        }
      }
    }
    const game = createGame('squirtle', 1, bounds)
    game.regionId = 'alola'
    const trial = nextGymTrainer(game)!
    game.locationId = trial.locationId
    expect(trial.team).toEqual([{ speciesId: 'raticate', level: 19 }])
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    expect(game.wild[0]).toMatchObject({ speciesId: 'raticate', formId: 'raticate-alola', level: 19 })
  })
})
