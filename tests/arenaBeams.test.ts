import { describe, expect, it } from 'vitest'
import { beamClashPower } from '../src/game/arenaBeams'
import { arenaCastFrame, beamRounds } from '../src/game/arenaMoves'
import { arenaStepMs, beginArenaCast, createArena, dodgeArena, moveArena, restoreArena, stepArena, type ArenaImpact, type TrainerArena } from '../src/game/trainerArena'
import { createGame, dispatch, hydrateSave, moves, playerStats, tick } from '../src/game/engine'

function field(withEnemy = true) {
  const a = createArena(['starter'])
  a.player = { x: .35, y: .5 }
  a.enemy = { x: .53, y: .5 }
  a.enemyInMs = 5000
  beginArenaCast(a, 'player', moves.waterGun)
  if (withEnemy) beginArenaCast(a, 'enemy', moves.waterGun)
  return a
}
function advance(a: TrainerArena, duration: number, ratio = 1) {
  const impacts: ArenaImpact[] = []
  for (let ms = duration; ms > .000001;) {
    const dt = arenaStepMs(a, ms)
    impacts.push(...stepArena(a, dt, 0, 0, moves.waterGun, undefined, () => ratio))
    ms -= dt
  }
  return impacts
}

describe('sustained beams and clash resolution', () => {
  it('samples only the currently occupied beam every 200 ms and does not repay missed pulses', () => {
    const a = field(false), cast = a.casts[0]
    expect(advance(a, cast.profile.startupMs + 199)).toHaveLength(0)
    expect(advance(a, 1)).toMatchObject([{ hit: true, beamShare: 1 / 6 }])
    a.enemy.y = .86
    expect(advance(a, 400)).toHaveLength(0)
    a.enemy.y = .5
    expect(advance(a, 800).filter(hit => hit.hit)).toHaveLength(3)
    expect(cast.beam).toMatchObject({ pulses: 6, hits: 4 })
    expect(cast.result).toBe('hit')
  })
  it('meets at the visible tips, pauses both channels, restores unchanged and cancels equal beams at 2.5 s', () => {
    const a = field()
    advance(a, 500)
    const held = a.beamClash!
    expect(held).toBeTruthy()
    expect(a.casts.map(c => arenaCastFrame(c).beamTip)).toEqual([held.point, held.point])
    const times = a.casts.map(c => c.elapsedMs)
    expect(advance(a, 500)).toEqual([])
    expect(a.casts.map(c => c.elapsedMs)).toEqual(times)
    const restored = restoreArena(JSON.parse(JSON.stringify(a)), ['starter'], false, [moves.waterGun], id => moves[id])
    expect(restored.beamClash).toEqual(a.beamClash)
    expect(advance(a, 2500).some(i => i.hit)).toBe(false)
    expect(advance(restored, 2500).some(i => i.hit)).toBe(false)
    expect(a.lastClash).toMatchObject({ outcome: 'draw', winner: null })
    expect(restored.lastClash).toEqual(a.lastClash)
  })
  it('drifts toward the weaker caster, blocks body damage, and breaks only after the grace period', () => {
    const a = field(), impacts = advance(a, 750, 100)
    expect(impacts).toEqual([])
    expect(a.beamClash!.balance).toBeGreaterThan(0)
    const [winner] = advance(a, 800, 100).filter(i => i.hit)
    expect(winner.cast.side).toBe('player')
    expect(winner.beamShare).toBeGreaterThan(.8)
    expect(winner.beamShare).toBeLessThan(1)
    expect(a.lastClash).toMatchObject({ outcome: 'break', winner: 'player' })
    expect(a.beamClash).toBeNull()
    expect(advance(a, 600)).toEqual([])
  })
  it('awards half remaining channel at timeout, and exits on deliberate turn or dodge', () => {
    const capped = field()
    const damage = advance(capped, 3500, 1.05).filter(i => i.hit)
    expect(damage).toHaveLength(1)
    expect(damage[0].beamShare).toBeLessThan(.5)
    expect(capped.lastClash?.winner).toBe('player')
    for (const escape of [(a: TrainerArena) => moveArena(a, 0, -1), dodgeArena]) {
      const a = field()
      advance(a, 500)
      expect(a.beamClash).toBeTruthy()
      escape(a)
      expect(a.beamClash).toBeNull()
      expect(a.lastClash?.outcome).toBe('escape')
      expect(a.casts.every(c => !c.beamStop)).toBe(true)
    }
  })
  it('does not start a contest when mere extensions of parallel beams pass beside each other', () => {
    const a = field()
    const p = a.casts[0]
    p.origin.y += .1; p.target.y += .1; p.end.y += .1
    advance(a, 800)
    expect(a.beamClash).toBeNull()
  })

  it('applies type matchups between the two moves independently of defender typing', () => {
    const pressure = (type: string, other: string) => beamClashPower(20, 40, 40, true, type, other)
    expect(pressure('electric','water') / pressure('water','electric')).toBeCloseTo(1.5)
    expect(pressure('electric','dragon') / pressure('water','electric')).toBeCloseTo(.67)
    expect(pressure('dragon','dragon') / pressure('water','electric')).toBeCloseTo(1.5)
    expect(pressure('electric','ground') / pressure('water','electric')).toBeCloseTo(.5)
  })

  it.each([['pikachu', 'thunderShock', .5], ['squirtle','waterGun', .61]] as const)(
    'lets %s meet Misty’s Staryu through the normal controls at its true muzzle height',
    (partner, move, y) => {
      const bounds = { width: 1000, height: 700 }
      const g = createGame('squirtle', 1, bounds, 1000, 123)
      g.player.speciesId = partner
      g.player.level = 18
      g.player.currentHP = playerStats(g).hp
      g.player.moveIds = [move]
      g.campaign.badges = ['brock']
      g.campaign.fieldWins = ['field-kanto-ash', 'field-kanto-rocket-duo']
      expect(dispatch(g, { type:'travel', locationId:'cerulean-city' })).toBe(true)
      expect(dispatch(g, { type:'challenge-gym' })).toBe(true)
      expect(g.wild[0].speciesId).toBe('staryu')
      const a = g.campaign.battle!.arena
      a.player = { x:.37, y:.5 }; a.enemy = { x:.54, y }; a.enemyInMs = 0
      tick(g, 16, bounds)
      expect(dispatch(g, { type:'arena-skill', slot:0 })).toBe(true)
      for (let i=0; i<45 && !a.beamClash; i++) tick(g, 16, bounds)
      expect(a.beamClash).toBeTruthy()
      if (partner === 'pikachu') expect(a.beamClash!.ratio).toBeGreaterThan(1)
      expect(a.casts.map(c=>arenaCastFrame(c).beamTip)).toEqual([a.beamClash!.point, a.beamClash!.point])
      const restored = hydrateSave(JSON.parse(JSON.stringify(g)),1)!
      expect(restored.campaign.battle!.arena.beamClash).toEqual(a.beamClash)
      dispatch(restored,{ type:'arena-pause', paused:false })
      for (let i=0; i<200 && a.beamClash; i++) { tick(g,16,bounds); tick(restored,16,bounds) }
      expect(a.lastClash?.winner).toBe(restored.campaign.battle!.arena.lastClash?.winner)
      expect(restored.player.currentHP).toBe(g.player.currentHP)
      expect(restored.wild[0].currentHP).toBe(g.wild[0].currentHP)
    }
  )

  it('keeps Gyarados’ eight-way firing pose steady while its beam strikes a stationary Staryu', () => {
    const a = createArena(['starter'])
    a.player = { x:.396, y:.52 }; a.enemy = { x:.597, y:.592 }; a.enemyInMs = 5000
    const beam = beginArenaCast(a,'player',moves.waterGun,{ player:{ dex:130 }, enemy:{ dex:120 } })
    const windup = arenaCastFrame(beam)
    const active = arenaCastFrame(beam,beam.profile.startupMs + 600)
    expect(active.origin).toEqual(windup.origin)
    expect(active.facing).toEqual(windup.facing)
    expect(advance(a,1550).filter(i=>i.hit).length).toBeGreaterThan(2)
  })

  it('keeps an enemy beam aimed at its original launch line when the player switches size and reloads', () => {
    const bounds = { width: 1000, height: 700 }
    const game = createGame('squirtle',1,bounds,1000,19)
    game.campaign.badges = ['brock']
    game.followers.push({ instanceId:'caught-25', speciesId:'onix', level:18, currentHP:35,
      position:{x:400,y:100}, direction:1, state:'IDLE', destination:null, active:true, restMs:0, roamSeed:25 })
    game.campaign.fieldWins = ['field-kanto-ash', 'field-kanto-rocket-duo']
    expect(dispatch(game, { type:'travel', locationId:'cerulean-city' })).toBe(true)
    dispatch(game, { type:'challenge-gym' })
    const a = game.campaign.battle!.arena
    a.player = {x:.38,y:.48}; a.enemy = {x:.53,y:.5}; a.enemyInMs = 0
    tick(game,16,bounds)
    const beam = a.casts.find(c=>c.side==='enemy')!
    const original = { ...beam.target }, previousHeight = beam.victimOffset!.y
    expect(dispatch(game,{type:'arena-switch',instanceId:'caught-25'})).toBe(true)
    expect(beam.victimOffset!.y).not.toBe(previousHeight)
    const restored = hydrateSave(JSON.parse(JSON.stringify(game)),1)!.campaign.battle!.arena.casts[0]
    expect(restored.target).toEqual(original)
    expect(restored.origin).toEqual(beam.origin)
    expect(restored.victimOffset).toEqual(beam.victimOffset)
  })

  it('saves one damage budget and pulse index across pause/reload, including old already spent beams', () => {
    const bounds = { width: 1000, height: 700 }
    const game = createGame('squirtle', 1, bounds, 1000, 19)
    game.player.level = 15
    game.player.moveIds = ['waterGun']
    game.player.currentHP = playerStats(game).hp
    dispatch(game, { type: 'travel', locationId: 'pewter-city' })
    expect(dispatch(game, { type: 'challenge-gym' })).toBe(true)
    const a = game.campaign.battle!.arena
    a.player = { x: .38, y: .5 }; a.enemy = { x: .53, y: .5 }; a.enemyInMs = 5000
    expect(dispatch(game, { type: 'arena-skill', slot: 0 })).toBe(true)
    const c = a.casts[0]
    tick(game, 480, bounds)
    const afterOne = game.wild[0].currentHP
    expect(c.beam!.hits).toBe(1)
    const raw = JSON.parse(JSON.stringify(game))
    const saved = hydrateSave(raw, 1)!
    const savedCast = saved.campaign.battle!.arena.casts[0]
    expect(savedCast.beam).toEqual(c.beam)
    tick(saved, 250, bounds)
    expect(saved.wild[0].currentHP).toBe(afterOne)
    dispatch(saved, { type: 'arena-pause', paused: false })
    for (let i=0; i<12; i++) { tick(game, 80, bounds); tick(saved, 80, bounds) }
    expect(saved.wild[0].currentHP).toBe(game.wild[0].currentHP)
    expect(savedCast.beam!.hits).toBeGreaterThan(1)
    expect(savedCast.beam!.pulses).toBeLessThanOrEqual(beamRounds(savedCast))

    const legacy = raw.campaign.battle.arena.casts[0]
    delete legacy.beam; delete legacy.emitter; delete legacy.victimOffset
    legacy.resolved = true; legacy.result = 'hit'
    const old = hydrateSave(raw, 1)!
    dispatch(old, { type: 'arena-pause', paused: false })
    tick(old, 550, bounds)
    expect(old.wild[0].currentHP).toBe(afterOne)
  })
})
