import { advanceScripted } from './arenaSimulation'
import { describe, expect, it } from 'vitest'
import {
  tick, canChallengeFieldTrainer, createGame, currentTrainer, dispatch, fieldTrainerRewards, hydrateSave, playerStats,
} from '../src/game/engine'
import { fieldTeamVariant, fieldTrainerById, fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'
import { parseCommand } from '../src/main/commands'
import { finishChallenge, playFrame } from './trainerArenaDriver'

const bounds = { width: 1280, height: 720 }
const first = fieldTrainerById['field-kanto-rocket-duo']!
const challenge = (id: string) => ({ type: 'challenge-field-trainer' as const, trainerId: id })

function opening(id: RegionId = 'kanto') {
  const game = createGame('squirtle', 1, bounds, Date.UTC(2026, 10, 19), 19)
  game.regionId = id
  for (const prior of regionOrder.slice(0, regionOrder.indexOf(id))) {
    game.regionProgress[prior] = { champion: true, badges: worldRegions[prior].gymTrainers.map(trainer => trainer.id) }
  }
  game.locationId = worldRegions[id].startLocationId
  game.campaign.badges = worldRegions[id].gymTrainers.map(trainer => trainer.id)
  game.player.level = 55
  game.player.moveIds = ['tackle', 'waterGun', 'waterPulse']
  game.player.currentHP = playerStats(game).hp
  return game
}

describe('regional field trainer battles', () => {
  it('admits each opponent at their own location with zero badges; validates the IPC id', () => {
    for (const regionId of regionOrder) {
      const region = worldRegions[regionId]
      for (const opponent of fieldTrainersByRegion[regionId]) {
        const game = opening(regionId)
        game.locationId = region.locations.find(place => place.id !== opponent.locationId)!.id
        expect(canChallengeFieldTrainer(game, opponent.id)).toBe(false)
        expect(dispatch(game, challenge(opponent.id))).toBe(false)
        game.locationId = opponent.locationId
        const otherRegion = regionId === 'kanto' ? 'johto' : 'kanto'
        expect(dispatch(game, challenge(fieldTrainersByRegion[otherRegion][0].id))).toBe(false)
        game.campaign.badges = []
        game.campaign.leagueIndex = 1
        expect(dispatch(game, challenge(opponent.id))).toBe(false)
        expect(game.campaign.leagueIndex).toBe(1)
        game.campaign.leagueIndex = null
        expect(canChallengeFieldTrainer(game, opponent.id)).toBe(true)
        const command = { type: 'challengeFieldTrainer', trainerId: opponent.id }
        expect(parseCommand(command)).toEqual(command)
        expect(dispatch(game, challenge(opponent.id))).toBe(true)
        expect(currentTrainer(game)).toMatchObject({ id: opponent.id, role: 'field', team: opponent.team })
        expect(game.campaign.battle?.teamNumber).toBe(opponent.defaultTeamNumber)
        expect(game.campaign.leagueIndex).toBeNull()
        expect(dispatch(game, challenge(opponent.id))).toBe(false)
      }
    }
    for (const id of [null, '', 'brock', 'constructor', '__proto__']) {
      expect(parseCommand({ type: 'challengeFieldTrainer', trainerId: id })).toBeNull()
    }
  })

  it('starts and reloads every canonical and archived Arena team with the same slots and forms', () => {
    for (const regionId of regionOrder) {
      const game = opening(regionId)
      for (const trainer of fieldTrainersByRegion[regionId]) {
        game.locationId = trainer.locationId
        for (const [index, team] of trainer.teams.entries()) {
          const teamNumber = index + 1
          expect(dispatch(game, { ...challenge(trainer.id), teamNumber }), trainer.id).toBe(true)
          const restored = hydrateSave(game, 1)!
          expect(restored.campaign.battle?.teamNumber).toBe(teamNumber)
          expect(currentTrainer(restored)?.team, trainer.id + '/' + teamNumber).toEqual(team)
          expect(restored.wild[0].speciesId).toBe(team[0].speciesId)
          expect(restored.wild[0].formId).toBe(team[0].formId)
          expect(dispatch(game, { type: 'arena-surrender' })).toBe(true)
        }
      }
    }
  })

  it('resumes a field battle in the same arena and pays its reward once without advancing the league', () => {
    const game = opening()
    expect(dispatch(game, { type: 'travel', locationId: first.locationId })).toBe(true)
    expect(dispatch(game, challenge(first.id))).toBe(true)
    game.wild[0].currentHP--
    const restored = hydrateSave(JSON.parse(JSON.stringify(game)), 1)!
    expect(currentTrainer(restored)?.id).toBe(first.id)
    expect(restored.campaign.battle?.arena.paused).toBe(true)
    expect(restored.wild[0].currentHP).toBe(game.wild[0].currentHP)
    const rewards = fieldTrainerRewards(currentTrainer(restored)!)
    const badges = [...restored.campaign.badges]
    finishChallenge(restored)
    expect(restored.campaign).toMatchObject({ badges, fieldWins: [first.id], champion: false, leagueIndex: null, battle: null })
    expect(restored.campaign.eliteWins).toBeUndefined()
    expect(restored.campaign.finaleWon).toBeUndefined()
    expect(restored.wins).toBe(game.wins + 1)
    expect(restored.coins).toBe(game.coins + rewards.coins)
    expect(restored.player.exp).toBe(game.player.exp + rewards.experience)
    const cleared = { wins: restored.wins, coins: restored.coins, exp: restored.player.exp }
    const teamNumber = first.teams.length
    const variant = fieldTeamVariant(first, teamNumber)!
    expect(dispatch(restored, { ...challenge(first.id), teamNumber })).toBe(true)
    expect(restored.campaign.battle?.practice).toBeDefined()
    const reopened = hydrateSave(restored, 1)!
    expect(reopened.campaign.battle?.teamNumber).toBe(teamNumber)
    expect(currentTrainer(reopened)?.team).toEqual(variant.team)
    expect(reopened.wild[0].speciesId).toBe(variant.team[0].speciesId)
    finishChallenge(reopened)
    expect(reopened.history[0].practiceResult).toBe('win')
    expect({ wins: reopened.wins, coins: reopened.coins, exp: reopened.player.exp }).toEqual(cleared)
    expect(reopened.campaign.fieldWins).toEqual([first.id])

    reopened.campaign.champion = true
    expect(dispatch(reopened, { type: 'transfer-region', regionId: 'johto' })).toBe(true)
    expect(reopened.campaign.fieldWins).toBeUndefined()
    const away = hydrateSave(reopened, 1)!
    expect(away.regionProgress.kanto?.fieldWins).toEqual([first.id])
    expect(dispatch(away, { type: 'transfer-region', regionId: 'kanto' })).toBe(true)
    expect(dispatch(away, { type: 'travel', locationId: first.locationId })).toBe(true)
    expect(away.campaign.fieldWins).toEqual([first.id])
    expect(dispatch(away, challenge(first.id))).toBe(true)
    expect(away.campaign.battle?.practice).toBeDefined()
  })

  it('waits for the whole opposing team and resumes the next member without duplicating rewards', () => {
    const opponent = first
    const game = opening()
    game.locationId = opponent.locationId
    expect(dispatch(game, challenge(opponent.id))).toBe(true)
    for (let frame = 0; frame < 2000 && game.campaign.battle?.opponentIndex === 0; frame++) playFrame(game)
    const incoming = game.campaign.battle!.opponentIndex
    expect(incoming).toBeGreaterThan(0)
    expect(game.campaign.fieldWins).toBeUndefined()
    expect(game.wins).toBe(0)
    const resumed = hydrateSave(game, 1)!
    expect(resumed.campaign.battle).toMatchObject({ opponentIndex: incoming, trainerId: opponent.id })
    expect(resumed.wild[0].speciesId).toBe(currentTrainer(game)!.team[incoming].speciesId)
    expect(resumed.player.exp).toBe(0)
    const startingCoins = resumed.coins
    const reward = fieldTrainerRewards(currentTrainer(resumed)!)
    expect(dispatch(resumed, challenge(opponent.id))).toBe(false)
    finishChallenge(resumed)
    expect(resumed.campaign.fieldWins).toEqual([opponent.id])
    expect(resumed.coins - startingCoins).toBe(reward.coins)
    expect(dispatch(resumed, challenge(opponent.id))).toBe(true)
    expect(resumed.campaign.battle?.practice).toBeDefined()
    expect(resumed.coins - startingCoins).toBe(reward.coins)
  })

  it('declines a stale field battle in a different place or after the same opponent was beaten', () => {
    const game = opening()
    game.locationId = first.locationId
    dispatch(game, challenge(first.id))
    const elsewhere = worldRegions.kanto.locations.find(place => place.id !== first.locationId)!.id
    const moved = hydrateSave({ ...game, locationId: elsewhere }, 1)!
    expect(moved.campaign.battle).toBeNull()
    expect(moved.coins).toBe(game.coins)
    const cleared = hydrateSave({ ...game, campaign: { ...game.campaign, fieldWins: [first.id] } }, 1)!
    expect(cleared.campaign.battle).toBeNull()
    expect(dispatch(cleared, challenge(first.id))).toBe(true)
    expect(cleared.campaign.battle?.practice).toBeDefined()
    expect(cleared.coins).toBe(game.coins)
  })

  it.each(['surrender', 'travel', 'knockout'])('can retry after %s with no reward or clearance', how => {
    const game = opening()
    game.locationId = first.locationId
    const coins = game.coins, badges = [...game.campaign.badges]
    expect(dispatch(game, challenge(first.id))).toBe(true)
    if (how === 'surrender') expect(dispatch(game, { type: 'arena-surrender' })).toBe(true)
    else if (how === 'travel') {
      const other = worldRegions.kanto.locations.find(place => place.id !== first.locationId)!.id
      expect(dispatch(game, { type: 'travel', locationId: other })).toBe(true)
      expect(dispatch(game, { type: 'travel', locationId: first.locationId })).toBe(true)
    } else {
      game.player.currentHP = 1
      for (let i = 0; i < 1600 && game.campaign.battle; i++) advanceScripted(game, 100, bounds)
    }
    expect(game.campaign).toMatchObject({ badges, champion: false, leagueIndex: null, battle: null })
    expect(game.campaign.fieldWins).toBeUndefined()
    expect(game.wins).toBe(0)
    expect(game.coins).toBe(coins)
    expect(game.losses).toBe(1)
    if (how === 'knockout') {
      expect(dispatch(game, challenge(first.id))).toBe(false)
      dispatch(game, { type: 'set-auto-battle', value: false })
      tick(game, 300000, bounds)
    }
    expect(dispatch(game, challenge(first.id))).toBe(true)
  })

  it('validates team numbers, restores their lineup, and grants only one first win per identity', () => {
    const game = opening()
    game.locationId = first.locationId
    for (const invalid of [0, -1, 1.5, first.teams.length + 1, NaN]) {
      expect(dispatch(game, { ...challenge(first.id), teamNumber: invalid })).toBe(false)
      expect(game.campaign.battle).toBeNull()
    }
    expect(first.teams.length).toBeGreaterThan(1)
    for (const teamNumber of [2, 1]) {
      const trainer = fieldTeamVariant(first, teamNumber)!
      expect(dispatch(game, { ...challenge(first.id), teamNumber })).toBe(true)
      const saved = hydrateSave(game, 1)!
      expect(currentTrainer(saved)?.team).toEqual(trainer.team)
      expect(saved.wild[0].speciesId).toBe(trainer.team[0].speciesId)
      expect(dispatch(game, { type: 'arena-surrender' })).toBe(true)
    }
    expect(game.campaign.fieldWins).toBeUndefined()
  })

  it('keeps an ongoing v22 alternate team at its former levels, then uses the new default on the next challenge', () => {
    const ash = fieldTrainerById['field-kanto-ash']!
    const game = opening()
    game.locationId = ash.locationId
    expect(dispatch(game, { ...challenge(ash.id), teamNumber: 2 })).toBe(true)
    const saved = structuredClone(game)
    const old = fieldTeamVariant(ash, 2, 5)!
    saved.wild[0].level = old.team[0].level
    saved.wild[0].currentHP = 3
    const loaded = hydrateSave({ ...saved, schemaVersion: 22 }, 1)!
    expect(loaded.campaign.battle).toMatchObject({ teamNumber: 2, legacyFieldAceLevel: 5 })
    expect(currentTrainer(loaded)?.team).toEqual(old.team)
    expect(loaded.wild[0].currentHP).toBe(3)
    const again = hydrateSave(loaded, 1)!
    expect(currentTrainer(again)?.team).toEqual(old.team)
    expect(dispatch(again, { type: 'arena-surrender' })).toBe(true)
    expect(dispatch(again, challenge(ash.id))).toBe(true)
    expect(again.campaign.battle?.teamNumber).toBe(ash.defaultTeamNumber)
    expect(currentTrainer(again)?.team.every(m => m.level === 65)).toBe(true)
  })

  it('ends a retired legacy lineup in place, without awarding a loss, a win or coins', () => {
    const game = opening()
    game.locationId = first.locationId
    expect(dispatch(game, challenge(first.id))).toBe(true)
    const old = { ...game, schemaVersion: 19 }
    const restored = hydrateSave(old, 1)!
    expect(restored).toMatchObject({ locationId: game.locationId, wins: 0, losses: 0, coins: 0, wild: [], campaign: { battle: null } })
    expect(restored.campaign.fieldWins).toBeUndefined()
    expect(dispatch(restored, challenge(first.id))).toBe(true)
  })

  it('upgrades older slots and filters duplicates and unrelated clearances', () => {
    const game = opening()
    const old = hydrateSave({ ...game, schemaVersion: 18 }, 1)!
    expect(old.campaign.fieldWins).toBeUndefined()
    expect(old.player.instanceId).toBe(game.player.instanceId)
    expect(old.campaign.badges).toEqual(game.campaign.badges)
    game.campaign.fieldWins = [first.id, first.id, fieldTrainersByRegion.johto[0].id, 'brock']
    expect(hydrateSave(game, 1)?.campaign.fieldWins).toEqual([first.id])
  })
})
