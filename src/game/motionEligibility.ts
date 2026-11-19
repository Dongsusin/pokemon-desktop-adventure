import catalog from './resonance-motions.json'

import { championsTechniques } from './championsMoves'

const actors: Readonly<Record<string, string>> = catalog.actors
const moves: Readonly<Record<string, string>> = catalog.moves

function actorPose(speciesId: string, formId?: string) {
  if (typeof speciesId !== 'string' || speciesId.includes('/')) return undefined
  const identity = formId === undefined ? speciesId : `${speciesId}/${formId}`
  if (!Object.hasOwn(actors, identity)) return undefined
  return actors[identity]
}

export function isSpeciesMotionSupported(speciesId: string, formId?: string): boolean {
  return actorPose(speciesId, formId) !== undefined
}

export function isMoveMotionAvailable(moveId: string): boolean {
  return Object.hasOwn(moves, moveId) || Object.hasOwn(championsTechniques, moveId)
}

export function isMoveMotionSupported(speciesId: string, formId: string | undefined, moveId: string): boolean {
  const pose = actorPose(speciesId, formId)
  return !!pose && isMoveMotionAvailable(moveId) && ((moves[moveId] ?? championsTechniques[moveId]?.pose) === 'attack' || pose === 'attack+shoot')
}
