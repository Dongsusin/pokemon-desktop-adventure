export type EncounterRange = readonly [speciesId: string, minLevel: number, maxLevel: number, weight: number]
type EncounterSlot = readonly [speciesId: string, level: number, weight: number]
export type AreaSlots = Readonly<Partial<Record<string, readonly EncounterSlot[]>>>

function expandRange([speciesId, minLevel, maxLevel, weight]: EncounterRange): EncounterSlot[] {
  const levelCount = maxLevel - minLevel + 1
  return Array.from({ length: levelCount }, (_, offset) => [speciesId, minLevel + offset, weight / levelCount])
}

export function expandEncounterRanges(rangesByArea: Record<string, readonly EncounterRange[]>): AreaSlots {
  return Object.fromEntries(Object.entries(rangesByArea).map(([id, ranges]) => [id, ranges.flatMap(expandRange)]))
}
