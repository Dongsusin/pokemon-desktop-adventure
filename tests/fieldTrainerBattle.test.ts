import { describe, expect, it } from 'vitest'
import {
  canChallengeFieldTrainer, createGame, currentTrainer, dispatch, fieldTrainerRewards, hydrateSave, playerStats, tick,
} from '../src/game/engine'
import { fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'
import { parseCommand } from '../src/main/commands'
import { finishChallenge, playFrame } from './trainerArenaDriver'

const bounds = { width: 1280, height: 720 }
const first = fieldTrainersByRegion.kanto[0]
const challenge = (id: string) => ({ type: 'challenge-field-trainer' as const, trainerId: id })

function opening(id: RegionId = 'kanto') {
  const game = createGame('squirtle', 1, bounds, Date.UTC(2026, 10, 19), 19)
  game.regionId = id
  game.locationId = worldRegions[id].startLocationId
  game.campaign.badges = worldRegions[id].gymTrainers.map(trainer => trainer.id)
  game.player.level = 55
  game.player.moveIds = ['tackle', 'waterGun', 'waterPulse']
  game.player.currentHP = playerStats(game).hp
  return game
}

describe('regional field trainer battles', () => {
  it('admits each opponent at their own location and badge milestone; validates the IPC id', () => {
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
        if (opponent.requiredBadges > 0) {
          game.campaign.badges = region.gymTrainers.slice(0, opponent.requiredBadges - 1).map(trainer => trainer.id)
          expect(dispatch(game, challenge(opponent.id))).toBe(false)
        }
        game.campaign.badges = region.gymTrainers.slice(0, opponent.requiredBadges).map(trainer => trainer.id)
        game.campaign.leagueIndex = 1
        expect(dispatch(game, challenge(opponent.id))).toBe(false)
        expect(game.campaign.leagueIndex).toBe(1)
        game.campaign.leagueIndex = null
        expect(canChallengeFieldTrainer(game, opponent.id)).toBe(true)
        const command = { type: 'challengeFieldTrainer', trainerId: opponent.id }
        expect(parseCommand(command)).toEqual(command)
        expect(dispatch(game, challenge(opponent.id))).toBe(true)
        expect(currentTrainer(game)).toMatchObject({ id: opponent.id, role: 'field' })
        expect(game.campaign.leagueIndex).toBeNull()
        expect(dispatch(game, challenge(opponent.id))).toBe(false)
      }
    }
    for (const id of [null, '', 'brock', 'constructor', '__proto__']) {
      expect(parseCommand({ type: 'challengeFieldTrainer', trainerId: id })).toBeNull()
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
    expect(dispatch(restored, challenge(first.id))).toBe(false)
    const reopened = hydrateSave(restored, 1)!
    expect(reopened.campaign.fieldWins).toEqual([first.id])
    expect(dispatch(reopened, challenge(first.id))).toBe(false)

    reopened.campaign.champion = true
    expect(dispatch(reopened, { type: 'transfer-region', regionId: 'johto' })).toBe(true)
    expect(reopened.campaign.fieldWins).toBeUndefined()
    const away = hydrateSave(reopened, 1)!
    expect(away.regionProgress.kanto?.fieldWins).toEqual([first.id])
    expect(dispatch(away, { type: 'transfer-region', regionId: 'kanto' })).toBe(true)
    expect(dispatch(away, { type: 'travel', locationId: first.locationId })).toBe(true)
    expect(away.campaign.fieldWins).toEqual([first.id])
    expect(dispatch(away, challenge(first.id))).toBe(false)
  })

  it('waits for the whole opposing team and resumes the next member without duplicating rewards', () => {
    const opponent = fieldTrainersByRegion.kanto.find(trainer => trainer.team.length > 1)!
    const game = opening()
    game.locationId = opponent.locationId
    expect(dispatch(game, challenge(opponent.id))).toBe(true)
    for (let frame = 0; frame < 2000 && game.campaign.battle?.opponentIndex === 0; frame++) playFrame(game)
    expect(game.campaign.battle?.opponentIndex).toBe(1)
    expect(game.campaign.fieldWins).toBeUndefined()
    expect(game.wins).toBe(0)
    const resumed = hydrateSave(game, 1)!
    expect(resumed.campaign.battle).toMatchObject({ opponentIndex: 1, trainerId: opponent.id })
    expect(resumed.wild[0].speciesId).toBe(currentTrainer(game)!.team[1].speciesId)
    expect(resumed.player.exp).toBe(0)
    const startingCoins = resumed.coins
    const reward = fieldTrainerRewards(currentTrainer(resumed)!)
    expect(dispatch(resumed, challenge(opponent.id))).toBe(false)
    finishChallenge(resumed)
    expect(resumed.campaign.fieldWins).toEqual([opponent.id])
    expect(resumed.coins - startingCoins).toBe(reward.coins)
    expect(dispatch(resumed, challenge(opponent.id))).toBe(false)
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
    expect(dispatch(cleared, challenge(first.id))).toBe(false)
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
      for (let i = 0; i < 1600 && game.campaign.battle; i++) tick(game, 100, bounds)
    }
    expect(game.campaign).toMatchObject({ badges, champion: false, leagueIndex: null, battle: null })
    expect(game.campaign.fieldWins).toBeUndefined()
    expect(game.wins).toBe(0)
    expect(game.coins).toBe(coins)
    expect(game.losses).toBe(1)
    expect(dispatch(game, challenge(first.id))).toBe(true)
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
