import type { KantoTrainerMember } from './kantoCampaign'

// Generation IX single-type defensive matchups from PokéAPI type_efficacy.csv.
const effectiveness: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fighting: { normal: 2, flying: 0.5, poison: 0.5, rock: 2, bug: 0.5, ghost: 0, steel: 2, psychic: 0.5, ice: 2, dark: 2, fairy: 0.5 },
  flying: { fighting: 2, rock: 0.5, bug: 2, steel: 0.5, grass: 2, electric: 0.5 },
  poison: { poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, grass: 2, fairy: 2 },
  ground: { flying: 0, poison: 2, rock: 2, bug: 0.5, steel: 2, fire: 2, grass: 0.5, electric: 2 },
  rock: { fighting: 0.5, flying: 2, ground: 0.5, bug: 2, steel: 0.5, fire: 2, ice: 2 },
  bug: { fighting: 0.5, flying: 0.5, poison: 0.5, ghost: 0.5, steel: 0.5, fire: 0.5, grass: 2, psychic: 2, dark: 2, fairy: 0.5 },
  ghost: { normal: 0, ghost: 2, psychic: 2, dark: 0.5 },
  steel: { rock: 2, steel: 0.5, fire: 0.5, water: 0.5, electric: 0.5, ice: 2, fairy: 2 },
  fire: { rock: 0.5, bug: 2, steel: 2, fire: 0.5, water: 0.5, grass: 2, ice: 2, dragon: 0.5 },
  water: { ground: 2, rock: 2, fire: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { flying: 0.5, poison: 0.5, ground: 2, rock: 2, bug: 0.5, steel: 0.5, fire: 0.5, water: 2, grass: 0.5, dragon: 0.5 },
  electric: { flying: 2, ground: 0, water: 2, grass: 0.5, electric: 0.5, dragon: 0.5 },
  psychic: { fighting: 2, poison: 2, steel: 0.5, psychic: 0.5, dark: 0 },
  ice: { flying: 2, ground: 2, steel: 0.5, fire: 0.5, water: 0.5, grass: 2, ice: 0.5, dragon: 2 },
  dragon: { steel: 0.5, dragon: 2, fairy: 0 },
  dark: { fighting: 0.5, ghost: 2, psychic: 2, dark: 0.5, fairy: 0.5 },
  fairy: { fighting: 2, poison: 0.5, steel: 0.5, fire: 0.5, dragon: 2, dark: 2 },
}

export function singleTypeEffectiveness(moveType: string, defenderType: string): number {
  return effectiveness[moveType]?.[defenderType] ?? 1
}

export function defensiveAbility(moveType: string, ability?: KantoTrainerMember['abilityId']) {
  if (ability === 'water-absorb' && moveType === 'water') return 'absorb'
  if (ability === 'levitate' && moveType === 'ground') return 'immune'
}

export function typeMultiplier(moveType: string, defenderTypes: readonly string[], ability?: KantoTrainerMember['abilityId']): number {
  if (defensiveAbility(moveType, ability)) return 0
  return defenderTypes.reduce((factor, type) => factor * singleTypeEffectiveness(moveType, type), 1)
}

export function teraAttackMultiplier(moveType: string, originalTypes: readonly string[], attackerTera: string, defenderTera: string, defenderAbility?: KantoTrainerMember['abilityId']): number {
  return teraStabBonus(moveType, originalTypes, attackerTera) * typeMultiplier(moveType, [defenderTera], defenderAbility)
}

export function teraStabBonus(moveType: string, originalTypes: readonly string[], attackerTera: string): number {
  const originalStab = originalTypes.includes(moveType)
  const teraStab = moveType === attackerTera
  return originalStab && teraStab ? 2 : originalStab || teraStab ? 1.5 : 1
}
