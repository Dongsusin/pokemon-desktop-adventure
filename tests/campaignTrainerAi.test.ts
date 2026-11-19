import { describe, expect, it } from 'vitest'
import { arenaSpriteRefs, battleGimmickStatus, createGame, currentTrainer, dispatch, fieldMemberMoves, fieldPowerOptions,
  hydrateSave, moves, movesFor, playerStats, resolveTrainer, tick, type GameSave } from '../src/game/engine'
import { createArenaCast } from '../src/game/arenaMoves'
import { damaging } from '../src/game/championsMoves'
import { regionGimmick } from '../src/game/battleGimmicks'
import { isMoveMotionSupported } from '../src/game/motionEligibility'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'
import { castSkill, resumeWithLastOpponent } from './trainerArenaDriver'

const bounds = { width: 1280, height: 720 }
function challenge(regionId: RegionId, id: string, partner: string, level: number, starter = 'squirtle') {
  const region = worldRegions[regionId], trainer = region.trainerById[id]!
  const game = createGame(starter, 1, bounds, Date.UTC(2026, 10, 19), 19)
  for (const previous of regionOrder.slice(0, regionOrder.indexOf(regionId))) {
    game.regionProgress[previous] = { badges: worldRegions[previous].gymTrainers.map(t => t.id), champion: true }
  }
  game.regionId = regionId
  game.locationId = trainer.locationId
  const gyms = region.gymTrainers
  game.campaign.badges = (trainer.role === 'gym' ? gyms.slice(0, gyms.indexOf(trainer)) : gyms).map(t => t.id)
  const finale = trainer === region.finaleTrainer
  if (finale) game.campaign.champion = true
  else if (trainer.role !== 'gym') {
    const step = region.leagueTrainers.indexOf(trainer)
    game.campaign.leagueIndex = step
    if (region.freeEliteOrder) game.campaign.eliteWins = region.leagueTrainers.slice(0, step).map(t => t.id)
  }
  Object.assign(game.player, { speciesId: partner, level, moveIds: movesFor(partner, level).map(m => m.id) })
  game.player.currentHP = playerStats(game).hp
  const type = finale ? 'challenge-finale' : trainer.role === 'gym' ? 'challenge-gym' : 'challenge-league'
  expect(dispatch(game, { type, trainerId: id })).toBe(true)
  return game
}

function align(game: GameSave, enemyInMs = 0) {
  const arena = game.campaign.battle!.arena
  arena.enemyInMs = enemyInMs
  arena.player = { x: .30, y: .5 }
  arena.enemy = { x: .40, y: .5 }
}

function retreat(game: GameSave) {
  align(game, 800)
  game.wild[0].currentHP = 1
  game.campaign.battle!.fieldAI!.switchReadyAt = 0
  tick(game, 20, bounds)
}

const reload = (g: GameSave) => hydrateSave(JSON.parse(JSON.stringify(g)), 1)!

describe('Champions Arena campaign trainers', () => {
  it('gives all 116 human battles learned, animated attacks on each starter branch and reserves the local power for one member', () => {
    let count = 0, totems = 0
    for (const region of Object.values(worldRegions)) {
      for (const base of [...region.gymTrainers, ...region.leagueTrainers, ...(region.finaleTrainer ? [region.finaleTrainer] : [])]) {
        if (base.trialKind === 'totem') {
          const trial = resolveTrainer(region, base, 'squirtle')
          expect(trial.totemAura).toBeDefined()
          expect(trial.team.every(m => !m.plan)).toBe(true)
          totems++
          continue
        }
        count++
        for (const starter of ['charmander', 'squirtle', 'bulbasaur']) {
          const trainer = resolveTrainer(region, base, starter)
          for (const m of trainer.team) {
            const skills = fieldMemberMoves(m)
            expect(skills.map(s => s.id)).toEqual(m.plan!.moves)
            expect(skills.length).toBeLessThanOrEqual(4)
            expect(skills.some(damaging)).toBe(true)
            expect(skills.every(s => isMoveMotionSupported(m.speciesId, m.formId, s.id))).toBe(true)
          }
          const powers = trainer.team.flatMap(m => fieldPowerOptions(m))
          expect(powers.length).toBeLessThanOrEqual(1)
          expect(powers.every(p => p.kind === regionGimmick(region.id))).toBe(true)
          if (region.id === 'alola' || region.id === 'paldea' || (region.id === 'galar' && trainer.id !== 'galar-piers')) {
            expect(powers).toHaveLength(1)
          }
          if (trainer.id === 'galar-piers') expect(powers).toHaveLength(0)
        }
      }
    }
    expect([count, totems]).toEqual([116, 7])
  })

  it.each([
    ['lorelei', 'kanto', 'charizard', 'slowbro'], ['lorelei', 'kanto', 'pikachu', 'lapras'],
    ['sinnoh-cynthia', 'sinnoh', 'pikachu', 'garchomp'], ['sinnoh-cynthia', 'sinnoh', 'garchomp', 'milotic'],
  ] as const)('%s chooses a replacement against %s / %s using its remaining party', (id, region, player, replacement) => {
    const game = challenge(region, id, player, 60)
    retreat(game)
    const saved = reload(game)
    expect(saved.wild[0].speciesId).toBe(replacement)
    expect(saved.campaign.battle!.fieldAI!.benchHP[0]).toBe(1)
    expect(saved.campaign.battle!.fieldAI!.switchReadyAt).toBeGreaterThan(saved.runtime.clock)
  })

  it('lets the champion send the ace early and grants the title only after the entire team faints', () => {
    const game = challenge('sinnoh', 'sinnoh-cynthia', 'charizard', 60)
    retreat(game)
    const team = currentTrainer(game)!.team
    expect(game.campaign.battle!.opponentIndex).toBe(team.length - 1)
    expect(game.wild[0].speciesId).toBe('garchomp')
    game.wild[0].currentHP = 1
    castSkill(game, 'ember')
    expect(game.campaign.champion).toBe(false)
    expect(game.wins).toBe(0)
    expect(game.campaign.battle!.fieldAI!.benchHP.at(-1)).toBe(0)
    for (let i = 0; i < 25 && game.campaign.battle; i++) {
      game.wild[0].currentHP = 1
      castSkill(game, 'ember')
    }
    expect(game.campaign.champion).toBe(true)
    expect(game.wins).toBe(1)
  })

  it('withholds Diantha’s Mega outside attack range and uses it on her Gardevoir when the matchup warrants it', () => {
    let game = challenge('kalos', 'kalos-diantha', 'blastoise', 60)
    expect(battleGimmickStatus(game, 'enemy')).toBeNull()
    game = resumeWithLastOpponent(game)
    const b = game.campaign.battle!
    b.arena.enemy.x = .94
    b.arena.player.x = .06
    b.arena.enemyInMs = 0
    tick(game, 20, bounds)
    expect(game.runtime.gimmick?.enemy).toBeUndefined()
    align(game)
    for (let i = 0; i < 180 && !game.runtime.gimmick?.enemy; i++) tick(game, 40, bounds)
    expect(game.runtime.gimmick?.enemy).toMatchObject({ kind: 'mega', owner: 'slot-' + b.opponentIndex, formId: 'gardevoir-mega' })
    expect(arenaSpriteRefs(reload(game)).enemy?.formId).toBe('gardevoir-mega')
  })

  it('recovers a v21 starter-dependent Nemona ace, its active Tera and the fainted prefix on repeated loads', () => {
    const g = resumeWithLastOpponent(challenge('paldea', 'paldea-nemona', 'blastoise', 65, 'charmander'))
    const fixture = JSON.parse(JSON.stringify(g)), foe = fixture.wild[0], b = fixture.campaign.battle
    fixture.schemaVersion = 21
    delete b.fieldAI
    delete foe.fieldSlot
    foe.teraType = 'grass'
    fixture.runtime.gimmick = { targetId: foe.id, enemy: { kind: 'tera', owner: String(foe.id), active: true, teraType: 'grass' } }
    const saved = hydrateSave(fixture, 1)!
    expect(saved.wild[0]).toMatchObject({ speciesId: 'meowscarada', teraType: 'grass', fieldSlot: b.opponentIndex })
    expect(saved.campaign.battle!.fieldAI!.benchHP).toEqual([...Array(b.opponentIndex).fill(0), null])
    expect(reload(saved).runtime.gimmick?.enemy).toMatchObject({ owner: 'slot-' + b.opponentIndex, active: true })
    expect(currentTrainer(saved)!.team[b.opponentIndex].plan!.powers).toEqual([{ kind: 'tera', type: 'grass' }])
    expect(saved.campaign.finaleWon).toBeUndefined()
  })

  it('finishes a committed v21 gym move before choosing the new set', () => {
    const g = challenge('kanto', 'brock', 'squirtle', 18), b = g.campaign.battle!
    align(g)
    const legacy = createArenaCast(1, 'enemy', moves.rockThrow, b.arena.enemy, b.arena.player, arenaSpriteRefs(g))
    // A long clash can leave the next attack timer ready while the old move is still finishing.
    b.arena.casts = [legacy]
    b.arena.nextCastId = 2
    const fixture = JSON.parse(JSON.stringify(g))
    fixture.schemaVersion = 21
    delete fixture.campaign.battle.fieldAI
    delete fixture.wild[0].fieldSlot
    const resumed = hydrateSave(fixture, 1)!, arena = resumed.campaign.battle!.arena
    expect(arena.casts[0].moveId).toBe('rockThrow')
    expect(dispatch(resumed, { type: 'arena-pause', paused: false })).toBe(true)
    const hp = resumed.player.currentHP
    for (let i = 0; i < 160 && arena.nextCastId < 3; i++) tick(resumed, 30, bounds)
    expect(resumed.player.currentHP).toBeLessThan(hp)
    expect(currentTrainer(resumed)!.team[0].plan!.moves).toContain(arena.lastEnemyMoveId)
  })
})
