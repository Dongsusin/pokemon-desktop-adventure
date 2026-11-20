import { advanceScripted } from './arenaSimulation'
import { castSkill, idleUntilHit, resumeWithLastOpponent } from './trainerArenaDriver'
import { describe, expect, it } from 'vitest'
import {
  tick, canChallengeFinale, createGame, currentTrainer, dispatch, effectiveLevel, hydrateSave, levelCap,
  movesFor, playerStats, type GameSave,
} from '../src/game/engine'
import { teraAttackMultiplier } from '../src/game/regions/paldeaTera'
import { worldRegions, regionOrder } from '../src/game/regions/world'

const bounds = { width: 1280, height: 800 }
const paldea = worldRegions.paldea
const badges = paldea.gymTrainers.map(t => t.id)
const league = paldea.leagueLocationId
const square = 'mesagoza'

function arriveFromGalar(starter = 'charmander') {
  const previous = createGame(starter, 1, bounds, Date.UTC(2026, 0, 1), 17)
  previous.regionId = 'galar'
  previous.locationId = worldRegions.galar.leagueLocationId
  previous.player.level = 100
  for (const id of regionOrder.slice(0, regionOrder.indexOf('paldea'))) {
    const record = { champion: true, badges: worldRegions[id].gymTrainers.map(t => t.id) }
    if (id === 'galar') Object.assign(previous.campaign, record)
    else previous.regionProgress[id] = record
  }
  const game = hydrateSave({ ...previous, schemaVersion: 12 }, 1)!
  expect(dispatch(game, { type: 'transfer-region', regionId: 'paldea' })).toBe(true)
  return game
}

function reload(game: GameSave): GameSave {
  const restored = hydrateSave(JSON.parse(JSON.stringify(game)), 1)
  expect(restored).not.toBeNull()
  return restored!
}

function travel(game: GameSave, locationId: string) {
  expect(dispatch(game, { type: 'travel', locationId })).toBe(true)
}

function defeatOpponent(game: GameSave) {
  expect(game.campaign.battle).not.toBeNull()
  game.wild[0].currentHP = 1
  castSkill(game)
}

function faceAce(game: GameSave) {
  const trainer = currentTrainer(game)!
  for (let i = 0; i < 30 && game.campaign.battle?.opponentIndex !== trainer.team.length - 1; i++) defeatOpponent(game)
  expect(game.campaign.battle?.opponentIndex).toBe(trainer.team.length - 1)
  return game.wild[0]
}

function finishTeam(game: GameSave) {
  for (let i = 0; i < 30 && game.campaign.battle; i++) defeatOpponent(game)
  expect(game.campaign.battle).toBeNull()
}

function activateTeraAce(game: GameSave, moves?: string[]) {
  game.player.level = 35
  game.player.moveIds = moves ?? movesFor(game.player.speciesId, 35).map(move => move.id)
  game.player.currentHP = playerStats(game).hp
  Object.assign(game, resumeWithLastOpponent(game))
  const arena = game.campaign.battle!.arena
  arena.player = { x: .30, y: .50 }
  arena.enemy = { x: .40, y: .50 }
  arena.enemyInMs = 0
  expect(game.wild[0].teraType).toBeUndefined()
  for (let i = 0; i < 100 && !game.wild[0]?.teraType; i++) advanceScripted(game, 50, bounds)
  return game.wild[0]
}

function startGym(game: GameSave, index: number) {
  game.campaign.badges = badges.slice(0, index)
  travel(game, paldea.gymTrainers[index].locationId)
  game.player.currentHP = playerStats(game).hp
  expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
}

describe('Paldea campaign and Terastallization', () => {
  it('imports a Galar champion, awards Champion Rank at the League, then saves the separate Mesagoza victory', () => {
    let game = arriveFromGalar()
    expect(game.locationId).toBe('cabo-poco')
    expect(game.regionProgress.galar?.champion).toBe(true)
    expect(levelCap(game)).toBe(25)
    expect(effectiveLevel(game)).toBe(25)
    travel(game, square)
    expect(dispatch(game, { type: 'challenge-finale' })).toBe(false)

    game.campaign.badges = [...badges]
    travel(game, league)
    game.campaign.leagueIndex = 4
    expect(dispatch(game, { type: 'challenge-league', trainerId: 'paldea-geeta' })).toBe(true)
    expect(faceAce(game)).toMatchObject({ speciesId: 'glimmora', level: 96 })
    finishTeam(game)
    expect(game.campaign.champion).toBe(true)
    expect(game.campaign.finaleWon).toBeUndefined()
    expect(dispatch(game, { type: 'challenge-league' })).toBe(false)
    expect(dispatch(game, { type: 'challenge-finale' })).toBe(false)
    expect(dispatch(game, { type: 'travel', locationId: 'area-zero' })).toBe(true)

    travel(game, square)
    expect(dispatch(game, { type: 'challenge-finale' })).toBe(true)
    expect(currentTrainer(game)?.id).toBe('paldea-nemona')
    expect(game.campaign.leagueIndex).toBeNull()
    expect(faceAce(game)).toMatchObject({ speciesId: 'meowscarada', level: 100 })
    game.wild[0].currentHP -= 1
    const before = structuredClone(game.wild)
    game = reload(game)
    expect(game.wild).toEqual(before)
    expect(currentTrainer(game)?.team.at(-1)?.speciesId).toBe('meowscarada')
    finishTeam(game)
    expect(game.campaign).toMatchObject({ champion: true, finaleWon: true, leagueIndex: null, battle: null })
    expect(dispatch(game, { type: 'challenge-finale' })).toBe(false)
    expect(dispatch(game, { type: 'travel', locationId: 'area-zero' })).toBe(true)
    travel(game, 'naranja-academy')
    expect(dispatch(game, { type: 'challenge-field-trainer', trainerId: 'field-paldea-penny' })).toBe(true)
    for (let i = 0; i < 20 && game.campaign.battle; i++) defeatOpponent(game)
    expect(game.campaign.fieldWins).toContain('field-paldea-penny')
    travel(game, 'area-zero')
    expect(dispatch(game, { type: 'transfer-region', regionId: 'galar' })).toBe(true)
    game = reload(game)
    expect(game.regionProgress.paldea).toEqual({ badges, champion: true, finaleWon: true, fieldWins: ['field-paldea-penny'] })
    expect(dispatch(game, { type: 'transfer-region', regionId: 'paldea' })).toBe(true)
    expect(reload(game).campaign.finaleWon).toBe(true)
    travel(game, 'area-zero')
  })

  it.each([
    ['squirtle', 'skeledirge'], ['bulbasaur', 'quaquaval'],
  ])('lets a %s partner abandon, lose, and retry the correct rival without replaying the assessment', (starter, expectedAce) => {
    let game = arriveFromGalar(starter)
    Object.assign(game.campaign, { badges: [...badges], champion: true, fieldWins: ['field-paldea-nemona'] })
    travel(game, square)
    expect(dispatch(game, { type: 'challenge-finale' })).toBe(true)
    expect(currentTrainer(game)?.team.at(-1)?.speciesId).toBe(expectedAce)
    travel(game, 'cabo-poco')
    expect(game.campaign.battle).toBeNull()
    expect(game.campaign.champion).toBe(true)
    travel(game, square)
    expect(dispatch(game, { type: 'challenge-finale' })).toBe(true)
    game.player.currentHP = 1
    idleUntilHit(game)
    game = reload(game)
    expect(game.campaign).toMatchObject({ badges, champion: true, battle: null, leagueIndex: null })
    expect(game.campaign.finaleWon).toBeUndefined()
    expect(canChallengeFinale(game)).toBe(false)
    dispatch(game, { type: 'set-auto-battle', value: false })
    tick(game, 300000, bounds)
    expect(canChallengeFinale(game)).toBe(true)
    expect(dispatch(game, { type: 'challenge-finale' })).toBe(true)
    expect(currentTrainer(game)?.team.at(-1)?.speciesId).toBe(expectedAce)
  })

  it('checks crater badge eligibility when traveling and discards invalid finale progress', () => {
    const game = arriveFromGalar()
    const restricted = paldea.locations.filter(location => location.afterFinale)
    expect(restricted.map(location => location.id)).toEqual(expect.arrayContaining(['area-zero', 'zero-lab']))
    for (const place of restricted) {
      expect(dispatch(game, { type: 'travel', locationId: place.id })).toBe(false)
      const forged = {
        ...game, locationId: place.id,
        campaign: { ...game.campaign, champion: false, finaleWon: true },
      }
      const restored = hydrateSave(forged, 1)!
      expect(restored.locationId).toBe(place.id)
      expect(restored.campaign.finaleWon).toBeUndefined()
      expect(restored.wild).toEqual([])
    }
    const forgedBattle = hydrateSave({
      ...game, locationId: square,
      campaign: { ...game.campaign, champion: true, finaleWon: true, battle: { trainerId: 'paldea-nemona', opponentIndex: 5 } },
    }, 1)!
    expect(forgedBattle.campaign).toMatchObject({ champion: false, battle: null, leagueIndex: null })
    expect(canChallengeFinale(forgedBattle)).toBe(false)
  })

  it('retains original attack bonuses, applies the new type, and respects Iono’s Levitate through save recovery', () => {
    expect(teraAttackMultiplier('water', ['water', 'ground'], 'water', 'fire')).toBe(4)
    expect(teraAttackMultiplier('ground', ['water', 'ground'], 'water', 'electric')).toBe(3)
    expect(teraAttackMultiplier('fire', ['water'], 'fire', 'grass')).toBe(3)
    expect(teraAttackMultiplier('ground', ['water'], 'water', 'electric')).toBe(2)

    const game = arriveFromGalar('squirtle')
    startGym(game, 2)
    const ace = activateTeraAce(game)
    expect(ace).toMatchObject({ speciesId: 'mismagius', teraType: 'electric', abilityId: 'levitate' })
    const tampered = structuredClone(game)
    tampered.wild[0].teraType = 'ice'
    delete tampered.wild[0].abilityId
    const restored = reload(tampered).wild[0]
    expect(restored.teraType).toBe('electric')
    expect(teraAttackMultiplier('ground', ['ground'], 'ground', restored.teraType!, restored.abilityId)).toBe(0)
  })

  it('applies a commanded neutral attack against Rika and lets Water Absorb heal her ace when Water Gun is selected', () => {
    const game = arriveFromGalar('squirtle')
    game.campaign.badges = [...badges]
    travel(game, league)
    expect(dispatch(game, { type: 'challenge-league', trainerId: 'paldea-rika' })).toBe(true)
    const ace = activateTeraAce(game)
    expect(ace).toMatchObject({ speciesId: 'clodsire', teraType: 'ground', abilityId: 'water-absorb' })

    game.player.moveIds = ['waterGun', 'tackle']
    castSkill(game, 'tackle')
    expect(game.effects.filter(effect => effect.kind === 'attack').at(-1)?.moveType).toBe('normal')
    expect(ace.currentHP).toBeLessThan(ace.maxHP)

    const before = Math.floor(ace.maxHP / 2)
    ace.currentHP = before
    game.player.moveIds = ['waterGun']
    castSkill(game, 'waterGun')
    expect(game.effects.filter(effect => effect.kind === 'attack').at(-1)?.moveType).toBe('water')
    expect(ace.currentHP).toBe(before + Math.max(1, Math.floor(ace.maxHP / 4)))
  })

  it('deals zero damage when a real Tackle hits Ryme’s Ghost Tera ace', () => {
    const game = arriveFromGalar('squirtle')
    startGym(game, 5)
    const ace = activateTeraAce(game, ['tackle'])
    expect(ace).toMatchObject({ speciesId: 'toxtricity', formId: 'toxtricity-low-key', teraType: 'ghost' })
    const hp = ace.currentHP
    game.player.moveIds = ['tackle']
    castSkill(game, 'tackle')
    expect(ace.currentHP).toBe(hp)
    expect(game.effects.some(effect => effect.kind === 'damage' && effect.text === '효과 없음')).toBe(true)
  })

  it('spawns Paldean Wooper from a real area table and retains the caught form after leaving Paldea', () => {
    const game = arriveFromGalar()
    const places = paldea.locations.filter(location => !location.afterFinale && location.encounters.some(s => s.speciesId === 'wooper'))
    const chance = (place: typeof places[number]) => place.encounters.reduce((sum, s) => sum + (s.speciesId === 'wooper' ? s.weight : 0), 0) /
      place.encounters.reduce((sum, s) => sum + s.weight, 0)
    const location = places.sort((a, b) => chance(b) - chance(a))[0]
    expect(location).toBeDefined()
    travel(game, location.id)
    for (let draw = 0; draw < 2000 && game.wild[0]?.speciesId !== 'wooper'; draw++) {
      game.wild = []
      game.player.state = 'IDLE'
      Object.assign(game.runtime, { spawnIn: 0, stateIn: 1000, targetId: null })
      advanceScripted(game, 200, bounds)
    }
    const target = game.wild[0]
    expect(target).toMatchObject({ speciesId: 'wooper', formId: 'wooper-paldea' })
    expect(reload(game).wild).toEqual(game.wild)
    target.currentHP = 1
    game.player.state = 'BATTLE'
    game.runtime.targetId = target.id
    game.runtime.rngState = Math.ceil((4294967296 - 1013904223) / 1664525)
    expect(dispatch(game, { type: 'throw-ball', itemId: 'pokeball' })).toBe(true)
    expect(game.pokedexCaught).toContain('wooper')
    expect(dispatch(game, { type: 'transfer-region', regionId: 'galar' })).toBe(true)
    expect(reload(game).followers[0]).toMatchObject({ speciesId: 'wooper', formId: 'wooper-paldea' })
  })
})
