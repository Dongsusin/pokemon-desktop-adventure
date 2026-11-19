import { useEffect, useRef, useState } from 'react'
import { items, type GameSave } from '../game/engine'
import type { AdventureCommand } from '../preload/contracts'
import { InventoryBag } from './InventoryBag'

export function ArenaBag({ game, close, resume }: { game: GameSave; close: () => void; resume: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const panel = dialog.current
    panel?.showModal()
    return () => panel?.close()
  }, [])
  async function use(action: AdventureCommand) {
    if (action.type !== 'useBattleItem' || pending.current) return
    pending.current = true
    setBusy(true)
    setNotice('')
    try {
      const next = await window.adventure.dispatch(action)
      setNotice(next.warning || items[action.itemId].nameKo + ' 사용')
    } catch {
      setNotice('현재 사용할 수 없습니다. 수량과 배틀 상태를 확인하세요.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return <dialog className="arena-bag-dialog" ref={dialog} aria-labelledby="arena-bag-title"
    onCancel={e => { e.preventDefault(); close() }}>
    <header><h2 id="arena-bag-title">배틀 가방</h2>
      <button type="button" className="small-button" onClick={close}>{resume ? '배틀로 돌아가기' : '가방 닫기'} <kbd>Esc</kbd></button></header>
    <div className="arena-bag-scroll"><InventoryBag game={game} busy={busy} arena send={use}/></div>
    {notice && <p className="arena-bag-notice" role="status">{notice}</p>}
  </dialog>
}
