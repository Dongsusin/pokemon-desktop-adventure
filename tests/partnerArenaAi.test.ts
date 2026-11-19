import { describe, expect, it } from 'vitest'
import { arenaSkills, battleGimmickStatus, createGame, dispatch, hydrateSave, moves, playerStats, statsFor, tick, type GameSave } from '../src/game/engine'
import { beginArenaCast } from '../src/game/trainerArena'
import { fieldTrainerById } from '../src/game/regions/fieldTrainers'
import { regionOrder, worldRegions, type RegionId } from '../src/game/regions/world'

const bounds = { width: 1200, height: 760 }
function challenge(region: RegionId = 'kanto', speciesId = 'squirtle') {
  const g = createGame('squirtle', 1, bounds, Date.UTC(2026, 10, 19), 19)
  g.autoBattle = false
  for (const id of regionOrder.slice(0, regionOrder.indexOf(region)))
    g.regionProgress[id] = { champion: true, badges: worldRegions[id].gymTrainers.map(gym => gym.id) }
  g.regionId = region
  g.locationId = worldRegions[region].gymTrainers[0].locationId
  Object.assign(g.player, { speciesId, level: 22, moveIds: ['tackle', 'waterGun', 'waterPulse'] })
  g.player.currentHP = playerStats(g).hp
  return g
}
function until(g: GameSave, ready: () => boolean, frames = 2400) {
  for (let i = 0; i < frames && !ready() && g.campaign.battle; i++) tick(g, 32, bounds)
  expect(ready()).toBe(true)
}
describe('autonomous Resonance trainer battles', () => {
  it('approaches, selects its water attack, and wins a badge from start to settlement with zero battle inputs', () => {
    const g = challenge()
    expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
    const a = g.campaign.battle!.arena, start = a.player.x
    until(g, () => a.casts.some(cast => cast.side === 'player'))
    const cast = a.casts.find(c => c.side === 'player')!
    expect(cast.moveType).toBe('water')
    expect(a.player.x).toBeGreaterThan(start)
    until(g, () => !g.campaign.battle)
    expect(g.campaign.badges).toContain('brock')
    expect(g.wins).toBe(1)
  })

  it.each([['kalos', 'mega'], ['alola', 'z'], ['galar', 'dynamax'], ['paldea', 'tera']] as const)(
    'leaves %s power ready until signalled mid-cast, restores the order, and activates once', (region, kind) => {
      const g = challenge(region, 'blastoise')
      expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
      const a = g.campaign.battle!.arena
      a.player = { x: .40, y: .5 }; a.enemy = { x: .57, y: .5 }
      g.wild[0].currentHP = g.wild[0].maxHP
      until(g, () => a.casts.some(c => c.side === 'player'))
      expect(g.runtime.gimmick?.player).toBeUndefined()
      expect(battleGimmickStatus(g)?.phase).toBe('ready')
      expect(dispatch(g, { type: 'arena-gimmick' })).toBe(true)
      expect(battleGimmickStatus(g)?.phase).toBe('queued')
      expect(dispatch(g, { type: 'arena-gimmick' })).toBe(false)
      const saved = hydrateSave(JSON.parse(JSON.stringify(g)), 1)!
      expect(saved.campaign.battle?.arena.paused).toBe(true)
      expect(battleGimmickStatus(saved)?.phase).toBe('queued')
      dispatch(saved, { type: 'arena-pause', paused: false })
      until(saved, () => saved.runtime.gimmick?.player?.kind === kind)
      expect(dispatch(saved, { type: 'arena-gimmick' })).toBe(false)
      if (kind === 'z' || kind === 'dynamax') {
        until(saved, () => saved.campaign.battle?.arena.casts.some(c => c.side === 'player' && c.gimmick === kind) === true)
        expect(battleGimmickStatus(saved)?.phase).not.toBe('ready')
      }
    })

  it('waits at a saved knockout until the trainer sends a reserve and restores the registered formation', () => {
    const g = challenge(), first = g.player.instanceId
    g.followers.push({ instanceId: 'caught-45', speciesId: 'blastoise', level: 22, currentHP: statsFor('blastoise', 22).hp,
      active: true, position: { ...g.player.position }, direction: 1, state: 'IDLE', restMs: 0, destination: null, roamSeed: 12 })
    expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
    g.player.currentHP = 0
    const saved = hydrateSave(g, 1)!
    expect(saved.campaign.battle!.arena.needsSwitch).toBe(true)
    dispatch(saved, { type: 'arena-pause', paused: false })
    const clock = saved.runtime.clock, hp = saved.wild[0].currentHP
    for (let i = 0; i < 150; i++) tick(saved, 1000, bounds)
    expect(saved.player.instanceId).toBe(first)
    expect(saved.runtime.clock).toBe(clock)
    expect(saved.wild[0].currentHP).toBe(hp)
    expect(saved.campaign.battle!.arena.needsSwitch).toBe(true)
    expect(dispatch(saved, { type: 'arena-switch', instanceId: 'caught-45' })).toBe(true)
    expect(saved.player.instanceId).toBe('caught-45')
    expect(saved.campaign.battle!.arena.participants).toEqual([first, 'caught-45'])
    until(saved, () => !saved.campaign.battle)
    expect(saved.campaign.badges).toContain('brock')
    expect(saved.player.instanceId).toBe(first)
    expect(saved.player.exp).toBe(0)
    expect(saved.followers[0].exp).toBeGreaterThan(0)
  })

  it('keeps the trainer’s lead even at a disadvantage until the trainer orders a switch', () => {
    const g = challenge('johto'), gyms = worldRegions.johto.gymTrainers
    g.campaign.badges = gyms.slice(0, 3).map(gym => gym.id)
    g.locationId = gyms[3].locationId
    g.player.moveIds = ['tackle']
    g.followers.push({ instanceId: 'caught-8', speciesId: 'charmeleon', level: 22, currentHP: 65, moveIds: ['tackle', 'ember'],
      active: true, position: { ...g.player.position }, direction: 1, state: 'IDLE', restMs: 0, destination: null, roamSeed: 7 })
    const lead = g.player.instanceId
    expect(dispatch(g, { type: 'challenge-gym' })).toBe(true)
    const a = g.campaign.battle!.arena
    tick(g, 900, bounds)
    expect(g.player.instanceId).toBe(lead)
    expect(a.participants).toEqual([lead])
    expect(dispatch(g, { type: 'arena-switch', instanceId: 'caught-8' })).toBe(true)
    expect(g.player.instanceId).toBe('caught-8')
    expect(g.followers[0].instanceId).toBe(lead)
    until(g, () => a.casts.some(c => c.side === 'player' && c.moveId === 'ember'))
  })

  it.each(['field', 'league', 'practice'] as const)('fights a %s challenge through settlement without player commands', mode => {
    const g = challenge('kanto', 'blastoise'), region = worldRegions.kanto
    g.campaign.badges = region.gymTrainers.map(gym => gym.id)
    g.player.level = 90
    g.player.currentHP = playerStats(g).hp
    const exp = g.player.exp
    if (mode === 'field') {
      const trainer = fieldTrainerById['field-kanto-rocket-duo']!
      g.locationId = trainer.locationId
      expect(dispatch(g, { type: 'challenge-field-trainer', trainerId: trainer.id })).toBe(true)
    } else if (mode === 'league') {
      g.locationId = region.leagueLocationId
      expect(dispatch(g, { type: 'challenge-league' })).toBe(true)
    } else expect(dispatch(g, { type: 'practice-gym' })).toBe(true)
    const a = g.campaign.battle!.arena
    until(g, () => a.casts.some(c => c.side === 'player'))
    until(g, () => !g.campaign.battle, 10000)
    if (mode === 'field') expect(g.campaign.fieldWins).toContain('field-kanto-rocket-duo')
    else if (mode === 'league') expect(g.campaign.leagueIndex).toBe(1)
    else {
      expect(g.history[0].practiceResult).toBe('win')
      expect(g.player.exp).toBe(exp)
      expect(g.wins).toBe(0)
    }
  })

  it('keeps a stalled battle active until an explicit surrender', () => {
    const g = challenge()
    dispatch(g, { type: 'challenge-gym' })
    const battle = g.campaign.battle!
    battle.fieldAI!.benchHP[1] = 0
    battle.arena.enemyInMs = 180000
    g.player.moveIds = ['recover']
    const progress = { wins: g.wins, losses: g.losses, coins: g.coins }
    for (let i = 0; i < 130; i++) tick(g, 1000, bounds)
    expect(g.campaign.battle).toBe(battle)
    expect(g).toMatchObject(progress)
    expect(dispatch(g, { type: 'arena-surrender' })).toBe(true)
    expect(g.campaign.battle).toBeNull()
    expect(g.wins).toBe(progress.wins)
    expect(g.losses).toBe(progress.losses + 1)
  })

  it('rolls off an incoming attack and pauses on explicit command', () => {
    const g = challenge()
    dispatch(g, { type: 'challenge-gym' })
    const a = g.campaign.battle!.arena
    a.enemy = { x: a.player.x + .10, y: a.player.y }
    a.enemyInMs = 5000
    for (const skill of arenaSkills(g)) g.runtime.cooldowns[skill.move.id] = g.runtime.clock + 3000
    beginArenaCast(a, 'enemy', moves.tackle)
    until(g, () => a.dodgeCharges < 2)
    dispatch(g, { type: 'arena-pause', paused: true })
    const snapshot = JSON.stringify(a)
    tick(g, 600, bounds)
    expect(JSON.stringify(a)).toBe(snapshot)
  })
})
