import { useState } from 'react'
import { canUseBattleItem, freeItemCopies, isInBattle, items, memberMaxHP, REVIVAL_COST, revivalRemaining, type GameSave, type PartyPokemon, type Player } from '../game/engine'
import { shopItemEffect } from '../game/shopItemEffects'
import type { AdventureCommand } from '../preload/contracts'
import { pokemonName } from './shared'

function revivalTime(ms: number) {
  const seconds = Math.ceil(ms / 1000)
  return Math.floor(seconds / 60) + '분 ' + String(seconds % 60).padStart(2, '0') + '초'
}

export function PokemonCare({ game, member, send, boxed = false, showHP = true, busy = false }: {
  game: GameSave; member: Player | PartyPokemon; send: (command: AdventureCommand) => void
  boxed?: boolean; showHP?: boolean; busy?: boolean
}) {
  const [choice, setChoice] = useState('')
  const down = member.currentHP === 0
  const revivalLocked = down && isInBattle(game)
  const max = memberMaxHP(game, member)
  const name = pokemonName(member.speciesId, member.formId)
  const treatments = !boxed && !revivalLocked && member.currentHP < max ? Object.keys(game.inventory).filter(id =>
    shopItemEffect(id).kind === (down ? 'revive' : 'heal') && freeItemCopies(game, id) > 0) : []
  const id = treatments.includes(choice) ? choice : treatments[0]
  return <div className="pokemon-care">
    {showHP && <small>HP {member.currentHP} / {max}</small>}
    {revivalLocked && <span>기절 · 배틀 종료 후 부활 가능</span>}
    {down && !revivalLocked && <><span>{boxed ? '박스 보관 중 · 부활 시간 정지' : '부활까지'} · {revivalTime(revivalRemaining(member))}</span>
      <button className="small-button" disabled={busy || game.coins < REVIVAL_COST}
        title={'보유 ' + game.coins.toLocaleString('ko-KR') + '코인'} aria-label={name + ' 즉시 부활'}
        onClick={() => send({ type: 'revivePokemon', instanceId: member.instanceId })}>즉시 부활 · {REVIVAL_COST}코인</button></>}
    {id && <><select aria-label={name + ' 치료 도구'} value={id} onChange={e => setChoice(e.target.value)}>
      {treatments.map(itemId => <option key={itemId} value={itemId}>{items[itemId].nameKo} ×{freeItemCopies(game, itemId)}</option>)}
    </select><button className="small-button" disabled={busy || !canUseBattleItem(game, id, member.instanceId)}
      onClick={() => send({ type: 'useBattleItem', itemId: id, expectedOwned: game.inventory[id], targetId: member.instanceId })}>
      {down ? '부활 도구 사용' : '치료하기'}</button></>}
  </div>
}
