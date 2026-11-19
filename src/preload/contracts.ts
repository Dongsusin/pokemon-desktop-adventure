import type { BattleItemUse, CaptureBallId, GameAction, GameSave, Settings, ShopPurchase } from '../game/engine'

import type { TrainerAvatar } from '../game/trainerAvatar'
import type { RegionId } from '../game/regions/world'

export type SlotNumber = 1 | 2 | 3

export const SLOTS: readonly SlotNumber[] = [1, 2, 3]

export function isSlot(value: unknown): value is SlotNumber {
  return value === 1 || value === 2 || value === 3
}

export interface SlotSummary {
  slot: SlotNumber
  speciesId: string | null
  level: number | null
  lastSavedAt: string | null
}

export interface AdventureSnapshot {
  game: GameSave | null
  selectedSlot: SlotNumber
  slots: SlotSummary[]
  warning: string | null
  launchAtLogin: boolean
}

export type ArenaInput = Extract<GameAction, { type: `arena-${string}` }>

export type AdventureCommand =
  | ShopPurchase
  | BattleItemUse
  | { type: 'arenaInput'; action: ArenaInput }
  | { type: 'selectSlot'; slot: SlotNumber }
  | { type: 'chooseTrainer'; slot: SlotNumber; avatar: TrainerAvatar }
  | { type: 'start'; speciesId: string; trainerAvatar?: TrainerAvatar; settings?: Partial<Settings>; autoBattle?: boolean }
  | { type: 'settings'; settings: Partial<Settings> }
  | { type: 'autoBattle'; enabled: boolean }
  | { type: 'equip'; itemId: string | null }
  | { type: 'takeBoxItem'; instanceId: string }
  | { type: 'throwBall'; itemId: CaptureBallId }
  | { type: 'setFollowerActive'; instanceId: string; active: boolean; boxIndex?: number }
  | { type: 'movePartyMember'; instanceId: string; toIndex: number }
  | { type: 'swapBoxPokemon'; partyInstanceId: string; boxInstanceId: string }
  | { type: 'travel'; locationId: string }
  | { type: 'transferRegion'; regionId: RegionId }
  | { type: 'challengeGym' }
  | { type: 'challengeFieldTrainer'; trainerId: string; teamNumber?: number }
  | { type: 'practiceGym' }
  | { type: 'challengeFinale' }
  | { type: 'challengeLeague'; trainerId?: string }
  | { type: 'useItem'; itemId: string }
  | { type: 'setMoves'; moveIds: string[] }
  | { type: 'evolve' }
  | { type: 'save' }
  | { type: 'showControl' }
  | { type: 'observe' }
  | { type: 'quit' }
  | { type: 'setLaunchAtLogin'; enabled: boolean }

export interface AdventureApi {
  getSnapshot(): Promise<AdventureSnapshot>
  subscribe(listener: (snapshot: AdventureSnapshot) => void): () => void
  dispatch(command: AdventureCommand): Promise<AdventureSnapshot>
}

export const adventureChannels = {
  getSnapshot: 'adventure:snapshot',
  snapshotChanged: 'adventure:snapshot-changed',
  dispatch: 'adventure:dispatch'
} as const
