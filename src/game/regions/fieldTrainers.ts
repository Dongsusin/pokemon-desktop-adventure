import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import type { RegionId } from './world'
import source from './champions-arena-roster.json'
import { isSpeciesMotionSupported } from '../motionEligibility'
import type { TrainerSet } from '../championsMoves'
import canonicalData from './canonical-field-teams.json'
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
  readonly defaultTeamNumber: number
  readonly arenaTeamCount: number
  readonly sprite: string
  readonly venue: FieldVenue
}

interface ArenaOpponent {
  id: string
  name: string
  tier?: ArenaTier
  origin: string
  teams: readonly (readonly Omit<KantoTrainerMember, 'level'>[])[]
}

const opponents = new Map((source.trainers as readonly ArenaOpponent[]).map(trainer => [trainer.id, trainer]))

const tierLevels: Record<ArenaTier, number> = { D: 15, C: 30, B: 45, A: 65, S: 85 }

function fieldLevel(tier: ArenaTier | undefined, boss = false) {
  return tier && !boss ? tierLevels[tier] : 90
}

interface CanonicalSlot { speciesId: string; formId?: string; moves?: string[]; powers?: TrainerSet['powers'] }
interface CanonicalParty { label: string; source: string; records?: number[]; team: CanonicalSlot[] }
const canonicalParties = canonicalData as Readonly<Record<string, CanonicalParty | undefined>>
const speciesSets = new Map<string, ArenaOpponent['teams'][number][number]>()
for (const opponent of opponents.values()) {
  for (const member of opponent.teams.flat()) speciesSets.set(member.formId ?? member.speciesId, member)
}

function canonicalTeam(party: CanonicalParty, opponent: ArenaOpponent, level: number) {
  const own = opponent.teams.flat()
  return party.team.flatMap(slot => {
    const formId = slot.formId
    if (!isSpeciesMotionSupported(slot.speciesId, formId)) return []
    const match = own.find(m => m.speciesId === slot.speciesId && m.formId === formId)
      ?? speciesSets.get(formId ?? slot.speciesId)
    const plan: TrainerSet = { moves: slot.moves ?? match?.plan?.moves ?? [], role: match?.plan?.role ?? 'balanced',
      ...(slot.powers?.length && { powers: slot.powers }) }
    return [{ speciesId: slot.speciesId, ...(formId && { formId }), ...(match?.abilityId && { abilityId: match.abilityId }), level, plan }]
  })
}

function placeTrainer(region: RegionId, placement: (typeof arenaPlacements)[RegionId][number]): FieldTrainer {
  const [sourceId, locationId, venue, kind, series, existingKey] = placement
  const opponent = opponents.get(sourceId)
  if (!opponent) throw new Error('Unknown Champions Arena opponent: ' + sourceId)
  const teams = opponent.teams.map((team, index) => {
    const level = fieldLevel(opponent.tier, index === 3)
    return team.map(member => ({ ...member, level }))
  })
  const arenaTeamCount = teams.length
  const canonical = canonicalParties[sourceId]
  const story = canonical && canonicalTeam(canonical, opponent, fieldLevel(opponent.tier))
  if (story?.length) teams.push(story)
  const defaultTeamNumber = story?.length ? teams.length : 1
  return {
    id: 'field-' + region + '-' + (existingKey ?? sourceId), sourceId, role: 'field', kind, series,
    sprite: sourceId, venue, locationId, name: opponent.name,
    tier: opponent.tier, origin: opponent.origin, arenaTeamCount, defaultTeamNumber, teams, team: teams[defaultTeamNumber - 1],
  }
}

export const fieldTrainersByRegion = Object.fromEntries<readonly FieldTrainer[]>(
  (Object.keys(arenaPlacements) as RegionId[]).map(id => [id, arenaPlacements[id].map(entry => placeTrainer(id, entry))]),
) as Readonly<Record<RegionId, readonly FieldTrainer[]>>

export const fieldTrainerById: Readonly<Record<string, FieldTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(Object.values(fieldTrainersByRegion).flat().map(trainer => [trainer.id, trainer])), null)

const variantCache = new WeakMap<FieldTrainer, Map<number, FieldTrainer>>()

export function fieldTeamVariant(trainer: FieldTrainer, teamNumber = trainer.defaultTeamNumber, legacyAceLevel?: number): FieldTrainer | undefined {
  if (!Number.isInteger(teamNumber) || teamNumber < 1 || teamNumber > trainer.teams.length) return undefined
  const team = trainer.teams[teamNumber - 1]
  if (trainer.team === team && legacyAceLevel === undefined) return trainer
  let variants = variantCache.get(trainer)
  if (!variants) {
    variants = new Map()
    variantCache.set(trainer, variants)
  }
  const key = teamNumber + (legacyAceLevel ?? 0) * 8
  let variant = variants.get(key)
  if (!variant) {
    const members = legacyAceLevel === undefined ? team : team.map((member, index) => ({ ...member,
      level: Math.max(1, legacyAceLevel - Math.min(3, team.length - 1 - index)) }))
    variant = { ...trainer, team: members }
    variants.set(key, variant)
  }
  return variant
}
