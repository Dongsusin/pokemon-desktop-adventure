import { advanceScripted } from './arenaSimulation'
import { describe, expect, it } from 'vitest'
import { performArenaTactic, arenaSkills, arenaSpriteRefs, battleGimmickStatus, createGame, dispatch, hydrateSave, moves, playerStats, type GameSave } from '../src/game/engine'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'
import { megaFormFor } from '../src/game/battleGimmicks'
import { MAX_GIMMICK_ACTIONS, boostedMove } from '../src/game/gimmickCombat'
import { beginArenaCast, createArena, restoreArena, stepArena } from '../src/game/trainerArena'
import { castSkill, resumeWithLastOpponent } from './trainerArenaDriver'

const bounds = { width: 1200, height: 760 }
const time = Date.UTC(2026, 9, 1)
function regional(region: RegionId, partner = 'blastoise') {
  const game = createGame('squirtle', 1, bounds, time, 19)
  for (const id of regionOrder.slice(0, regionOrder.indexOf(region))) {
    game.regionProgress[id] = { badges: worldRegions[id].gymTrainers.map(g => g.id), champion: true }
  }
  game.regionId = region
  game.locationId = worldRegions[region].gymTrainers[0].locationId
  game.player.speciesId = partner
  game.player.level = 25
  game.player.currentHP = playerStats(game).hp
  game.player.moveIds = ['tackle', 'waterGun', 'waterPulse']
  game.followers.push({ instanceId: 'caught-77', speciesId: 'pikachu', level: 11, currentHP: 22,
    active: true, position: game.player.position, direction: 1, state: 'IDLE', restMs: 0, destination: null, roamSeed: 42 })
  return game
}
function battle(region: RegionId, partner?: string) {
  const g = regional(region, partner)
  expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
  return g
}
function frames(g: GameSave, n: number) {
  for (let i = 0; i < n; i++) advanceScripted(g, 100, bounds)
}
function switchTo(g: GameSave, id: string) {
  g.campaign.battle!.arena.switchCooldownMs = 0
  expect(dispatch(g, { type: 'arena-switch', instanceId: id })).toBe(true)
}

describe('regional battle gimmicks', () => {
  it('keeps a native Mega form on its original party member through switches then restores the base form', () => {
    const g = battle('kalos'), original = g.player.instanceId, base = playerStats(g)
    const form = megaFormFor('blastoise')
    expect(form).toBeTruthy()
    expect(dispatch(g, { type: 'arena-gimmick' })).toBe(true)
    expect(playerStats(g).spAttack).toBeGreaterThan(base.spAttack)
    expect(arenaSpriteRefs(g).player?.formId).toBe(form)
    expect(g.player.formId).toBeUndefined()
    switchTo(g, 'caught-77')
    expect(battleGimmickStatus(g)?.phase).toBe('spent')
    switchTo(g, original)
    expect(battleGimmickStatus(g)).toMatchObject({ phase: 'active', formId: form })
    expect(dispatch(g, { type: 'arena-surrender' })).toBe(true)
    expect(playerStats(g)).toEqual(base)
    expect(g.runtime.gimmick).toBeUndefined()
    expect(dispatch(battle('kalos','squirtle'), { type: 'arena-gimmick' })).toBe(false)
  })

  it('offers eligible native variants and preserves the selected Mega across a save', () => {
    const g = battle('kalos', 'charizard')
    expect(battleGimmickStatus(g)?.megaOptions).toEqual(['charizard-mega-x', 'charizard-mega-y'])
    expect(dispatch(g, { type: 'arena-gimmick', formId: 'mewtwo-mega-y' })).toBe(false)
    expect(dispatch(g, { type: 'arena-gimmick', formId: 'charizard-mega-y' })).toBe(true)
    expect(battleGimmickStatus(g)?.formId).toBe('charizard-mega-y')
    expect(battleGimmickStatus(hydrateSave(g, 1)!)?.formId).toBe('charizard-mega-y')
    expect(g.player.formId).toBeUndefined()
  })

  it('automatically attunes Z to a usable attack against an immune wild target', () => {
    const g = regional('alola', 'pikachu')
    g.player.moveIds = ['tackle', 'thunderShock']
    const foe = { id: 250, speciesId: 'sandshrew', level: 25, currentHP: 500, maxHP: 500,
      position: { ...g.player.position }, direction: 1 as const }
    g.wild = [foe]
    g.runtime.targetId = foe.id
    g.runtime.turn = 'player'
    g.runtime.stateIn = 0
    g.player.state = 'BATTLE'
    advanceScripted(g, 100, bounds)
    expect(battleGimmickStatus(g)).toMatchObject({ kind: 'z', teraType: 'normal', phase: 'active' })
    frames(g, 11)
    expect(foe.currentHP).toBeLessThan(500)
    expect(battleGimmickStatus(g)?.phase).toBe('spent')
  })

  it('keeps a ranged attack in a wild fight if transforming would leave only immune attacks', () => {
    const g = regional('kalos', 'swampert')
    const foe = { id: 250, speciesId: 'gengar', level: 25, currentHP: 500, maxHP: 500,
      position: { ...g.player.position }, direction: 1 as const }
    g.wild = [foe]
    g.runtime.targetId = foe.id
    g.runtime.turn = 'player'
    g.runtime.stateIn = 0
    g.player.state = 'BATTLE'
    advanceScripted(g, 100, bounds)
    expect(foe.currentHP).toBeLessThan(500)
    expect(g.runtime.gimmick).toBeUndefined()
  })

  it('lets the opposing Alola kahuna charge and commit a Z Move with his ace independently', () => {
    let g = regional('alola','eevee')
    const gyms = worldRegions.alola.gymTrainers
    const index = gyms.findIndex(trainer => trainer.id === 'alola-hala')
    g.campaign.badges = gyms.slice(0, index).map(trainer => trainer.id)
    g.locationId = gyms[index].locationId
    expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
    expect(battleGimmickStatus(g, 'enemy')).toBeNull()
    g = resumeWithLastOpponent(g)
    expect(g.wild[0].speciesId).toBe('crabrawler')
    expect(battleGimmickStatus(g, 'enemy')).toMatchObject({ kind: 'z', phase: 'ready', teraType: 'fighting' })
    const arena = g.campaign.battle!.arena
    arena.player = { x: .40, y: .5 }
    arena.enemy = { x: .48, y: .5 }
    let powered = false
    for (let i = 0; i < 80 && !powered; i++) {
      advanceScripted(g, 100, bounds)
      powered = arena.casts.some(cast => cast.side === 'enemy' && cast.gimmick === 'z')
    }
    expect(powered).toBe(true)
    expect(battleGimmickStatus(g, 'enemy')?.phase).toBe('spent')
    expect(g.runtime.gimmick?.player).toBeUndefined()
  })

  it('commits one matching Z attack even when the shot misses; other types retain their skill', () => {
    const g = battle('alola'), arena = g.campaign.battle!.arena
    const base = arenaSkills(g)[1]
    expect(dispatch(g, { type: 'arena-gimmick' })).toBe(true)
    const skills = arenaSkills(g)
    expect(skills[0].move.gimmick).toBeUndefined()
    expect(skills[1].move).toMatchObject({ gimmick: 'z', id: 'waterGun' })
    expect(skills[1].profile.radius).toBeGreaterThan(base.profile.radius)
    expect(skills[1].move.power).toBeGreaterThan(base.move.power)
    arena.player = { x: .05, y: .10 }; arena.enemy = { x: .95, y: .90 }
    arena.enemyInMs = 5000
    const hp = g.wild[0].currentHP
    expect(performArenaTactic(g, { type: 'arena-skill', slot: 1 })).toBe(true)
    expect(arena.casts[0].gimmick).toBe('z')
    expect(battleGimmickStatus(g)?.phase).toBe('spent')
    frames(g, 24)
    expect(g.wild[0].currentHP).toBe(hp)
    expect(dispatch(g, { type: 'arena-gimmick' })).toBe(false)
  })

  it('gives only the activated Galar fighter extra HP and consumes Max casts even at a distance', () => {
    const g = battle('galar'), a = g.campaign.battle!.arena, hp = playerStats(g).hp
    expect(arenaSpriteRefs(g).enemy?.dynamax).toBe(false)
    expect(dispatch(g, { type: 'arena-gimmick' })).toBe(true)
    expect(playerStats(g).hp).toBe(Math.floor(hp * 1.5))
    for (let n = MAX_GIMMICK_ACTIONS; n > 0; n--) {
      a.enemyInMs = 6000
      a.player = {x:.05, y:.10}; a.enemy = {x:.95, y:.90}
      expect(battleGimmickStatus(g)?.remaining).toBe(n)
      expect(performArenaTactic(g, { type: 'arena-skill', slot: 0 })).toBe(true)
      expect(a.casts[0].gimmick).toBe('dynamax')
      frames(g, 18)
    }
    expect(battleGimmickStatus(g)?.phase).toBe('spent')
    expect(playerStats(g).hp).toBe(hp)
    expect(dispatch(g, { type: 'arena-gimmick' })).toBe(false)
  })

  it('resolves simultaneous reachable Max strikes once, including resuming a non-beam showdown', () => {
    const arena = createArena(['partner'])
    arena.player = {x:.44,y:.5}; arena.enemy = {x:.55,y:.5}
    const hit = boostedMove(moves.tackle, 'dynamax')
    beginArenaCast(arena, 'player', hit)
    beginArenaCast(arena, 'enemy', hit)
    expect(stepArena(arena, 100, 0, 0, moves.tackle, {}, () => 2)).toHaveLength(0)
    expect(arena.maxClash?.elapsedMs).toBe(100)
    const restored = restoreArena(arena, ['partner'], false, [moves.tackle], () => moves.tackle)
    expect(restored.maxClash).toEqual(arena.maxClash)
    let outcomes = 0
    for (let i=0; i<50; i++) outcomes += stepArena(restored,16,0,0,moves.tackle).length
    expect(outcomes).toBe(1)
    expect(restored.maxClash).toBeUndefined()
    expect(restored.lastClash).toMatchObject({ winner:'player', outcome:'break' })
  })

  it('scopes Tera to its actual owner while an equivalent unevolved fighter stays neutral', () => {
    const g = battle('paldea'), a = g.campaign.battle!.arena
    expect(g.wild[0].teraType).toBeUndefined()
    const normal = structuredClone(g)
    for (const sim of [g, normal]) {
      const arena = sim.campaign.battle!.arena
      arena.player = {x:.4, y:.5}; arena.enemy = {x:.52,y:.5}; arena.enemyInMs = 6000
      sim.wild[0].currentHP = sim.wild[0].maxHP = 1000
    }
    expect(dispatch(g, {type:'arena-gimmick'})).toBe(true)
    expect(battleGimmickStatus(g)).toMatchObject({ teraType:'water', phase:'active' })
    for (const sim of [g,normal]) {
      expect(performArenaTactic(sim, {type:'arena-skill',slot:2})).toBe(true)
      frames(sim, 11)
    }
    expect(g.wild[0].currentHP).toBeLessThan(normal.wild[0].currentHP)
    expect(a.needsSwitch).toBe(false)
    switchTo(g, 'caught-77')
    expect(battleGimmickStatus(g)?.phase).toBe('spent')
  })

  it.each(['kalos','alola','galar','paldea'] as const)('uses %s automatically on a tough live wild encounter and leaves it on travel', region => {
    const g = regional(region), initial = playerStats(g).hp
    const foe = { id: 250, speciesId:'rattata',level:25,currentHP:500,maxHP:500,position:{...g.player.position},direction:1 as const }
    g.wild = [foe];g.runtime.targetId=foe.id;g.runtime.turn='player';g.runtime.stateIn=0;g.player.state='BATTLE'
    advanceScripted(g, 100, bounds)
    expect(g.effects.some(effect => effect.gimmick)).toBe(true)
    expect(g.runtime.gimmick?.player).toBeTruthy()
    expect(foe.currentHP).toBe(500)
    frames(g, 11)
    expect(foe.currentHP).toBeLessThan(500)
    const loc = worldRegions[region].locations.find(l => l.id !== g.locationId && !l.afterFinale)!
    expect(dispatch(g,{type:'travel',locationId:loc.id})).toBe(true)
    expect(g.runtime.gimmick).toBeUndefined()
    expect(playerStats(g).hp).toBe(initial)
  })
  it('avoids spending a power on a weakened wild Pokémon and blocks activation while the arena is paused', () => {
    const g = regional('alola')
    g.wild=[{id:230,speciesId:'rattata',level:5,currentHP:1,maxHP:8,position:g.player.position,direction:1}]
    g.runtime.targetId=230;g.runtime.turn='player';g.runtime.stateIn=0;g.player.state='BATTLE'
    advanceScripted(g,100,bounds)
    expect(g.history.some(e=>e.text.includes('Z기술'))).toBe(false)
    const t = battle('alola')
    dispatch(t,{type:'arena-pause',paused:true})
    expect(dispatch(t,{type:'arena-gimmick'})).toBe(false)
    expect(hydrateSave(t,1)?.campaign.battle?.arena.paused).toBe(true)
  })
})
