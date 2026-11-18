import type { AreaSlots } from './encounterRanges'
import type { LegendaryEncounter } from './kanto'
import { paldeaWildRows } from './paldea-encounter-data'

interface FormChoice {
  formId?: string
  weight: number
}

type EncounterSlot = readonly [speciesId: string, level: number, weight: number]

function addFormWeight(choices: FormChoice[], formId: string | undefined, weight: number) {
  const existing = choices.find(choice => choice.formId === formId)
  if (existing) existing.weight += weight
  else choices.push({ formId, weight })
}

interface FormPool {
  all: FormChoice[]
  byLevel: Map<number, FormChoice[]>
}

const formsByArea = new Map<string, Map<string, FormPool>>()
const slotsByArea: Record<string, EncounterSlot[]> = {}
for (const [id, rows] of Object.entries(paldeaWildRows)) {
  const forms = new Map<string, FormPool>()
  const wild = new Map<string, Map<number, number>>()
  const totalWeight = rows.reduce((sum, row) => sum + row[2], 0)
  const speciesWithForms = new Set(rows.filter(row => row[1]).map(row => row[0]))
  for (const [species, form, weight, ...bounds] of rows) {
    const levels: number[] = []
    for (let i = 0; i < bounds.length; i += 2) {
      for (let level = bounds[i]; level <= bounds[i + 1]; level++) levels.push(level)
    }
    let pool = forms.get(species)
    if (speciesWithForms.has(species) && !pool) {
      pool = { all: [], byLevel: new Map() }
      forms.set(species, pool)
    }
    const formId = form ?? undefined
    if (pool) addFormWeight(pool.all, formId, weight)
    const levelWeights = wild.get(species) ?? new Map<number, number>()
    wild.set(species, levelWeights)
    const perLevel = weight / levels.length
    for (const level of levels) {
      levelWeights.set(level, (levelWeights.get(level) ?? 0) + perLevel)
      if (pool) {
        const choices = pool.byLevel.get(level) ?? []
        addFormWeight(choices, formId, perLevel)
        pool.byLevel.set(level, choices)
      }
    }
  }
  formsByArea.set(id, forms)
  slotsByArea[id] = Array.from(wild).flatMap(([species, weights]) =>
    Array.from(weights, ([level, weight]): EncounterSlot => [species, level, 100 * weight / totalWeight]))
}

export const paldeaEncounterSlots: AreaSlots = slotsByArea

export function paldeaWildForms(id: string, speciesId: string, level?: number): readonly FormChoice[] | undefined {
  const pool = formsByArea.get(id)?.get(speciesId)
  return level === undefined ? pool?.all : pool?.byLevel.get(level)
}

export const paldeaLegendSlots: Readonly<Partial<Record<string, readonly LegendaryEncounter[]>>> = {
  'grasswither-shrine': [{ speciesId: 'wo-chien', level: 60, weight: 1, minBadges: 8 }],
  'icerend-shrine': [{ speciesId: 'chien-pao', level: 60, weight: 1, minBadges: 8 }],
  'groundblight-shrine': [{ speciesId: 'ting-lu', level: 60, weight: 1, minBadges: 8 }],
  'firescourge-shrine': [{ speciesId: 'chi-yu', level: 60, weight: 1, minBadges: 8 }],
  'zero-lab': [{ speciesId: 'koraidon', level: 72, weight: 1, championOnly: true }],
}
