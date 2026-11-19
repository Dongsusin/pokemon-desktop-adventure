import type { GameSave } from './engine'
import { locationGateRules } from './regions/locationGates'
import { worldRegions } from './regions/world'

export interface LocationAccess {
  unlocked: boolean
  requiredBadges: number
  missingBadges: number
  missingTrainerId?: string
  needsFinale: boolean
}

export function locationAccess(game: Pick<GameSave, 'regionId' | 'campaign'>, locationId: string): LocationAccess {
  const { regionId, campaign } = game
  const places = worldRegions[regionId].locationById
  const rules = locationGateRules[regionId]
  if (!Object.hasOwn(places, locationId) || !Object.hasOwn(rules, locationId)) {
    return { unlocked: false, requiredBadges: 0, missingBadges: 0, needsFinale: false }
  }

  const rule = rules[locationId]
  const requiredBadges = rule.badges ?? 0
  const missingBadges = Math.max(0, requiredBadges - campaign.badges.length)
  const missingTrainerId = rule.trainerId && !campaign.fieldWins?.includes(rule.trainerId)
    ? rule.trainerId : undefined
  const needsFinale = !!places[locationId].afterFinale && !campaign.finaleWon
  return { unlocked: missingBadges === 0 && !missingTrainerId && !needsFinale,
    requiredBadges, missingBadges, missingTrainerId, needsFinale }
}
