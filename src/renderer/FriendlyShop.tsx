import { useState } from 'react'
import { hasShop, items, shopPurchaseLimit, shopStock, type GameSave, type ShopPurchase } from '../game/engine'
import { worldRegions } from '../game/regions/world'
import { ItemSprite } from './shared'

export function FriendlyShop({ game, busy, buy }: {
  game: GameSave
  busy: boolean
  buy: (order: ShopPurchase) => void
}) {
  const [amount, setAmount] = useState('1')
  const quantity = Number(amount)
  const validQuantity = Number.isSafeInteger(quantity) && quantity > 0
  const location = worldRegions[game.regionId].locationById[game.locationId]
  const localProgress = game.regionId === 'alola' ? '시련' : '배지'
  return <details className="card friendly-shop">
    <summary>프렌들리숍 <span>{game.coins.toLocaleString('ko-KR')} 코인</span></summary>
    {hasShop(game) ? <>
      <div className="shop-controls">
        <strong>{location.name}점</strong>
        <label>구매 수량 <input type="number" min={1} step={1} value={amount}
          aria-invalid={!validQuantity} onChange={e => setAmount(e.target.value)} /></label>
      </div>
      {!validQuantity && <p className="empty" role="status">구매 수량을 1 이상의 정수로 입력하세요.</p>}
      <ul className="detail-list shop-products">
        {shopStock.map(offer => {
          const item = items[offer.itemId]
          const owned = game.inventory[item.id] ?? 0
          const locked = game.campaign.badges.length < offer.badges
          const cost = quantity * offer.price
          const total = validQuantity && Number.isSafeInteger(cost) ? cost.toLocaleString('ko-KR') + ' 코인' : '—'
          const canBuy = validQuantity && quantity <= shopPurchaseLimit(game, offer)
          const requirement = locked ? (game.regionId === 'alola' ? localProgress + ' ' + offer.badges + '회 완료' : localProgress + ' ' + offer.badges + '개 필요')
            : validQuantity && cost > game.coins ? '코인 부족' : ''
          return <li key={item.id}>
            <span className={'item-icon ' + item.rarity}><ItemSprite id={item.id} /></span>
            <div><strong>{item.nameKo}</strong>
              <small>개당 {offer.price} 코인 · 보유 {owned.toLocaleString('ko-KR')}개{requirement && ' · ' + requirement}</small>
            </div>
            <button className="small-button" disabled={busy || !canBuy} aria-label={item.nameKo + ' 구매'}
              onClick={() => buy({ type: 'buyItem', itemId: item.id, quantity, expectedOwned: owned })}>구매 · {total}</button>
          </li>
        })}
      </ul>
    </> : <p className="empty">지도에서 마을이나 도시로 이동하면 구매할 수 있습니다.</p>}
  </details>
}
