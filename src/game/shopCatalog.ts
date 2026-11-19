import records from './shop-catalog.json'

export const catalogCategoryLabels = {
  balls: '몬스터볼', medicine: '회복·육성', berries: '나무열매', held: '지닌도구',
  evolution: '진화·화석', machines: '기술머신', battle: '배틀 도구', materials: '재료',
  treasures: '보물', key: '중요한 도구', gimmicks: '배틀 기믹', food: '음식·식재료', other: '기타',
} as const
export type ShopCategory = keyof typeof catalogCategoryLabels

export interface CatalogItem {
  id: string
  slug: string
  nameKo: string
  nameEn: string
  category: ShopCategory
  sourceCategory: string
  price: number
  priceSource: string
  description: string
  gameIndex?: number
  pokeApiId?: number
  moveType?: string
  moveId?: string
}

export const catalogItems: readonly CatalogItem[] = records as CatalogItem[]
