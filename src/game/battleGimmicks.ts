import megaData from './mega-forms.json'
import type { Stats } from './engine'

export type BattleGimmick = 'mega' | 'z' | 'dynamax' | 'tera'

interface MegaForm {
  base: string
  from: string
  types: string[]
  baseStats: Stats
}

export const megaForms: Readonly<Record<string, MegaForm>> = megaData
const megaByOrigin = new Map<string, string[]>()
for (const [id, form] of Object.entries(megaForms)) {
  const variants = megaByOrigin.get(form.from)
  if (variants) variants.push(id)
  else megaByOrigin.set(form.from, [id])
}

export function megaFormsFor(speciesId: string, formId?: string): readonly string[] {
  const variants = megaByOrigin.get(formId ?? speciesId)
  return variants && megaForms[variants[0]].base === speciesId ? variants : []
}

export function megaFormFor(speciesId: string, formId?: string): string | undefined {
  return megaFormsFor(speciesId, formId)[0]
}

export function regionGimmick(regionId: string): BattleGimmick | undefined {
  switch (regionId) {
    case 'kalos': return 'mega'
    case 'alola': return 'z'
    case 'galar': return 'dynamax'
    case 'paldea': return 'tera'
  }
}

// Type-wide offensive Z and Max moves, Korean names from PokéAPI move_names.csv.
const poweredMoveNames: Record<string, [string, string]> = {
  normal: ['울트라대시어택', '다이어택'],
  fighting: ['전력무쌍격렬권', '다이너클'],
  flying: ['파이널다이브클래시', '다이제트'],
  poison: ['애시드포이즌딜리트', '다이애시드'],
  ground: ['라이징랜드오버', '다이어스'],
  rock: ['월즈엔드폴', '다이록'],
  bug: ['절대포식회전참', '다이웜'],
  ghost: ['무한암야로의유인', '다이할로우'],
  steel: ['초월나선연격', '다이스틸'],
  fire: ['다이내믹풀플레임', '다이번'],
  water: ['슈퍼아쿠아토네이도', '다이스트림'],
  grass: ['블룸샤인엑스트라', '다이그래스'],
  electric: ['스파킹기가볼트', '다이썬더'],
  psychic: ['맥시멈사이브레이커', '다이사이코'],
  ice: ['레이징지오프리즈', '다이아이스'],
  dragon: ['얼티메이트드래곤번', '다이드라군'],
  dark: ['블랙홀이클립스', '다이아크'],
  fairy: ['러블리스타임팩트', '다이페어리'],
}

export function gimmickMoveName(kind: 'z' | 'dynamax', moveType: string): string {
  return poweredMoveNames[moveType]?.[kind === 'z' ? 0 : 1] ?? (kind === 'z' ? 'Z기술' : '다이맥스 기술')
}
