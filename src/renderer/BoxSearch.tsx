import { useState } from 'react'
import { species } from '../game/catalog'
import { BOX_SIZE, items, type PartyPokemon, type PokemonBox } from '../game/engine'
import { formStats } from '../game/forms'
import { isSpeciesMotionSupported } from '../game/motionEligibility'
import { Pokemon, pokemonName, types } from './shared'

interface Filters {
  query: string
  type: string
  held: string
  archived: boolean
}
const initial: Filters = { query: '', type: '', held: '', archived: false }
const equipment = Object.values(items).filter(item => item.kind === 'equipment')
const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[\s.·'’:\-]/g, '')

export function searchBoxes(boxes: PokemonBox[], filters: Filters) {
  const query = normalize(filters.query)
  const dex = /^#?\d+$/.test(query) ? Number(query.replace('#', '')) : undefined
  const matches: { member: PartyPokemon; boxIndex: number; slotIndex: number }[] = []
  boxes.forEach((box, boxIndex) => box.forEach((member, slotIndex) => {
    if (!member) return
    const { speciesId, formId, heldItemId } = member
    if (filters.held && filters.held !== (heldItemId || 'none')) return
    if (filters.archived && isSpeciesMotionSupported(speciesId, formId)) return
    if (filters.type && !formStats(speciesId, formId).types.includes(filters.type)) return
    if (dex !== undefined) {
      if (species[speciesId].pokedexNumber !== dex) return
    } else if (query) {
      const labels = [pokemonName(speciesId, formId), formId || speciesId, heldItemId, heldItemId && items[heldItemId]?.nameKo]
      if (!labels.some(label => label && normalize(label).includes(query))) return
    }
    matches.push({ member, boxIndex, slotIndex })
  }))
  return matches
}

export function BoxSearch({ boxes, choose }: { boxes: PokemonBox[]; choose: (boxIndex: number, instanceId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState(initial)
  const [page, setPage] = useState(0)
  const matches = open ? searchBoxes(boxes, filters) : []
  const pages = Math.ceil(matches.length / BOX_SIZE)
  const active = Math.max(0, Math.min(page, pages - 1))
  function filter(change: Partial<Filters>) {
    setFilters({ ...filters, ...change })
    setPage(0)
  }

  return <div className="box-search">
    <button type="button" className="small-button" aria-expanded={open}
      onClick={() => setOpen(!open)}>전체 박스 검색</button>
    {open && <section aria-label="전체 박스 검색 조건">
      <div className="box-search-filters">
        <label>검색어<input type="search" aria-label="전체 박스 검색어" value={filters.query}
          placeholder="이름, 도감 번호, 지닌 도구" onChange={e => filter({ query: e.target.value })} /></label>
        <label>타입<select aria-label="타입" value={filters.type} onChange={e => filter({ type: e.target.value })}>
          <option value="">모든 타입</option>
          {Object.entries(types).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select></label>
        <label>지닌 도구<select aria-label="지닌 도구" value={filters.held} onChange={e => filter({ held: e.target.value })}>
          <option value="">모든 도구</option><option value="none">지닌 도구 없음</option>
          {equipment.map(item => <option key={item.id} value={item.id}>{item.nameKo}</option>)}
        </select></label>
      </div>
      <div className="box-search-summary">
        <label><input type="checkbox" checked={filters.archived} onChange={e => filter({ archived: e.target.checked })} />보관 전용만</label>
        <span role="status">검색 결과 {matches.length.toLocaleString('ko-KR')}마리</span>
      </div>
      {matches.length ? <ul className="box-search-results" aria-label="박스 검색 결과">
        {matches.slice(active * BOX_SIZE, (active + 1) * BOX_SIZE).map(({ member, boxIndex, slotIndex }) =>
          <li key={member.instanceId}><button type="button" data-member={member.instanceId} onClick={() => {
            choose(boxIndex, member.instanceId)
            setOpen(false)
          }}>
            <Pokemon id={member.speciesId} formId={member.formId} />
            <span><strong>{pokemonName(member.speciesId, member.formId)} · Lv. {member.level}</strong>
              <small>박스 {boxIndex + 1} · {slotIndex + 1}번 칸 · {member.heldItemId ? items[member.heldItemId].nameKo : '지닌 도구 없음'}
                {!isSpeciesMotionSupported(member.speciesId, member.formId) && ' · 보관 전용'}</small>
            </span>
          </button></li>)}
      </ul> : <p className="box-search-empty">조건에 맞는 포켓몬이 없습니다.</p>}
      {pages > 1 && <nav className="box-search-pages" aria-label="박스 검색 결과 페이지">
        <button className="small-button" disabled={active === 0} onClick={() => setPage(active - 1)}>이전</button>
        <span>{active + 1} / {pages}</span>
        <button className="small-button" disabled={active + 1 >= pages} onClick={() => setPage(active + 1)}>다음</button>
      </nav>}
    </section>}
  </div>
}
