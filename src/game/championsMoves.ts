import data from './champions-moves.json'
import type { BattleGimmick } from './battleGimmicks'
import type { Move, Stats } from './engine'

export type TrainerStages = Partial<Record<Exclude<keyof Stats, 'hp'>, number>>
export interface TrainerPower {
  kind: BattleGimmick
  formId?: string
  type?: string
  moveId?: string
  giant?: boolean
}
export interface TrainerSet {
  moves: readonly string[]
  role: 'physical' | 'special' | 'pivot' | 'lead' | 'support' | 'balanced'
  powers?: readonly TrainerPower[]
}

interface Technique extends Pick<Move, 'nameKo' | 'type' | 'category' | 'power'> {
  shape: 'dash' | 'strike' | 'cone' | 'projectile' | 'volley' | 'beam' | 'pulse' | 'area' | 'lob' | 'self'
  pose: 'attack' | 'shoot'
  priority: number
  stages?: TrainerStages
  guard?: boolean
  pivot?: boolean
  drain?: number
  recoil?: number
}

export const championsTechniques: Readonly<Record<string, Technique | undefined>> = data as Record<string, Technique>
export const championsMoves: Readonly<Record<string, Move | undefined>> = Object.fromEntries(
  Object.entries(championsTechniques).map(([id, entry]) => [id, { ...entry!, id, unlockLevel:1, cooldownMs:0 }]),
)
export const damaging = (move: Move) => move.category === 'physical' || move.category === 'special'
