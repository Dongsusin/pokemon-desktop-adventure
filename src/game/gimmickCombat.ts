import { gimmickMoveName, type BattleGimmick } from './battleGimmicks'
import type { Move } from './engine'

export type GimmickSide = 'player' | 'enemy'

export interface UsedGimmick {
  kind: BattleGimmick
  owner: string
  active: boolean
  remaining?: number
  formId?: string
  teraType?: string
}

export interface EncounterGimmicks {
  targetId: number
  player?: UsedGimmick
  enemy?: UsedGimmick
}

// Resonance v3.0.0 grants one Max strike per battle.
export const MAX_GIMMICK_ACTIONS = 1

export const gimmickLabels: Record<BattleGimmick, string> = {
  mega: '메가진화', z: 'Z기술', dynamax: '다이맥스', tera: '테라스탈',
}

/** A committed attack keeps its native trajectory, motion ID and damage budget. */
export function boostedMove(move: Move, kind?: 'z' | 'dynamax'): Move {
  if (!kind || move.category === 'healing') return move
  const power = kind === 'z' ? Math.max(100, move.power * 2) : Math.max(70, Math.ceil(move.power * 1.5))
  return { ...move, gimmick: kind, nameKo: gimmickMoveName(kind, move.type), power }
}

export function preparedMove(move: Move, used?: UsedGimmick): Move {
  if (!used?.active) return move
  if (used.kind === 'z' && used.teraType === move.type) return boostedMove(move, 'z')
  if (used.kind === 'dynamax' && (used.remaining ?? 0) > 0) return boostedMove(move, 'dynamax')
  return move
}
