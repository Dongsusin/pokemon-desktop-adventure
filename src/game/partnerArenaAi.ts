import { arenaCastFrame, arenaCastTouches, arenaDistance } from './arenaMoves'
import { expectedHit, type TacticalSide } from './championsAi'
import type { arenaSkills, ArenaTactic } from './engine'
import type { TrainerArena } from './trainerArena'

function dodgeDirection(arena: TrainerArena) {
  if (!arena.dodgeCharges || arena.invulnerableMs > 0) return
  const threat = arena.casts.find(cast => cast.side === 'enemy' && !cast.resolved && cast.profile.kind !== 'self'
    && arenaCastTouches(cast, cast.elapsedMs, Math.min(cast.elapsedMs + 260, cast.profile.startupMs + cast.profile.activeMs), arena.player, arena.player))
  if (!threat) return
  const { direction } = arenaCastFrame(threat)
  let x = -direction.y, y = direction.x
  if (threat.profile.kind === 'burst') {
    x = arena.player.x - threat.target.x
    y = arena.player.y - threat.target.y
  } else if (x * (.5 - arena.player.x) + y * (.5 - arena.player.y) < 0) {
    x = -x
    y = -y
  }
  if (Math.abs(x) + Math.abs(y) < .02) y = arena.player.y > .5 ? -1 : 1
  return { x: Math.abs(x) < .015 ? 0 : Math.sign(x), y: Math.abs(y) < .015 ? 0 : Math.sign(y) }
}

type MatchupSides = { ally: TacticalSide; enemy: TacticalSide }

export function planPartner(arena: TrainerArena, getSides: () => MatchupSides,
  getSkills: () => ReturnType<typeof arenaSkills>): ArenaTactic[] {
  if (arena.paused || arena.needsSwitch || arena.maxClash || arena.beamClash || arena.dodgeMs > 0 || arena.casts.some(cast => cast.side === 'player')) return []
  const pressing = arena.noProgressMs >= 10000
  const { ally, enemy } = getSides()
  const distance = arenaDistance(arena.player, arena.enemy)
  const skills = getSkills()
  const ready = skills.map((entry, slot) => {
    const { move, effectiveness, inRange } = entry
    let score = 0
    if (move.category === 'healing') {
      if (!pressing && ally.hp < ally.maxHP * .50) score = 65 + 65 * (1 - ally.hp / ally.maxHP)
    } else if (typeof effectiveness === 'number' && effectiveness > 0) {
      const damage = expectedHit(ally, enemy, move)
      const timeToHit = entry.profile.startupMs + (inRange ? 0 : Math.max(100, (distance - entry.range * .8) * 3500))
      score = (12 + 160 * Math.min(1, damage / enemy.hp)) / (1 + timeToHit / 1600)
      if (entry.profile.kind === 'beam' && arena.casts.some(cast => cast.side === 'enemy' && cast.beam) && effectiveness < 1)
        score *= .45
      if (pressing && entry.profile.kind === 'beam') score *= .45
      if (move.gimmick) score += 200
    }
    return { entry, slot, score, inRange }
  }).filter(({ entry, score }) => entry.unlocked && !entry.gimmickLocked && entry.cooldownMs <= 0 && score > 0)
  const attack = ready.sort((a, b) => b.score - a.score)[0]
  // Meet a threatening beam with a beam where possible. Otherwise roll across the marked trajectory.
  const roll = !pressing && skills.some(skill => skill.unlocked && Number(skill.effectiveness) > 0) && dodgeDirection(arena)
  if (roll && !(attack?.inRange && attack.entry.profile.kind === 'beam' && Number(attack.entry.effectiveness) >= 1 && arena.casts.some(cast => cast.side === 'enemy' && cast.beam)))
    return [{ type: 'arena-move', ...roll }, { type: 'arena-dodge' }]
  if (attack?.inRange) return [{ type: 'arena-move', x: 0, y: 0 }, { type: 'arena-skill', slot: attack.slot }]
  const approach = ready.length > 0 || !skills.some(skill => skill.unlocked && skill.inRange && typeof skill.effectiveness === 'number' && skill.effectiveness > 0)
  const axis = (delta: number) => approach && Math.abs(delta) > .014 ? Math.sign(delta) : 0
  return [{ type: 'arena-move', x: axis(arena.enemy.x - arena.player.x), y: axis(arena.enemy.y - arena.player.y) }]
}
