import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import type { RegionId } from './world'
import source from './champions-arena-roster.json'
import { arenaPlacements } from './championsArenaPlacements'

export type FieldVenue = 'route' | 'forest' | 'coast' | 'city' | 'hideout' | 'cave' | 'ruins' | 'school' | 'arena' | 'desert' | 'volcano' | 'aether-lab' | 'ship'
export type ArenaTier = 'S' | 'A' | 'B' | 'C' | 'D'

export interface FieldTrainer extends KantoTrainer {
  readonly role: 'field'
  readonly kind: 'rival' | 'ally' | 'villain' | 'trainer'
  readonly series: 'game' | 'anime' | 'both'
  readonly sourceId: string
  readonly origin: string
  readonly tier?: ArenaTier
  readonly teams: readonly (readonly KantoTrainerMember[])[]
  readonly sprite: string
  readonly venue: FieldVenue
  readonly requiredBadges: number
}

interface ArenaOpponent {
  id: string
  name: string
  tier?: ArenaTier
  origin: string
  teams: readonly (readonly Omit<KantoTrainerMember, 'level'>[])[]
}

const opponents = new Map((source.trainers as readonly ArenaOpponent[]).map(trainer => [trainer.id, trainer]))

function regionalTeam(sourceTeam: ArenaOpponent['teams'][number], highestLevel: number): KantoTrainerMember[] {
  return sourceTeam.map((member,index) => ({
    ...member, level: Math.max(1, highestLevel - Math.min(3, sourceTeam.length - 1 - index)),
  }))
}

function placeTrainer(region: RegionId, placement: (typeof arenaPlacements)[RegionId][number]): FieldTrainer {
  const [sourceId, locationId, requiredBadges, highestLevel, venue, kind, series, existingKey] = placement
  const opponent = opponents.get(sourceId)
  if (!opponent) throw new Error('Unknown Champions Arena opponent: ' + sourceId)
  const teams = opponent.teams.map(team => regionalTeam(team, highestLevel))
  return {
    id: 'field-' + region + '-' + (existingKey ?? sourceId), sourceId, role: 'field', kind, series,
    sprite: sourceId, venue, locationId, requiredBadges, name: opponent.name,
    tier: opponent.tier, origin: opponent.origin, teams, team: teams[0],
  }
}

export const fieldTrainersByRegion = Object.fromEntries<readonly FieldTrainer[]>(
  (Object.keys(arenaPlacements) as RegionId[]).map(id => [id, arenaPlacements[id].map(entry => placeTrainer(id, entry))]),
) as Readonly<Record<RegionId, readonly FieldTrainer[]>>

export const fieldTrainerById: Readonly<Record<string, FieldTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(Object.values(fieldTrainersByRegion).flat().map(trainer => [trainer.id, trainer])), null)

const variantCache = new WeakMap<FieldTrainer, Map<number, FieldTrainer>>()

export function fieldTeamVariant(trainer: FieldTrainer, teamNumber = 1): FieldTrainer | undefined {
  if (!Number.isInteger(teamNumber) || teamNumber < 1 || teamNumber > trainer.teams.length) return undefined
  const team = trainer.teams[teamNumber - 1]
  if (trainer.team === team) return trainer
  let variants = variantCache.get(trainer)
  if (!variants) {
    variants = new Map()
    variantCache.set(trainer, variants)
  }
  let variant = variants.get(teamNumber)
  if (!variant) {
    variant = { ...trainer, team }
    variants.set(teamNumber, variant)
  }
  return variant
}
