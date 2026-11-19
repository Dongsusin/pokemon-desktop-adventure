import type { Move, Stats } from './engine'

export function damageWithMultiplier(attackMove: Move, attacker: Stats, defender: Stats, level: number, multiplier: number, variance = 1): number {
  const special = attackMove.category === 'special'
  const offense = special ? attacker.spAttack : attacker.attack
  const defense = special ? defender.spDefense : defender.defense
  const base = Math.max(1, Math.floor((attackMove.power * offense / Math.max(1, defense)) * (1 + level / 50) / 10))
  return multiplier === 0 ? 0 : Math.max(1, Math.floor(base * multiplier * variance))
}
