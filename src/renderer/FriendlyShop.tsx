import { useState } from 'react'
import { freeItemCopies, hasShop, items, salePrice, shopOffer, shopPurchaseLimit, shopStock, type GameSave, type ShopPurchase, type ShopSale } from '../game/engine'
import { worldRegions } from '../game/regions/world'
import { ItemBrowser, ItemEffects, ItemHeading, catalogById } from './ItemBrowser'
import { ItemSprite } from './shared'
import './item-browser.css'

const priceBasis: Record<string, string> = {
  'legends-za': '레전드 Z-A 판매가', 'legends-arceus': '레전드 아르세우스 판매가',
  'scarlet-violet': '스칼렛·바이올렛 판매가', 'ultra-sun-ultra-moon': '울트라썬·울트라문 판매가',
  desktop: '게임 설정가', base: '도구 기준가',
}
const staples = ['pokeball', 'potion', 'greatBall', 'superPotion', 'ultraBall']
const shelfIds = [...new Set([...staples.filter(id => shopOffer(id)), ...shopStock.map(offer => offer.itemId)])]
const number = (value: number) => value.toLocaleString('ko-KR')

export function FriendlyShop({ game, busy, trade }: {
  game: GameSave
  busy: boolean
  trade: (order: ShopPurchase | ShopSale) => void
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('1')
  const [selling, setSelling] = useState(false)
  const verb = selling ? '판매' : '구매'
  const quantity = Number(amount)
  const valid = Number.isSafeInteger(quantity) && quantity > 0
  const location = worldRegions[game.regionId].locationById[game.locationId]
  const progress = game.regionId === 'alola' ? '시련' : '배지'
  return <details className="card friendly-shop" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>프렌들리숍 <span>{number(game.coins)} 코인</span></summary>
    {open && (hasShop(game) ? <>
      <div className="shop-controls"><strong>{location.name}점</strong>
        <div className="filter-row" aria-label="거래 방식">{[false, true].map(sale => <button key={String(sale)} type="button"
          aria-pressed={selling === sale} onClick={() => { setSelling(sale); setAmount('1') }}>{sale ? '팔기' : '사기'}</button>)}</div></div>
      <ItemBrowser key={verb} ids={selling ? Object.keys(game.inventory).filter(id => shopOffer(id)) : shelfIds} title={selling ? '판매 도구' : '상품'} shop controls={<label>{verb} 수량
        <input type="number" min={1} step={1} value={amount} aria-invalid={!valid}
          onChange={e => setAmount(e.target.value)} /></label>}>
        {id => {
          const item = items[id], entry = catalogById.get(id), offer = shopOffer(id)!
          const owned = game.inventory[id] ?? 0
          const price = selling ? salePrice(id) : offer.price
          const limit = selling ? freeItemCopies(game, id) : shopPurchaseLimit(game, offer)
          const cost = quantity * price
          const validCost = valid && Number.isSafeInteger(cost)
          const locked = !selling && game.campaign.badges.length < offer.badges
          const canTrade = validCost && price > 0 && quantity <= limit && (!selling || Number.isSafeInteger(game.coins + cost))
          let requirement = ''
          if (!validCost) requirement = '수량 확인'
          else if (selling && !canTrade) requirement = limit < quantity ? '판매 가능 ' + limit + '개' : '코인 보유 한도'
          else if (locked) requirement = progress + ' ' + offer.badges + (game.regionId === 'alola' ? '회 완료' : '개 필요')
          else if (!selling && !canTrade) requirement = cost > game.coins ? '코인 부족' : '구매 한도'
          return <li key={id} data-item-id={id}>
            <span className={'item-icon ' + item.rarity}><ItemSprite id={id}/></span>
            <div className="catalog-item-body"><ItemHeading id={id}/>
              <ItemEffects id={id}/>
              <small className="catalog-item-meta">{selling ? '개당 판매가' : priceBasis[entry?.priceSource ?? 'desktop'] ?? '작품 판매가'} {number(price)} 코인 · 보유 {number(owned)}개{selling && limit < owned && ' · 장착 중 ' + (owned - limit) + '개'}</small>
            </div>
            <div className="catalog-item-actions"><button className="small-button" disabled={busy || !canTrade}
              aria-label={item.nameKo + ' ' + verb} onClick={() => trade({ type: selling ? 'sellItem' : 'buyItem', itemId: id, quantity, expectedOwned: owned })}>
              {verb} · {validCost ? number(cost) + ' 코인' : '—'}</button>
              {requirement && <small>{requirement}</small>}</div>
          </li>
        }}
      </ItemBrowser>
      {!valid && <p className="empty" role="status">{verb} 수량을 1 이상의 정수로 입력하세요.</p>}
    </> : <p className="empty">지도에서 마을이나 도시로 이동하면 사고팔 수 있습니다.</p>)}
  </details>
}