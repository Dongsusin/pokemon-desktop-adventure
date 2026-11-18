import { species, starterIds, wildIds } from './catalog'
import { collectionItems, itemEvolution } from './collectionItems'
import { eligibleLegends, evolutionFor } from './engine'
import { pokemonForms, formLabel } from './forms'
import { regionOrder, worldLocationById, worldRegions } from './regions/world'

export function collectionItemHint(id: string) {
  const data = collectionItems[id]
  if (!data) return ''
  const site = worldLocationById[data.site].name
  return data.fossil ? site + ' 전리품 · ' + worldLocationById[data.fossil.lab].name + '에서 복원'
    : site + ' 전리품 · 진화할 포켓몬을 선두에 배치'
}

export function collectionGuide(speciesId: string, starter: string): string[] {
  const hints = new Set<string>()
  if (speciesId === starter) hints.add('처음 선택한 파트너')
  else if (starterIds.includes(speciesId)) hints.add('다른 스타팅도 아래 지역에서 포획할 수 있습니다.')
  for (const [id, data] of Object.entries(collectionItems)) {
    if (data.fossil?.speciesId === speciesId) hints.add(data.name + ' · ' + collectionItemHint(id))
  }
  const origins = [...wildIds.map(base => ({ base, formId: undefined as string | undefined })),
    ...Object.entries(pokemonForms).map(([formId, form]) => ({ base: form.base, formId }))]
  for (const { base, formId } of origins) {
    const name = species[base].nameKo + (formId ? ' (' + (formLabel(formId) ?? formId) + ')' : '')
    const level = evolutionFor(base, formId)
    if (level?.speciesId === speciesId) hints.add(name + ' Lv.' + level.minLevel + ' 진화')
    for (const [id, data] of Object.entries(collectionItems)) {
      if (itemEvolution(id, base, formId)?.speciesId === speciesId) {
        hints.add(name + '에게 ' + data.name + ' 사용 · ' + worldLocationById[data.site].name + ' 전리품')
      }
    }
  }
  for (const id of regionOrder) {
    const region = worldRegions[id]
    const ordinary: string[] = []
    for (const place of region.locations) {
      if (place.encounters.some(mon => mon.speciesId === speciesId)) ordinary.push(place.name)
      const label = region.name + ' · ' + place.name
      const visitor = place.visitors?.find(mon => mon.speciesId === speciesId)
      if (visitor) hints.add(label + ' · 지방 리그 우승 후 조사 출현 Lv.' + visitor.level)
      for (const rare of eligibleLegends(place, starter, true).filter(mon => mon.speciesId === speciesId)) {
        const gate = place.afterFinale ? '네모 승리 후 ' : rare.championOnly ? '지방 리그 우승 후 ' :
          rare.minBadges ? '배지 ' + rare.minBadges + '개 획득 후 ' : ''
        hints.add(label + ' · ' + gate + '희귀 조우 Lv.' + rare.level)
      }
    }
    if (ordinary.length) {
      hints.add(region.name + ' · 일반 출현 · ' + ordinary.slice(0, 3).join(', ') +
        (ordinary.length > 3 ? ' 외 ' + (ordinary.length - 3) + '곳' : ''))
    }
  }
  return [...hints]
}
