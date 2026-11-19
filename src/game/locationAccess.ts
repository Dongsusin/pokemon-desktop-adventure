import type { GameSave } from './engine'
import { locationGateRules } from './regions/locationGates'

export interface LocationAccess {
  unlocked: boolean
  requiredBadges: number
  missingBadges: number
}

export function locationAccess(game: Pick<GameSave, 'regionId' | 'campaign'>, locationId: string): LocationAccess {
  const { regionId, campaign } = game
  const rules = locationGateRules[regionId]
  if (!Object.hasOwn(rules, locationId)) return { unlocked: false, requiredBadges: 0, missingBadges: 0 }
  const requiredBadges = rules[locationId]
  const missingBadges = Math.max(0, requiredBadges - campaign.badges.length)
  return { unlocked: missingBadges === 0, requiredBadges, missingBadges }
}
