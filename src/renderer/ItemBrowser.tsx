import { useMemo, useState, type ReactNode } from 'react'
import { catalogCategoryLabels, catalogItems, type ShopCategory } from '../game/shopCatalog'
import { shopItemEffect } from '../game/shopItemEffects'
import { items, shopOffer } from '../game/engine'

export const catalogById = new Map(catalogItems.map(item => [item.id, item]))
const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[\s.’'·:_-]/g, '')
const searchNames = new Map(Object.values(items).map(item => {
  const entry = catalogById.get(item.id)
  return [item.id, [item.nameKo, item.id, entry?.nameKo, entry?.nameEn, entry?.slug].filter(Boolean).map(s => normalize(s!))]
}))
const names = new Intl.Collator('ko', { numeric: true })
type Order = 'stock' | 'low' | 'high' | 'name'
const number = (n: number) => n.toLocaleString('ko-KR')

export function matchItems(ids: readonly string[], query: string, category: ShopCategory | '', order: Order = 'stock') {
  const needle = normalize(query.trim())
  const results = ids.filter(id => catalogById.has(id) && (!category || catalogById.get(id)?.category === category) &&
    (!needle || searchNames.get(id)?.some(s => s.includes(needle))))
  if (order === 'name') results.sort((a,b) => names.compare(items[a].nameKo, items[b].nameKo))
  else if (order === 'low' || order === 'high') results.sort((a,b) => ((shopOffer(a)?.price ?? 0) - (shopOffer(b)?.price ?? 0)) * (order === 'low' ? 1 : -1))
  return results
}

export function ItemBrowser({ ids, title, shop = false, pageSize = 12, controls, children }: {
  ids: readonly string[]
  title: string
  shop?: boolean
  pageSize?: number
  controls?: ReactNode
  children: (id: string) => ReactNode
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ShopCategory | ''>('')
  const [order, setOrder] = useState<Order>('stock')
  const [page, setPage] = useState(0)
  const matched = useMemo(() => matchItems(ids, query, category, order), [ids, query, category, order])
  const pages = Math.ceil(matched.length / pageSize)
  const activePage = Math.max(0, Math.min(page, pages - 1))
  return <div className="item-browser">
    <div className="item-browser-filters">
      <label>도구 검색<input type="search" aria-label={title + ' 검색'} value={query} placeholder="한글·영문 도구명"
        onChange={e => { setQuery(e.target.value); setPage(0) }} /></label>
      <label>분류<select aria-label={title + ' 분류'} value={category} onChange={e => { setCategory(e.target.value as ShopCategory | ''); setPage(0) }}>
        <option value="">모든 분류</option>
        {Object.entries(catalogCategoryLabels).filter(([id]) => ids.some(key => catalogById.get(key)?.category === id)).map(([id,label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      {shop && <label>정렬<select aria-label="상품 정렬" value={order} onChange={e => { setOrder(e.target.value as Order); setPage(0) }}>
        <option value="stock">기본 순서</option><option value="low">낮은 가격순</option>
        <option value="high">높은 가격순</option><option value="name">이름순</option>
      </select></label>}
      {controls}
    </div>
    <div className="item-browser-navigation">
      <span role="status">{title} {number(matched.length)}종</span>
      {pages > 1 && <nav aria-label={title + ' 페이지'}>
        <button className="small-button" disabled={!activePage} onClick={() => setPage(activePage - 1)}>이전</button>
        <span>{number(activePage + 1)} / {number(pages)}</span>
        <button className="small-button" disabled={activePage + 1 >= pages} onClick={() => setPage(activePage + 1)}>다음</button>
      </nav>}
    </div>
    {matched.length ? <ul className="catalog-list" aria-label={title + ' 목록'}>
      {matched.slice(activePage * pageSize, (activePage + 1) * pageSize).map(children)}
    </ul> : <p className="empty">조건에 맞는 도구가 없습니다.</p>}
  </div>
}

export function ItemHeading({ id, count }: { id: string; count?: number }) {
  const entry = catalogById.get(id)
  return <div className="catalog-item-title"><strong>{items[id].nameKo}
    {entry?.moveId && ' · ' + entry.description.replace(/^기록된 기술 · /, '')}
    {count !== undefined && <span> ×{number(count)}</span>}</strong>
    {entry && <small>{catalogCategoryLabels[entry.category]}</small>}
  </div>
}

export function ItemEffects({ id, arena = false }: { id: string; arena?: boolean }) {
  if (!catalogById.has(id)) return null
  const effect = shopItemEffect(id)
  if (effect.kind === 'capture') return <p className="item-effects"><b>야생 포획</b>{effect.description}</p>
  if (arena) return <p className="item-effects">{effect.arenaDescription ?? effect.description}</p>
  if (!effect.arenaDescription || effect.arenaDescription === effect.description) return <p className="item-effects"><b>배틀</b>{effect.description}</p>
  return <div className="item-effects"><p><b>야생</b>{effect.description}</p><p><b>트레이너전</b>{effect.arenaDescription}</p></div>
}
