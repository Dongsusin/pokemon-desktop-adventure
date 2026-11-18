import { hasWildMidnightForm, wildEncounterForm } from '../forms'
import { isSpeciesMotionSupported } from '../motionEligibility'
import { paldeaWildForms } from './paldea-encounters'
import type { KantoEncounter } from './kanto'

interface EncounterForm { formId?: string; weight: number }

function encounterForms(regionId: string, locationId: string, speciesId: string, level: number): readonly EncounterForm[] {
  const paldeaForms = regionId === 'paldea' ? paldeaWildForms(locationId, speciesId, level) : undefined
  if (paldeaForms?.length) return paldeaForms
  const formId = wildEncounterForm(regionId, locationId, speciesId, level, false)
  if (hasWildMidnightForm(regionId, locationId, speciesId)) {
    return [{ formId, weight: 1 }, { formId: 'lycanroc-midnight', weight: 1 }]
  }
  return [{ formId, weight: 1 }]
}

function supportedForm(speciesId: string, formId?: string): boolean {
  // School Form also uses its solo form at low HP and after capture.
  return isSpeciesMotionSupported(speciesId, formId) &&
    (formId !== 'wishiwashi-school' || isSpeciesMotionSupported(speciesId))
}

export function supportedWildForms(regionId: string, locationId: string, speciesId: string, level: number) {
  return encounterForms(regionId, locationId, speciesId, level).filter(form => supportedForm(speciesId, form.formId))
}

export function supportedEncounters<T extends KantoEncounter>(regionId: string, locationId: string, slots: readonly T[]): T[] {
  return slots.flatMap(slot => {
    const forms = encounterForms(regionId, locationId, slot.speciesId, slot.level)
    const allowedWeight = forms.reduce((n, form) => n + (supportedForm(slot.speciesId, form.formId) ? form.weight : 0), 0)
    if (!allowedWeight) return []
    const originalWeight = forms.reduce((n, form) => n + form.weight, 0)
    return [allowedWeight === originalWeight ? slot : { ...slot, weight: slot.weight * allowedWeight / originalWeight }]
  })
}
