import { useRef, useState } from 'react'
import { species } from '../game/catalog'
import { isSpeciesMotionSupported } from '../game/motionEligibility'
import { BOX_SIZE, canChangeLead, effectiveLevel, items, levelCap, MAX_PARTY_SIZE, requiredExp, type GameSave, type PartyPokemon } from '../game/engine'
import type { AdventureCommand } from '../preload/contracts'
import { ItemSprite, Pokemon, pokemonName } from './shared'
import { BoxSearch } from './BoxSearch'
import { PokemonCare } from './PokemonCare'
import './party.css'

type Member = Pick<PartyPokemon, 'instanceId' | 'speciesId' | 'level' | 'formId'>

function nameOf(member: Member) {
  return pokemonName(member.speciesId, member.formId)
}

export function Party({ game, busy, send }: {
  game: GameSave; busy: boolean; send: (action: AdventureCommand) => void
}) {
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState('')
  const [swapId, setSwapId] = useState('')
  const boxSelect = useRef<HTMLSelectElement>(null)
  const inspector = useRef<HTMLDivElement>(null)
  const party = [game.player, ...game.followers]
  const totalStored = game.boxes.reduce((count, box) => count + box.filter(Boolean).length, 0)
  const lastBox = game.boxes.at(-1)
  const pageCount = Math.max(1, game.boxes.length + (lastBox?.some(Boolean) ? 1 : 0))
  const pageIndex = Math.min(page, pageCount - 1)
  const box = game.boxes[pageIndex] ?? []
  const occupied = box.filter(Boolean).length
  const selectedSlot = box.findIndex(member => member?.instanceId === selectedId)
  const selected = box[selectedSlot]
  const archived = Boolean(selected && !isSpeciesMotionSupported(selected.speciesId, selected.formId))
  const fullParty = party.length >= MAX_PARTY_SIZE
  const leadLocked = !canChangeLead(game)
  const selectedSwap = party.find(member => member.instanceId === swapId)
  const lockedMessage = '현재 동작이 끝나면 선두를 바꿀 수 있습니다.'

  function showPage(next: number) {
    setPage(next)
    setSelectedId('')
    setSwapId('')
  }

  function deposit(member: Member) {
    setSelectedId(member.instanceId)
    setSwapId('')
    send({ type: 'setFollowerActive', instanceId: member.instanceId, active: false, boxIndex: pageIndex })
    boxSelect.current?.focus()
  }

  return <div className="pokemon-storage">
    <section className="card storage-party" aria-label="내 파티">
      <div className="storage-heading"><h2>내 파티</h2><span>{party.length} / {MAX_PARTY_SIZE}마리</span></div>
      <label className="party-display-setting">탐험 중 표시
        <select aria-label="탐험 중 표시" value={game.settings.showPartyOnDesktop ? 'party' : 'lead'} disabled={busy}
          onChange={event => send({ type: 'settings', settings: { showPartyOnDesktop: event.target.value === 'party' } })}>
          <option value="lead">선두만 표시</option><option value="party">파티 전체 표시</option>
        </select>
      </label>
      <p className="party-rule">탐험 경험치는 선두가 전부, 기절하지 않은 동료가 각각 절반씩 받습니다.</p>
      {leadLocked ? <p className="party-rule" role="status">{lockedMessage}</p>
        : party.length === 1 && <p className="party-rule">마지막 한 마리를 맡기려면 다른 포켓몬을 꺼내거나 박스에서 교체하세요.</p>}
      <ol className="storage-party-list" aria-label="파티 자리">
        {party.map((member, index) => <li key={member.instanceId} data-member={member.instanceId} data-lead={index === 0} className="storage-member">
          <span className="party-position" aria-label={index + 1 + '번 자리'}>{index + 1}</span>
          <Pokemon id={member.speciesId} formId={member.formId} />
          <div className="storage-member-name"><strong>{nameOf(member)}</strong>
            <small>{index === 0 ? '선두 · 배틀' : '동료'} · Lv. {index === 0 ? effectiveLevel(game) : member.level}
              {index === 0 && effectiveLevel(game) < member.level && ' · 기록 Lv. ' + member.level} · {member.level >= levelCap(game) ? '레벨 상한' : (member.exp ?? 0) + ' / ' + requiredExp(member.level) + ' EXP'}</small>
            <PokemonCare game={game} member={member} send={send} busy={busy} />
          </div>
          <div className="storage-member-actions" role="group" aria-label={nameOf(member) + ' 파티 편집'}>
            <button className="small-button order-step" aria-label="위로 이동" title="위로 이동"
              disabled={busy || index === 0 || (index === 1 && leadLocked)}
              onClick={() => send({ type: 'movePartyMember', instanceId: member.instanceId, toIndex: index - 1 })}>↑</button>
            <button className="small-button order-step" aria-label="아래로 이동" title="아래로 이동"
              disabled={busy || index === party.length - 1 || (index === 0 && leadLocked)}
              onClick={() => send({ type: 'movePartyMember', instanceId: member.instanceId, toIndex: index + 1 })}>↓</button>
            <button className="small-button" disabled={busy || occupied === BOX_SIZE || party.length === 1 || (index === 0 && leadLocked)}
              title={occupied === BOX_SIZE ? '빈자리가 있는 박스를 선택하세요.' : '박스 ' + (pageIndex + 1) + '에 맡기기'}
              onClick={() => deposit(member)}>박스에 맡기기</button>
          </div>
        </li>)}
        {Array.from({ length: MAX_PARTY_SIZE - party.length }, (_, index) =>
          <li className="storage-member storage-vacancy" key={'empty-' + index}>빈자리</li>)}
      </ol>
    </section>

    <section className="card storage-box" aria-label="포켓몬 박스">
      <div className="storage-heading"><h2>포켓몬 박스</h2><span>전체 {totalStored.toLocaleString('ko-KR')}마리</span></div>
      <BoxSearch boxes={game.boxes} choose={(boxIndex, instanceId) => {
        setPage(boxIndex)
        setSelectedId(instanceId)
        setSwapId('')
        requestAnimationFrame(() => inspector.current?.focus())
      }} />
      <div className="box-toolbar">
        <div className="box-picker"><button className="small-button" aria-label="이전 박스" disabled={pageIndex === 0} onClick={() => showPage(pageIndex - 1)}>‹</button>
          <select aria-label="박스 선택" ref={boxSelect} value={pageIndex} onChange={e => showPage(Number(e.target.value))}>
            {Array.from({ length: pageCount }, (_, i) => <option key={i} value={i}>박스 {i + 1}</option>)}
          </select>
          <button className="small-button" aria-label="다음 박스" disabled={pageIndex + 1 >= pageCount} onClick={() => showPage(pageIndex + 1)}>›</button>
        </div>
        <span className="box-occupancy" aria-live="polite">{occupied} / {BOX_SIZE}칸</span>
      </div>
      <ol className="box-slots" aria-label={'박스 ' + (pageIndex + 1) + ' 포켓몬'}>
        {Array.from({ length: BOX_SIZE }, (_, i) => {
          const member = box[i]
          const label = member && nameOf(member) + ' · Lv. ' + member.level + (isSpeciesMotionSupported(member.speciesId, member.formId) ? '' : ' · 보관 전용')
          return <li key={i}>{member ? <button className="box-slot" data-member={member.instanceId} aria-pressed={selectedId === member.instanceId}
            aria-label={(i + 1) + '번 칸 · ' + label}
            title={label || undefined} onClick={() => { setSelectedId(member.instanceId); setSwapId('') }}>
            <Pokemon id={member.speciesId} formId={member.formId} /><span>{species[member.speciesId].nameKo}</span>
          </button> : <span className="box-slot box-empty" aria-label={(i + 1) + '번 빈칸'} />}</li>
        })}
      </ol>
      {selected ? <div className="box-inspector" ref={inspector} tabIndex={-1} role="group" aria-label="선택한 포켓몬">
        <div className="storage-selection"><Pokemon id={selected.speciesId} formId={selected.formId} />
          <div><strong>{nameOf(selected)}</strong><small>Lv. {selected.level} · 박스 {pageIndex + 1} · {selectedSlot + 1}번 칸{archived && ' · 전용 모션 미지원 (보관 전용)'}</small></div>
        </div>
        <PokemonCare game={game} member={selected} send={send} boxed busy={busy} />
        <div className="storage-box-actions">
          {selected.heldItemId && <button className="small-button box-held-item" disabled={busy}
            aria-label={items[selected.heldItemId].nameKo + ' 회수'}
            onClick={() => send({ type: 'takeBoxItem', instanceId: selected.instanceId })}>
            <ItemSprite id={selected.heldItemId} />{items[selected.heldItemId].nameKo} 회수
          </button>}
          {!fullParty && <button className="small-button" disabled={busy || archived}
            onClick={() => { send({ type: 'setFollowerActive', instanceId: selected.instanceId, active: true }); boxSelect.current?.focus() }}>파티로 꺼내기</button>}
          <div className="storage-swap">
            <label>교체할 파티 포켓몬<select disabled={archived} value={swapId} onChange={e => setSwapId(e.target.value)}>
              <option value="">포켓몬 선택</option>
              {party.map((member, i) => <option key={member.instanceId} value={member.instanceId} disabled={i === 0 && leadLocked}>
                {i + 1}. {i === 0 ? '선두 · ' : ''}{nameOf(member)} · Lv. {member.level}
              </option>)}
            </select></label>
            <button className="small-button" disabled={busy || archived || !selectedSwap || (selectedSwap === game.player && leadLocked)}
              onClick={() => { send({ type: 'swapBoxPokemon', partyInstanceId: swapId, boxInstanceId: selected.instanceId }); setSelectedId(swapId); setSwapId(''); boxSelect.current?.focus() }}>교체하기</button>
          </div>
        </div>
      </div> : <p className="storage-hint">{occupied === BOX_SIZE ? '이 박스가 가득 찼습니다. 포켓몬을 맡기려면 다른 박스를 선택하세요.' : occupied ? '포켓몬을 선택해 파티로 꺼내거나 파티 동료와 교체하세요.' : '파티가 6마리일 때 잡은 포켓몬은 빈 박스 칸으로 전송됩니다.'}</p>}
    </section>
  </div>
}
