import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGame, items, shopStock } from '../src/game/engine'
import { catalogItems } from '../src/game/shopCatalog'
import { InventoryBag } from '../src/renderer/InventoryBag'
import { ItemBrowser, matchItems } from '../src/renderer/ItemBrowser'

afterEach(() => vi.unstubAllGlobals())

describe('expanded shop and battle bag', () => {
  it('matches Korean and English product names through spacing and case differences, category and price order', () => {
    const ids = shopStock.map(offer => offer.itemId)
    expect(matchItems(ids, '몬스 터볼', 'balls')).toContain('pokeball')
    expect(matchItems(ids, 'GREAT BALL', 'balls')).toContain('greatBall')
    expect(matchItems(ids, 'GREAT BALL', 'medicine')).toEqual([])
    expect(matchItems(ids, '드래곤 클로', 'machines')).toContain('tm02')
    expect(matchItems(ids, 'TM 2', 'machines')).toContain('tm02')
    const choices = ['ultraBall', 'pokeball', 'greatBall']
    expect(matchItems(choices, '', 'balls', 'low')).toEqual(['pokeball','greatBall','ultraBall'])
    expect(choices[0]).toBe('ultraBall')
  })

  it('limits the initial list by page and retains navigation for the full catalog', () => {
    const ids = catalogItems.map(item => item.id)
    expect(ids.length).toBeGreaterThan(1000)
    const html = renderToStaticMarkup(<ItemBrowser ids={ids} title="상품" shop>
      {id => <li key={id} data-item-id={id}>{items[id].nameKo}</li>}
    </ItemBrowser>)
    expect(html.match(/data-item-id=/g)).toHaveLength(12)
    expect(html).toContain('aria-label="상품 페이지"')
    expect(html).toContain('높은 가격순')
  })

  it('offers actual supply use in both bags and preserves exhausted automatic supplies in the field', () => {
    vi.stubGlobal('document', { baseURI: 'http://localhost/' })
    const game = createGame('squirtle', 1, {width: 1000, height: 700})
    game.inventory = { pokeball: 2 }
    game.settings.autoUseItem = 'potion'
    const bag = renderToStaticMarkup(<InventoryBag game={game} send={() => {}} busy={false}/>)
    expect(bag).toContain('aria-label="몬스터볼 던지기"')
    expect(bag).toContain('상처약 · 보유 0개')
    expect(bag).toContain('자동 배틀 도구 해제')
    expect(bag).toContain('aria-label="몬스터볼 자동 배틀 지정"')
    expect(bag).toContain('15%')
  })
})
