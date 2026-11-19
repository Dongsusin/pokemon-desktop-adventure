import { useMemo } from 'react'
import { activeBattleItem, availableEquipment, canUseBattleItem, canUseCollectionItem, items, type GameSave } from '../game/engine'
import { collectionItemHint } from '../game/collectionGuide'
import { shopItemEffect } from '../game/shopItemEffects'
import type { AdventureCommand } from '../preload/contracts'
import { ItemBrowser, ItemEffects, ItemHeading, catalogById } from './ItemBrowser'
import { ItemSprite } from './shared'
import './item-browser.css'

export function ActiveBattleItem({ game }: { game: GameSave }) {
  const active = activeBattleItem(game)
  if (!active) return null
  const name = items[active.itemId]?.nameKo
  const seconds = Math.max(0, Math.ceil((active.until - game.runtime.clock) / 1000))
  return <p className="current-battle-item"><ItemSprite id={active.itemId}/><span>적용 중 · <strong>{name}</strong> · {seconds}초</span></p>
}

export function InventoryBag({ game, busy, send }: {
  game: GameSave; busy: boolean; send: (action: AdventureCommand) => void
}) {
  const key = Object.keys(game.inventory).filter(id => game.inventory[id] > 0 && Object.hasOwn(items, id)).join('|')
  const ids = useMemo(() => key ? key.split('|') : [], [key])
  const autoItem = game.settings.autoUseItem
  const wait = Math.max(0, Math.ceil(((game.runtime.itemReadyAt ?? 0) - game.runtime.clock) / 1000))
  function chooseAuto(id: string | null) {
    send({ type: 'settings', settings: { autoUseItem: id } })
  }
  return <section className="card inventory-bag" aria-label="가방 도구">
    <h2>가방</h2>
    <div className="auto-item-setting"><div><strong>자동 배틀 도구</strong>
      <p>{autoItem ? items[autoItem].nameKo + ' · 보유 ' + (game.inventory[autoItem] ?? 0) + '개' : '도구 하나를 지정하면 상황에 맞춰 사용합니다. 볼의 자동 지정은 트레이너전에 적용됩니다.'}</p></div>
      {autoItem && <button type="button" className="small-button" disabled={busy} aria-label="자동 배틀 도구 해제" onClick={() => chooseAuto(null)}>해제</button>}
    </div>
    <ActiveBattleItem game={game}/>
    {wait > 0 && <p className="battle-item-wait">다음 도구 사용까지 {wait}초</p>}
    {!ids.length ? <p className="empty">가방이 비어 있습니다.</p> :
      <ItemBrowser ids={ids} title="가방" pageSize={12}>
        {id => {
          const item = items[id], entry = catalogById.get(id), effect = entry ? shopItemEffect(id) : undefined
          const count = game.inventory[id]
          const collection = item.kind === 'fossil' || item.kind === 'evolution'
          const held = item.kind === 'equipment'
          const equipped = held && game.player.heldItemId === id
          const assigned = held && availableEquipment(game, id) < 1
          const isBall = entry?.category === 'balls'
          const battleLabel = isBall ? '던지기' : '배틀 사용'
          return <li key={id} data-item-id={id}>
            <span className={'item-icon ' + item.rarity}><ItemSprite id={id}/></span>
            <div className="catalog-item-body"><ItemHeading id={id} count={count}/>
              <ItemEffects id={id}/>
              {effect && <small className="catalog-item-meta">{effect.reusable ? '재사용 가능' : '배틀 사용 시 1개 소모'}</small>}
              {collection && <small className="catalog-item-meta">{collectionItemHint(id)}</small>}
              {held && <small className="catalog-item-meta">장착 · {item.description !== effect?.description ? item.description :
                effect?.kind === 'heal' ? '공격을 받으면 8초에 한 번 최대 HP의 1/16을 회복합니다.' : '지닌 동안 배틀 보너스를 계속 적용합니다.'}</small>}
            </div>
            <div className="catalog-item-actions">
              <button type="button" className="small-button" disabled={busy || !canUseBattleItem(game,id)}
                aria-label={item.nameKo + ' ' + battleLabel}
                onClick={() => send({ type: 'useBattleItem', itemId: id, expectedOwned: count })}>{battleLabel}</button>
              {held && <button type="button" className="small-button" disabled={busy || equipped || assigned}
                aria-label={item.nameKo + ' 장착'} onClick={() => send({ type: 'equip', itemId: id })}>
                {equipped ? '장착 중' : assigned ? '동료 사용 중' : '장착'}</button>}
              {collection && <button type="button" className="small-button" disabled={busy || !canUseCollectionItem(game, id)}
                onClick={() => send({ type: 'useItem', itemId: id })}>{item.kind === 'fossil' ? '복원' : '진화'}</button>}
              {effect && <button type="button" className="small-button" disabled={busy} aria-pressed={autoItem === id}
                aria-label={item.nameKo + ' 자동 배틀 지정'} onClick={() => chooseAuto(autoItem === id ? null : id)}>
                {autoItem === id ? '자동 지정 중' : '자동 지정'}</button>}
              {id === 'swiftBerry' && <button type="button" className="small-button" disabled={busy}
                onClick={() => send({ type: 'useItem', itemId: id })}>이동 강화</button>}
            </div>
          </li>
        }}
      </ItemBrowser>}
  </section>
}
