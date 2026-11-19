import { useMemo } from 'react'
import { activeBattleItems, selectedAutoItems, availableEquipment, canUseBattleItem, items, type GameSave } from '../game/engine'
import { shopItemEffect } from '../game/shopItemEffects'
import type { AdventureCommand } from '../preload/contracts'
import { ItemBrowser, ItemEffects, ItemHeading, catalogById } from './ItemBrowser'
import { ItemSprite } from './shared'
import './item-browser.css'

export function ActiveBattleItem({ game }: { game: GameSave }) {
  const active = activeBattleItems(game)
  if (!active.length) return null
  return <div aria-label="적용 중인 배틀 도구">{active.map(item =>
    <p key={item.itemId} className="current-battle-item"><ItemSprite id={item.itemId}/>
      <span>적용 중 · <strong>{items[item.itemId].nameKo}</strong> · {Math.ceil((item.until - game.runtime.clock) / 1000)}초</span></p>)}</div>
}

export function InventoryBag({ game, busy, send }: {
  game: GameSave; busy: boolean; send: (action: AdventureCommand) => void
}) {
  const key = Object.keys(game.inventory).filter(id => game.inventory[id] > 0 && Object.hasOwn(items, id)).join('|')
  const ids = useMemo(() => key ? key.split('|') : [], [key])
  const autoItems = selectedAutoItems(game.settings)
  const all = game.settings.autoUseAllItems
  const wait = Math.max(0, Math.ceil(((game.runtime.itemReadyAt ?? 0) - game.runtime.clock) / 1000))
  function chooseAuto(autoUseItems: string[]) {
    send({ type: 'settings', settings: { autoUseItems } })
  }
  return <section className="card inventory-bag" aria-label="가방 도구">
    <h2>가방</h2>
    <div className="auto-item-setting"><div><strong>자동 배틀 도구</strong>
      <p>{all ? '전체 자동 사용 중' : autoItems.length ? '자동 지정 ' + autoItems.length + '종' : '자동 사용할 도구를 여러 개 지정할 수 있습니다.'} · 장착품과 마지막 1개 보관</p></div>
      {!all && autoItems.length > 0 && <details className="auto-selections"><summary>지정 목록</summary><ul>{autoItems.map(id => <li key={id}>
        <span>{items[id].nameKo + ' · 보유 ' + (game.inventory[id] ?? 0) + '개'}</span>
        <button type="button" className="small-button" disabled={busy} aria-label={items[id].nameKo + ' 자동 지정 해제'}
          onClick={() => chooseAuto(autoItems.filter(entry => entry !== id))}>해제</button></li>)}</ul></details>}
      {!all && autoItems.length > 0 && <button type="button" className="small-button" disabled={busy} aria-label="자동 배틀 도구 해제" onClick={() => chooseAuto([])}>전체 해제</button>}
    </div>
    <ActiveBattleItem game={game}/>
    {wait > 0 && <p className="battle-item-wait">다음 도구 사용까지 {wait}초</p>}
    {!ids.length ? <p className="empty">가방이 비어 있습니다.</p> :
      <ItemBrowser ids={ids} title="가방" pageSize={12}>
        {id => {
          const item = items[id], entry = catalogById.get(id), effect = entry ? shopItemEffect(id) : undefined
          const count = game.inventory[id]
          const held = item.kind === 'equipment'
          const equipped = held && game.player.heldItemId === id
          const assigned = held && availableEquipment(game, id) < 1
          const isBall = entry?.category === 'balls'
          const battleLabel = isBall ? '던지기' : '배틀 사용'
          return <li key={id} data-item-id={id}>
            <span className={'item-icon ' + item.rarity}><ItemSprite id={id}/></span>
            <div className="catalog-item-body"><ItemHeading id={id} count={count}/>
              <ItemEffects id={id}/>
              {effect && <small className="catalog-item-meta">배틀 사용 시 1개 소모</small>}
              {held && <small className="catalog-item-meta">장착 · {item.description !== effect?.description ? item.description :
                effect?.kind === 'heal' ? '치료 도구를 받을 때 HP 회복량이 25% 증가합니다.' : '지닌 동안 배틀 보너스를 계속 적용합니다.'}</small>}
            </div>
            <div className="catalog-item-actions">
              <button type="button" className="small-button" disabled={busy || !canUseBattleItem(game,id)}
                aria-label={item.nameKo + ' ' + battleLabel}
                onClick={() => send({ type: 'useBattleItem', itemId: id, expectedOwned: count })}>{battleLabel}</button>
              {held && <button type="button" className="small-button" disabled={busy || equipped || assigned}
                aria-label={item.nameKo + ' 장착'} onClick={() => send({ type: 'equip', itemId: id })}>
                {equipped ? '장착 중' : assigned ? '동료 사용 중' : '장착'}</button>}
              {effect && <button type="button" className="small-button" disabled={busy || all} aria-pressed={all || autoItems.includes(id)}
                aria-label={item.nameKo + ' 자동 배틀 지정'} onClick={() => chooseAuto(autoItems.includes(id) ? autoItems.filter(entry => entry !== id) : [...autoItems, id])}>
                {all ? '전체 자동 사용 중' : autoItems.includes(id) ? '자동 지정 중' : '자동 지정'}</button>}
              {id === 'swiftBerry' && <button type="button" className="small-button" disabled={busy}
                onClick={() => send({ type: 'useItem', itemId: id })}>이동 강화</button>}
            </div>
          </li>
        }}
      </ItemBrowser>}
  </section>
}
