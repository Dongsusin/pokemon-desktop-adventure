import { describe, expect, it } from 'vitest'
import { battleGimmickStatus, createGame, currentTrainer, dispatch, fieldMemberMoves, hydrateSave, movesFor, playerStats, tick, type GameSave } from '../src/game/engine'
import { championsMoves, damaging } from '../src/game/championsMoves'
import { isMoveMotionSupported } from '../src/game/motionEligibility'
import { fieldTrainerById, fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { worldRegions } from '../src/game/regions/world'
import { castSkill } from './trainerArenaDriver'

const bounds = {width:1280, height:800}
const ash = 'field-kanto-ash'
function enter(id: string, lead: string, level: number, slot = 0, teamNumber = 1, withBench = false) {
  const trainer = fieldTrainerById[id]!
  const g = createGame('squirtle',1,bounds,Date.UTC(2026,10,19),19)
  g.locationId = trainer.locationId
  g.campaign.badges = worldRegions.kanto.gymTrainers.map(t=>t.id)
  Object.assign(g.player,{ speciesId:lead, level, moveIds:movesFor(lead,level).map(m=>m.id) })
  g.player.currentHP = playerStats(g).hp
  expect(dispatch(g,{type:'challenge-field-trainer',trainerId:id,teamNumber})).toBe(true)
  const member = currentTrainer(g)!.team[slot], battle = g.campaign.battle!
  battle.opponentIndex = slot
  battle.fieldAI!.benchHP = trainer.teams[teamNumber-1].map((_,i) => i === slot || withBench ? null : 0)
  Object.assign(g.wild[0],{speciesId:member.speciesId, formId:member.formId, level:member.level, currentHP:9999})
  const game = hydrateSave(g,1)!
  expect(dispatch(game,{type:'arena-pause',paused:false})).toBe(true)
  const arena = game.campaign.battle!.arena
  arena.player = {x:.42,y:.5}
  arena.enemy = {x:.53,y:.5}
  arena.enemyInMs = 0
  return game
}
const advance = (game: GameSave, ms: number) => { for (let left=ms; left>0; left-=50) tick(game,Math.min(50,left),bounds) }
const enemyCast = (game: GameSave) => game.campaign.battle!.arena.casts.find(c=>c.side==='enemy')
const reload = (game: GameSave) => hydrateSave(JSON.parse(JSON.stringify(game)),1)!

describe('Champions Arena field decisions', () => {
  it('uses the selected set and a dedicated actor pose for each of the 3,983 playable slots', () => {
    const members = Object.values(fieldTrainersByRegion).flat().flatMap(t=>t.teams.flat())
    expect(members).toHaveLength(3983)
    for (const m of members) {
      const skills = fieldMemberMoves(m)
      const expected = m.plan!.moves.filter(id=>championsMoves[id] && isMoveMotionSupported(m.speciesId,m.formId,id))
      expect(skills.slice(0,expected.length).map(move=>move.id)).toEqual(expected)
      expect(skills.every(move=>isMoveMotionSupported(m.speciesId,m.formId,move.id))).toBe(true)
      expect(skills.some(damaging)).toBe(true)
      expect(skills.length).toBe(expected.length + (expected.some(id=>damaging(championsMoves[id]!)) ? 0 : 1))
    }
  })

  it('uses Pikachu’s electric signature against water and changes to coverage against ground', () => {
    const water = enter(ash,'squirtle',12), ground = enter(ash,'geodude',12)
    advance(water,50)
    advance(ground,50)
    expect(enemyCast(water)?.moveId).toBe('thunderbolt')
    expect(enemyCast(ground)).toMatchObject({moveId:'knockoff',moveType:'dark'})
    expect(ground.runtime.gimmick?.enemy).toBeUndefined()
  })

  it('withdraws an endangered Pikachu, retains its HP through reload, and sends it back without a premature reward', () => {
    const game = enter(ash,'geodude',15,0,1,true)
    game.wild[0].currentHP = 1
    game.campaign.battle!.fieldAI!.switchReadyAt = 0
    game.campaign.battle!.arena.enemyInMs = 1000
    advance(game,50)
    const incoming = game.campaign.battle!.opponentIndex
    expect(game.wild[0].speciesId).toBe('greninja')
    expect(game.history[0].text).toContain('피카츄 → 개굴닌자')
    const restored = reload(game), battle = restored.campaign.battle!
    expect(battle.opponentIndex).toBe(incoming)
    expect(battle.fieldAI!.benchHP[0]).toBe(1)
    expect(battle.fieldAI!.switchReadyAt).toBeGreaterThan(restored.runtime.clock+6000)
    expect(restored.coins).toBe(0)
    // The last two survivors are Greninja and the withdrawn Pikachu.
    battle.fieldAI!.benchHP = battle.fieldAI!.benchHP.map((_,i)=> i === 0 ? 1 : i === incoming ? null : 0)
    restored.wild[0].currentHP = 1
    castSkill(restored,'tackle')
    expect(restored.wild[0]).toMatchObject({speciesId:'pikachu',currentHP:1})
    expect(battle.fieldAI!.benchHP[incoming]).toBe(0)
    expect(restored.campaign.fieldWins).toBeUndefined()
    castSkill(restored,'tackle')
    expect(restored.campaign.fieldWins).toEqual([ash])
    expect(restored.wins).toBe(1)
  })

  it.each([
    {id:ash,team:1,slot:0,who:'squirtle',level:12,kind:'z',owner:'slot-0',move:'thunderbolt'},
    {id:ash,team:1,slot:1,who:'squirtle',level:12,kind:'dynamax',owner:'slot-1',move:'thunderpunch'},
    {id:ash,team:1,slot:3,who:'venusaur',level:17,kind:'mega',owner:'slot-3',form:'charizard-mega-x'},
    {id:'field-kanto-giovanni',team:4,slot:2,who:'blastoise',level:40,kind:'tera',owner:'slot-2',tera:'water'},
  ])('compares and commits $kind for its actual source owner, including outside its native region', t => {
    const game = enter(t.id,t.who,t.level,t.slot,t.team)
    if (t.kind !== 'tera') game.player.currentHP = 25
    game.wild[0].currentHP = Math.ceil(game.wild[0].maxHP*.45)
    const hp = game.wild[0].currentHP
    advance(game,50)
    const used = game.runtime.gimmick?.enemy
    expect(used).toMatchObject({kind:t.kind,owner:t.owner})
    if (t.move) expect(enemyCast(game)).toMatchObject({moveId:t.move,gimmick:t.kind})
    if (t.form) expect(used?.formId).toBe(t.form)
    if (t.tera) expect(game.wild[0].teraType).toBe(t.tera)
    if (t.kind === 'dynamax') expect(game.wild[0].currentHP).toBeGreaterThan(hp)
    const restored = reload(game)
    expect(restored.runtime.gimmick?.enemy).toEqual(used)
    expect(restored.wild[0]).toMatchObject({maxHP:game.wild[0].maxHP,currentHP:game.wild[0].currentHP})
    expect(enemyCast(restored)?.moveId).toBe(enemyCast(game)?.moveId)
    expect(battleGimmickStatus(restored)).toBeNull()
    if (t.kind === 'z') expect(battleGimmickStatus(restored,'enemy')?.phase).toBe('spent')
  })

  it('saves the team’s power if the ordinary hit already finishes the fight', () => {
    const game = enter(ash,'squirtle',8)
    game.player.currentHP = 1
    advance(game,50)
    expect(enemyCast(game)?.moveId).toBeTruthy()
    expect(game.runtime.gimmick?.enemy).toBeUndefined()
  })

  it('heals only the opponent from range and does not spam its recovery', () => {
    const game = enter('field-kanto-c-106','blastoise',23)
    game.player.moveIds = ['tackle']
    const arena = game.campaign.battle!.arena
    arena.player.x = .1
    arena.enemy.x = .8
    const foe = game.wild[0], playerHP = game.player.currentHP
    foe.currentHP = Math.round(foe.maxHP/2)
    advance(game,50)
    expect(enemyCast(game)?.moveId).toBe('recover')
    advance(game,950)
    expect(foe.currentHP).toBe(foe.maxHP)
    expect(game.player.currentHP).toBe(playerHP)
    expect(reload(game).campaign.battle!.fieldAI!.supportReadyAt).toBeGreaterThan(game.runtime.clock)
  })

  it('sets up Shell Smash into a safe matchup and carries the actual stat stages through reload', () => {
    const game = enter('field-kanto-blue','blastoise',15)
    game.player.moveIds = ['tackle']
    advance(game,50)
    expect(enemyCast(game)?.moveId).toBe('shellsmash')
    advance(game,950)
    expect(reload(game).campaign.battle!.fieldAI!.stages).toEqual({attack:2,spAttack:2,speed:2,defense:-1,spDefense:-1})
  })

  it('blocks an incoming beam with Protect and keeps the blocked pulses out of the damage budget', () => {
    const game = enter('field-kanto-d-238','blastoise',20,1)
    game.player.moveIds = ['waterGun']
    const hp = game.wild[0].currentHP
    expect(dispatch(game,{type:'arena-skill',slot:0})).toBe(true)
    advance(game,50)
    expect(enemyCast(game)?.moveId).toBe('protect')
    advance(game,650)
    expect(game.wild[0].currentHP).toBe(hp)
    expect(game.campaign.battle!.arena.feedback?.text).toContain('막았다')
    const beam = game.campaign.battle!.arena.casts.find(c=>c.side==='player')!.beam!
    expect(beam.applied).toBeGreaterThan(0)
  })

  it('executes a landed U-turn by switching into a healthy reserve and keeping the damage it dealt', () => {
    const game = enter('field-kanto-giovanni','slowbro',27,0,1,true)
    game.player.moveIds = ['tackle']
    const hp = game.player.currentHP
    advance(game,50)
    expect(enemyCast(game)?.moveId).toBe('uturn')
    advance(game,600)
    expect(game.wild[0].speciesId).not.toBe('persian')
    expect(game.campaign.battle!.fieldAI!.benchHP[0]).toBeGreaterThan(0)
    expect(game.player.currentHP).toBeLessThan(hp)
  })

  it('retains a withdrawn Mega on its original party slot without giving the incoming member a second power', () => {
    const game = enter(ash,'venusaur',17,3,1,true)
    game.wild[0].currentHP = Math.ceil(game.wild[0].maxHP*.45)
    game.player.currentHP = 25
    advance(game,50)
    const power = game.runtime.gimmick!.enemy
    expect(power).toMatchObject({owner:'slot-3',kind:'mega',formId:'charizard-mega-x'})
    const battle = game.campaign.battle!
    battle.arena.casts = []
    battle.arena.enemyInMs = 4500
    game.player.speciesId = 'blastoise'
    game.player.level = 40
    game.player.moveIds = ['tackle','waterGun']
    game.player.currentHP = playerStats(game).hp
    game.wild[0].currentHP = 1
    battle.fieldAI!.switchReadyAt = battle.fieldAI!.decideAt = 0
    advance(game,50)
    expect(battle.opponentIndex).not.toBe(3)
    const restored = reload(game), b = restored.campaign.battle!
    expect(restored.runtime.gimmick?.enemy).toEqual(power)
    expect(battleGimmickStatus(restored,'enemy')?.phase).toBe('spent')
    b.fieldAI!.benchHP = b.fieldAI!.benchHP.map((_,i) => i===3 ? 1 : i===b.opponentIndex ? null : 0)
    restored.wild[0].currentHP = 1
    castSkill(restored,'tackle')
    expect(restored.wild[0]).toMatchObject({speciesId:'charizard',currentHP:1})
    expect(battleGimmickStatus(restored,'enemy')).toMatchObject({kind:'mega',formId:'charizard-mega-x',phase:'active'})
  })

  it('migrates the fainted prefix and spent power of a v0.28 battle without granting another use', () => {
    const game = enter(ash,'blastoise',55,3,2,true)
    const legacy = JSON.parse(JSON.stringify(game))
    legacy.schemaVersion = 20
    delete legacy.campaign.battle.fieldAI
    delete legacy.wild[0].fieldSlot
    legacy.runtime.gimmick = {targetId:legacy.wild[0].id,enemy:{kind:'z',active:false,owner:'19',teraType:'electric'}}
    const restored = hydrateSave(legacy,1)!
    expect(restored.campaign.battle!.fieldAI!.benchHP).toEqual([0,0,0,null,null,null])
    expect(restored.campaign.battle!.teamNumber).toBe(2)
    expect(restored.wild[0].speciesId).toBe(currentTrainer(restored)!.team[3].speciesId)
    expect(reload(restored).runtime.gimmick?.enemy).toMatchObject({kind:'z',active:false})
  })
})
