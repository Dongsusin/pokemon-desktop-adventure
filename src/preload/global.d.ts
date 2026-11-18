import type { AdventureApi } from './contracts'

declare global {
  interface Window {
    adventure: AdventureApi
  }
}

export type {
  AdventureApi,
  AdventureCommand,
  AdventureSnapshot,
  SlotNumber,
  SlotSummary
} from './contracts'
