import { arenaMoveProfile, fullBeamMultiplier } from './arenaMoves'
import { damageWithMultiplier } from './battleDamage'
import { championsTechniques, damaging, type TrainerSet, type TrainerStages } from './championsMoves'
import type { Move, Stats } from './engine'
import { teraStabBonus, typeMultiplier } from './regions/paldeaTera'
import type { KantoTrainerMember } from './regions/kantoCampaign'

export interface TrainerBattleAI {
  // The active Pokémon's live HP is on the opponent. Null is an untouched reserve.
  benchHP: (number | null)[]
  switchReadyAt: number
  supportReadyAt: number
  guardUntil: number
  stages: TrainerStages
  decideAt: number
  moveId?: string
}

export interface TacticalSide {
  hp: number
  maxHP: number
  stats: Stats
  level: number
  types: readonly string[]
  tera?: string
  ability?: KantoTrainerMember['abilityId']
  moves: Move[]
}

export function expectedHit(attacker: TacticalSide, defender: TacticalSide, move: Move) {
  const matchup = typeMultiplier(move.type, defender.tera ? [defender.tera] : defender.types, defender.ability)
  const stab = attacker.tera ? teraStabBonus(move.type, attacker.types, attacker.tera) : 1
  const damage = damageWithMultiplier(move, attacker.stats, defender.stats, attacker.level, matchup * stab)
  return arenaMoveProfile(move).kind === 'beam' ? damage * fullBeamMultiplier : damage
}

export interface Tactics {
  distance: number
  role: TrainerSet['role']
  supportReady: boolean
  incomingCast?: Move
  stages: TrainerStages
}

export function evaluateMatchup(own: TacticalSide, foe: TacticalSide, context: Tactics) {
  const enemyAttacks = foe.moves.filter(damaging)
  const incoming = Math.max(0, ...enemyAttacks.map(m => expectedHit(foe, own, m)))
  const threat = incoming / Math.max(1, own.hp)
  let best = own.moves[0], bestScore = -Infinity, bestDamage = 0, bestAttack = 0, canFinish = false
  for (const move of own.moves) {
    const p = arenaMoveProfile(move)
    const inRange = p.kind === 'self' || context.distance <= p.range
    const reach = inRange ? 1 : Math.max(.28, 1 - (context.distance - p.range) * 2.6)
    const native = championsTechniques[move.id]
    const damage = damaging(move) ? expectedHit(own, foe, move) : 0
    let score = 0
    if (damaging(move)) {
      const ratio = damage / Math.max(1,foe.maxHP)
      const finish = damage >= foe.hp && inRange
      const swift = 1 / (1 + p.startupMs / 2300)
      score = damage > 0 ? (12 + 125 * Math.min(1,ratio)) * reach * swift : -5
      if (damage > 0 && context.role === move.category) score += 3
      if (native?.pivot && context.role === 'pivot' && damage > 0 && threat >= .35) score += 9
      if (native?.drain && own.hp < own.maxHP * .7) score += Math.min(12, damage * native.drain / own.maxHP * 90)
      if (native?.recoil && own.hp <= Math.min(foe.hp,damage) * native.recoil && !finish) score -= 28
      if (finish) score += 95 * swift
      bestAttack = Math.max(bestAttack,damage)
      canFinish ||= finish && (own.stats.speed >= foe.stats.speed || p.startupMs <= 200)
    } else if (!context.supportReady) continue
    else if (move.category === 'healing') {
      if (own.hp >= own.maxHP * .57 || incoming >= own.hp) continue
      const fraction = Math.min(1 - own.hp / own.maxHP, move.power / 100)
      score = 22 + fraction * 112 + (context.role === 'support' ? 12 : 0)
    } else if (native?.guard) {
      if (!context.incomingCast || expectedHit(foe,own,context.incomingCast) < own.hp * .18) continue
      score = 85 + threat * 15
    } else if (native?.stages) {
      if (threat >= .55 || own.hp < own.maxHP * .46) continue
      const useful = Object.entries(native.stages).some(([key,amount]) => {
        const stat = key as keyof TrainerStages
        if (amount <= 0 || (context.stages[stat] ?? 0) >= 2) return false
        if (stat === 'attack' || stat === 'spAttack') return own.moves.some(m => m.category === (stat === 'attack' ? 'physical' : 'special'))
        if (stat === 'defense' || stat === 'spDefense') return enemyAttacks.some(m => m.category === (stat === 'defense' ? 'physical' : 'special'))
        return own.stats.speed < foe.stats.speed
      })
      if (!useful) continue
      score = 48 - threat * 26 + (context.role === 'lead' || context.role === 'support' ? 9 : 0)
    } else continue
    if (score > bestScore) { best = move; bestScore = score; bestDamage = damage }
  }
  // Like the source game's replacement search, weigh attack pressure, surviving the switch-in and remaining HP.
  const pressure = Math.min(1, bestAttack / Math.max(1,foe.hp))
  const position = 78 * own.hp / own.maxHP + 62 * pressure - 102 * Math.min(1.6, incoming / own.maxHP)
    - (threat >= 1 ? 65 : 0) + (own.stats.speed > foe.stats.speed ? 9 : 0)
  return { move:best, score:bestScore, damage:bestDamage, bestAttack, incoming, threat, canFinish, position }
}

export type Matchup = ReturnType<typeof evaluateMatchup>

export function shouldWithdraw(current: Matchup, reserve: Matchup, lowHP: boolean, pivot: boolean) {
  if (current.canFinish) return false
  const badMatch = current.bestAttack === 0 || current.threat >= .55 || lowHP || pivot ||
    (current.threat >= .25 && reserve.incoming < current.incoming * .55)
  return badMatch && reserve.position > current.position + (current.threat >= 1 || pivot ? 10 : 22)
}

export function powerMerit(kind: 'mega' | 'z' | 'dynamax' | 'tera', base: Matchup, powered: Matchup,
  targetHP: number, hpFraction: number, last: boolean) {
  if (base.canFinish || powered.damage <= 0 || !damaging(powered.move)) return -Infinity
  const gain = (powered.damage - base.damage) / Math.max(1,targetHP)
  const relief = base.threat - powered.threat
  if (!damaging(base.move) && powered.damage < targetHP && relief < .2) return -Infinity
  const urgent = hpFraction < .55 || last
  if (kind === 'z') {
    if (powered.move.gimmick !== 'z' || base.damage >= targetHP) return -Infinity
    return powered.damage >= targetHP || (urgent && gain >= .12) ? 35 + gain * 40 : -Infinity
  }
  if (kind === 'tera') return relief >= .16 || (gain >= .12 && relief > -.2) ? 30 + relief * 60 + gain * 40 : -Infinity
  if (kind === 'mega') return powered.bestAttack > base.bestAttack || relief > .09 || (urgent && powered.bestAttack >= base.bestAttack && gain >= 0)
    ? 25 + relief * 40 + gain * 48 : -Infinity
  if (powered.move.gimmick !== 'dynamax' || base.damage >= targetHP) return -Infinity
  return (urgent || base.threat >= .47 || powered.damage >= targetHP) && gain > 0 ? 20 + relief * 35 + gain * 40 : -Infinity
}
