import { useState } from 'react'
import { hasShop, items, shopOffer, shopPurchaseLimit, shopStock, type GameSave, type ShopPurchase } from '../game/engine'
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

export function FriendlyShop({ game, busy, buy }: {
  game: GameSave
  busy: boolean
  buy: (order: ShopPurchase) => void
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('1')
  const quantity = Number(amount)
  const valid = Number.isSafeInteger(quantity) && quantity > 0
  const location = worldRegions[game.regionId].locationById[game.locationId]
  const progress = game.regionId === 'alola' ? '시련' : '배지'
  return <details className="card friendly-shop" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>프렌들리숍 <span>{number(game.coins)} 코인</span></summary>
    {open && (hasShop(game) ? <>
      <div className="shop-controls"><strong>{location.name}점</strong></div>
      <ItemBrowser ids={shelfIds} title="상품" shop controls={<label>구매 수량
        <input type="number" min={1} step={1} value={amount} aria-invalid={!valid}
          onChange={e => setAmount(e.target.value)} /></label>}>
        {id => {
          const item = items[id], entry = catalogById.get(id), offer = shopOffer(id)!
          const owned = game.inventory[id] ?? 0
          const cost = quantity * offer.price
          const validCost = valid && Number.isSafeInteger(cost)
          const locked = game.campaign.badges.length < offer.badges
          const canBuy = validCost && quantity <= shopPurchaseLimit(game, offer)
          const requirement = locked ? progress + ' ' + offer.badges + (game.regionId === 'alola' ? '회 완료' : '개 필요')
            : !validCost ? '수량 확인' : cost > game.coins ? '코인 부족' : !canBuy ? '구매 한도' : ''
          return <li key={id} data-item-id={id}>
            <span className={'item-icon ' + item.rarity}><ItemSprite id={id}/></span>
            <div className="catalog-item-body"><ItemHeading id={id}/>
              <ItemEffects id={id}/>
              <small className="catalog-item-meta">{priceBasis[entry?.priceSource ?? 'desktop'] ?? '작품 판매가'} {number(offer.price)} 코인 · 보유 {number(owned)}개</small>
            </div>
            <div className="catalog-item-actions"><button className="small-button" disabled={busy || !canBuy}
              aria-label={item.nameKo + ' 구매'} onClick={() => buy({ type: 'buyItem', itemId: id, quantity, expectedOwned: owned })}>
              구매 · {validCost ? number(cost) + ' 코인' : '—'}</button>
              {requirement && <small>{requirement}</small>}</div>
          </li>
        }}
      </ItemBrowser>
      {!valid && <p className="empty" role="status">구매 수량을 1 이상의 정수로 입력하세요.</p>}
    </> : <p className="empty">지도에서 마을이나 도시로 이동하면 구매할 수 있습니다.</p>)}
  </details>
}