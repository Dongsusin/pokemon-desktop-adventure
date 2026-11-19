import records from './shop-catalog.json'

export const catalogCategoryLabels = {
  balls: '몬스터볼', medicine: '회복 도구', berries: '나무열매', held: '지닌도구',
  key: '중요한 도구', gimmicks: '배틀 기믹',
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
