import { useEffect, useMemo, useRef, useState } from 'react'
import { collectionGuide, collectionItemHint } from '../game/collectionGuide'
import { canUseCollectionItem } from '../game/engine'
import type { ReactNode } from 'react'
import { species, starterIds, wildIds } from '../game/catalog'
import { isSpeciesMotionSupported } from '../game/motionEligibility'
import { BattleSprite } from './BattleSprite'
import {
  activityLabels, availableEquipment, canEvolve, canThrowBall, canTransferRegion, captureBallIds, defaultSettings,
  currentTrainer, effectiveLevel, evolutionFor, items, levelCap, MAX_PARTY_SIZE, moves, movesFor, playerStats, requiredExp, statsFor
} from '../game/engine'
import type { GameSave, Settings } from '../game/engine'
import type { AdventureCommand, AdventureSnapshot } from '../preload/contracts'
import { ItemSprite, Pokemon, pokemonName, statNames, types, useAdventure } from './shared'
import { Party } from './Party'
import { FriendlyShop } from './FriendlyShop'
import { TrainerArena, BattleResult, type TrainerResult } from './TrainerArena'
import { RegionMap } from './RegionMap'
import { Campaign, TrainerBattleCard, type ChallengeKind } from './Campaign'
import { battleForm, formStats } from '../game/forms'
import { regionOrder, worldRegions } from '../game/regions/world'

const typeClasses = ['grass', 'fire', 'water']
const generationLabels = ['관동', '성도', '호연', '신오', '하나', '칼로스', '알로라', '가라르', '팔데아']
const tabs = ['상태', '지도', '도전', '포켓몬', '파티', '도감', '가방', '전투 기록', '설정'] as const
const modes = ['대기', '걷기', '공격'] as const
const rarityLabels = { common: '일반', uncommon: '고급', rare: '희귀', epic: '영웅' }
const encounterOptions = { cautious: '안전 우선', balanced: '균형', bold: '적극 탐험' }
type Command = (action: AdventureCommand) => void
const dexPageSize = 36
const playableStarters = starterIds.filter(id => isSpeciesMotionSupported(id))
const dexSpecies = wildIds.filter(id => isSpeciesMotionSupported(id)).map(id => species[id])

function TypeTag({ type }: { type: string }) {
  return <span className={'type-tag ' + type}><span aria-hidden="true" />{types[type] || type}</span>
}

const foliage = [
  [9, 59], [13, 79], [19, 66], [25, 83], [31, 55], [37, 88], [45, 65],
  [59, 79], [64, 58], [72, 86], [78, 68], [85, 78], [90, 57], [94, 87]
]

function Habitat({ id, formId, mode = '대기' }: { id: string; formId?: string; mode?: typeof modes[number] }) {
  const pokemon = species[id]
  return <div className={'habitat habitat-' + formStats(id, formId).types[0]}>
    <div className="habitat-top"><span><i /> 미리보기</span><span>#{String(pokemon.pokedexNumber).padStart(3, '0')}</span></div>
    <div className="sun" />
    <div className="distant-hill hill-a" />
    <div className="distant-hill hill-b" />
    <div className="meadow" />
    {foliage.map(([x, y]) => <i className="grass-tuft" style={{ left: x + '%', top: y + '%' }} key={x} />)}
    <div className="habitat-partner">
      <div className="sprite-shadow" />
      <BattleSprite id={pokemon.pokedexNumber} formId={formId} facing={{ x: 0, y: 1 }}
        motion={mode === '공격' ? 'attack' : mode === '걷기' ? 'walk' : 'idle'} loop alt={pokemonName(id, formId)} />
    </div>
  </div>
}

function Header({ snapshot, send, busy }: { snapshot: AdventureSnapshot; send: Command; busy: boolean }) {
  return <header className="header">
    <div className="brand"><span className="brand-icon" aria-hidden="true"><i /></span><div>
      <strong>포켓몬 데스크톱 어드벤처</strong>
      <span>바탕화면 파트너</span>
    </div></div>
    <label className="slot-select">
      <span>저장 슬롯</span>
      <select aria-label="저장 슬롯" disabled={busy} value={snapshot.selectedSlot}
        onChange={e => send({ type: 'selectSlot', slot: Number(e.target.value) as 1 | 2 | 3 })}>
        {snapshot.slots.map(slot => <option key={slot.slot} value={slot.slot}>
          {String(slot.slot).padStart(2, '0')} · {slot.speciesId ? species[slot.speciesId]?.nameKo || '저장됨' : '새 모험'}
        </option>)}
      </select>
    </label>
  </header>
}

function Switch({ label, checked, onChange, note }: { label: string; checked: boolean; onChange: (value: boolean) => void; note?: string }) {
  return <label className="switch-row">
    <span><strong>{label}</strong>{note && <small>{note}</small>}</span>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <i className="toggle" aria-hidden="true" />
  </label>
}

function Stats({ values }: { values: ReturnType<typeof statsFor> }) {
  return <dl className="stats">
    {(Object.keys(statNames) as (keyof typeof statNames)[]).map(key => <div key={key}><dt>{statNames[key]}</dt><dd>{values[key]}</dd></div>)}
  </dl>
}

function Onboarding({ send, busy }: { send: Command; busy: boolean }) {
  const [generation, getGeneration] = useState(0)
  const [type, setType] = useState('')
  const [selected, setSelected] = useState(playableStarters[0])
  const [mode, setMode] = useState<typeof modes[number]>('대기')
  const [autoBattle, setAutoBattle] = useState(true)
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const filtered = (gen: number, element: string) => playableStarters.filter(id =>
    (!gen || species[id].generation === gen) && (!element || species[id].types[0] === element))
  const list = filtered(generation, type)
  const id = list.includes(selected) ? selected : list[0]
  const pokemon = species[id]
  function select(id: string) {
    setSelected(id)
    setMode('대기')
  }
  function updateFilters(gen: number, element: string) {
    getGeneration(gen)
    setType(element)
    const next = filtered(gen, element)
    if (!next.includes(selected)) select(next[0])
  }
  if (!pokemon) return <p className="empty">선택 가능한 파트너가 없습니다.</p>
  const starterRole = pokemon.baseStats.speed >= 65 ? '민첩한 공격형'
    : pokemon.baseStats.defense >= 60 ? '단단한 방어형' : '균형 잡힌 성장형'

  return <>
    <div className="page-heading"><h1>함께할 포켓몬을 고르세요<span>.</span></h1>
      <p>첫 파트너와 태초마을에서 출발합니다. 지도에서 도로를 고르면 야생 포켓몬을 만납니다.</p>
    </div>
    <div className="setup-grid">
      <section className="catalog-panel" aria-label="스타팅 포켓몬">
        <div className="section-heading"><h2>파트너 선택</h2><span>{list.length}종</span></div>
        <div className="filter-row" aria-label="세대 필터">
          <button aria-pressed={generation === 0} onClick={() => updateFilters(0, type)}>전체</button>
          {generationLabels.map((region, i) => <button key={region} aria-label={(i + 1) + '세대 ' + region}
            disabled={!filtered(i + 1, type).length} aria-pressed={generation === i + 1} onClick={() => updateFilters(i + 1, type)}>{i + 1}</button>)}
        </div>
        <div className="filter-row types-filter" aria-label="타입 필터">
          <button aria-pressed={!type} onClick={() => updateFilters(generation, '')}>모든 타입</button>
          {typeClasses.map(element => <button key={element} disabled={!filtered(generation, element).length} aria-pressed={type === element} onClick={() => updateFilters(generation, element)}>
            <TypeTag type={element} />
          </button>)}
        </div>
        <div className="starter-grid" key={generation + '-' + type}>
          {list.map(mon => <button key={mon} className={'starter-card ' + species[mon].types[0]}
            aria-label={species[mon].nameKo + ' 선택'} aria-pressed={id === mon} onClick={() => select(mon)}>
            <span className="starter-number">{species[mon].generation}세대</span>
            <Pokemon id={mon} />
            <strong>{species[mon].nameKo}</strong>
            <span className="starter-type">{types[species[mon].types[0]]}</span>
          </button>)}
        </div>
      </section>
      <section className="preview-panel" aria-label="파트너 미리보기">
        <Habitat id={id} mode={mode} />
        <div className="preview-content">
          <div className="filter-row poses" aria-label="미리보기 동작">
            {modes.map(pose => <button key={pose} aria-pressed={mode === pose} onClick={() => setMode(pose)}>{pose}</button>)}
          </div>
          <div className="partner-title"><h2>{pokemon.nameKo}</h2><TypeTag type={pokemon.types[0]} /></div>
          <p className="subtext">{generationLabels[pokemon.generation - 1]} 지방 · {starterRole} · 시작 Lv. 5</p>
          <Stats values={statsFor(id, 5)} />
          <button className="primary start-button" disabled={busy} onClick={() => send({ type: 'start', speciesId: id, settings, autoBattle })}>
            이 포켓몬으로 시작 <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </div>
    <div className="setup-settings">
      <Switch label="자동 사냥" checked={autoBattle} onChange={setAutoBattle} />
      <Switch label="바탕화면 표시" checked={settings.overlayVisible} onChange={overlayVisible => setSettings({ ...settings, overlayVisible })} />
      <Switch label="효과음" checked={settings.sound} onChange={sound => setSettings({ ...settings, sound })} />
    </div>
  </>
}

function Meter({ label, value, max, limitText = '최대 레벨' }: { label: string; value: number; max: number; limitText?: string }) {
  return <div className={'meter meter-' + label.toLowerCase()}>
    <div><strong>{label}</strong><span>{max ? value + ' / ' + max : limitText}</span></div>
    <progress value={max ? Math.max(0, value) : 1} max={Math.max(1, max)} aria-label={label} />
  </div>
}

function Card({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={'card ' + className}><h2>{title}</h2>{children}</section>
}

function History({ game, limit }: { game: GameSave; limit?: number }) {
  const entries = [...game.history].sort((a, b) => b.at - a.at || b.id - a.id).slice(0, limit)
  return entries.length ? <ol className="history">
    {entries.map(log => <li key={log.id}><i className={'log-dot ' + log.kind} /><span>{log.text}</span>
      <time dateTime={new Date(log.at).toISOString()}>{new Date(log.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</time>
    </li>)}
  </ol> : <p className="empty">모험이 시작되면 여기에 기록됩니다.</p>
}

function CapturePanel({ game, send }: { game: GameSave; send: Command }) {
  const target = game.wild.find(mon => mon.id === game.runtime.targetId)
  if (!target || target.trainerId) return null

  const pokemon = species[target.speciesId]
  return <Card title="야생 포켓몬 포획">
    <div className="capture-target">
      <Pokemon id={pokemon.id} formId={battleForm(target)} />
      <div className="capture-target-details">
        <div><strong>{pokemonName(pokemon.id, battleForm(target))}</strong><span className="level-label">Lv. {target.level}</span></div>
        <Meter label="HP" value={target.currentHP} max={target.maxHP} />
      </div>
    </div>
    <div className="capture-options">
      {captureBallIds.map(id => <button key={id} className="small-button capture-option"
        disabled={!canThrowBall(game, id)} aria-label={items[id].nameKo + ' 던지기'}
        onClick={() => send({ type: 'throwBall', itemId: id })}>
        <ItemSprite id={id} />
        <span><strong>{items[id].nameKo}</strong><small>×{game.inventory[id] ?? 0}</small></span>
      </button>)}
    </div>
    <p className="subtext">상대 HP가 낮을수록 포획 확률이 높아집니다.</p>
  </Card>
}

function Status({ game, send }: { game: GameSave; send: Command }) {
  const { player } = game
  const mon = species[player.speciesId]
  const stats = playerStats(game)
  const level = effectiveLevel(game)
  const cap = levelCap(game)
  const next = evolutionFor(mon.id, player.formId)

  return <div className="dashboard-grid">
    <section className="preview-panel dashboard-partner">
      <Habitat id={mon.id} formId={player.formId} mode={player.state === 'BATTLE' ? '공격' : player.state === 'WANDER' ? '걷기' : '대기'} />
      <div className="preview-content">
        <div className="partner-title"><h2>{pokemonName(mon.id, player.formId)}</h2><span className="level-label">Lv. {level}</span></div>
        <p className="subtext">{activityLabels[player.state]} · 레벨 상한 Lv. {cap}
          {level < player.level && ' · 기록 Lv. ' + player.level}
        </p>
        <Meter label="HP" value={player.currentHP} max={stats.hp} />
        <Meter label="EXP" value={player.exp} max={level < cap ? requiredExp(level) : 0} limitText="레벨 상한 도달" />
        <Switch label="자동 사냥" checked={game.autoBattle} onChange={enabled => send({ type: 'autoBattle', enabled })} />
      </div>
    </section>
    <div className="dashboard-stack">
      <TrainerBattleCard game={game} />
      <CapturePanel game={game} send={send} />
      <Card title="모험 현황">
        <dl className="totals"><div><dt>승리</dt><dd>{game.wins}</dd></div><div><dt>패배</dt><dd>{game.losses}</dd></div><div><dt>코인</dt><dd>{game.coins.toLocaleString('ko-KR')}</dd></div><div><dt>파티</dt><dd>{1 + game.followers.length}/{MAX_PARTY_SIZE}</dd></div></dl>
        {next && <div className="next-evolution"><Pokemon id={next.speciesId} formId={next.formId} /><div><span>다음 진화 · Lv. {next.minLevel}</span><strong>{pokemonName(next.speciesId, next.formId)}</strong></div>
          {canEvolve(game) && !game.settings.autoEvolve && <button className="small-button" onClick={() => send({ type: 'evolve' })}>진화하기</button>}
        </div>}
      </Card>
      <Card title="최근 기록"><History game={game} limit={4} /></Card>
    </div>
  </div>
}

function Partner({ game, send }: { game: GameSave; send: Command }) {
  const { player } = game
  const mon = species[player.speciesId]
  const level = effectiveLevel(game)
  const equip = Object.keys(game.inventory).filter(id => items[id]?.kind === 'equipment' && availableEquipment(game, id) > 0)
  const equippedOptions = [...new Set([...equip, ...(player.heldItemId ? [player.heldItemId] : [])])]
  return <div className="pane-grid">
    <Card title={pokemonName(mon.id, player.formId)}>
      <div className="pokemon-bio"><Pokemon id={mon.id} formId={player.formId} label /><div><strong>Lv. {level}</strong><div className="tag-list">
        {formStats(mon.id, player.formId).types.map(type => <TypeTag key={type} type={type} />)}
      </div></div></div>
      <Stats values={playerStats(game)} />
      <label className="select-field"><strong className="held-item-label">{player.heldItemId && <ItemSprite id={player.heldItemId} />}지닌 물건</strong><select value={player.heldItemId || ''} onChange={e => send({ type: 'equip', itemId: e.target.value || null })}>
        <option value="">미장착</option>
        {equippedOptions.map(id => <option key={id} value={id}>{items[id]?.nameKo}</option>)}
      </select></label>
    </Card>
    <Card title={'기술 · ' + player.moveIds.length + ' / 4'}>
      <ul className="detail-list">{movesFor(mon.id, 100, player.formId).map(move => {
        const equipped = player.moveIds.includes(move.id)
        const locked = move.unlockLevel > level
        const action = equipped ? '해제' : '장착'
        return <li key={move.id}>
          <div>
            <strong>{moves[move.id].nameKo}</strong>
            <small>{move.category === 'healing' ? '회복' : '위력 ' + move.power} · {move.cooldownMs / 1000}초
              {locked && ' · 사용 가능 Lv. ' + move.unlockLevel}
            </small>
          </div>
          {move.id === 'tackle' ? <span className="muted">기본 장착</span>
            : (equipped || !locked) && <button className="small-button" aria-label={move.nameKo + ' ' + action}
              disabled={!equipped && player.moveIds.length >= 4}
              onClick={() => send({ type: 'setMoves', moveIds: equipped
                ? player.moveIds.filter(id => id !== move.id) : [...player.moveIds, move.id] })}>
                {action}
            </button>}
        </li>
      })}</ul>
    </Card>
  </div>
}

function Pokedex({ game }: { game: GameSave }) {
  const [selected, setSelected] = useState('')
  const hints = useMemo(() => selected ? collectionGuide(selected, game.starterSpeciesId) : [], [selected, game.starterSpeciesId])
  const [all, setAll] = useState(false)
  const [query, setQuery] = useState('')
  const [generation, setGeneration] = useState(0)
  const [page, setPage] = useState(0)
  const seen = new Set([...game.pokedexSeen, ...game.pokedexCaught].filter(id => isSpeciesMotionSupported(id)))
  const caught = new Set(game.pokedexCaught)
  const search = query.normalize('NFKC').trim().toLowerCase().replace(/[\s-]/g, '')
  const dexNumber = /^#?\d+$/.test(search) ? Number(search.replace('#', '')) : null
  const entries = dexSpecies.filter(mon =>
    (all || seen.has(mon.id)) && (!generation || mon.generation === generation) &&
    (!search || (dexNumber !== null ? mon.pokedexNumber === dexNumber
      : (mon.nameKo + ' ' + mon.id).replace(/[\s-]/g, '').includes(search))))
  const pageCount = Math.ceil(entries.length / dexPageSize)
  const activePage = Math.min(page, Math.max(0, pageCount - 1))
  const pageStart = activePage * dexPageSize

  return <Card title={'전국도감 · 발견 ' + seen.size.toLocaleString('ko-KR') + ' / ' + dexSpecies.length.toLocaleString('ko-KR')}>
    <div className="dex-toolbar">
      <div className="filter-row">
        <button aria-pressed={!all} onClick={() => { setAll(false); setPage(0) }}>발견한 포켓몬</button>
        <button aria-pressed={all} onClick={() => { setAll(true); setPage(0) }}>전체</button>
      </div>
      <div className="dex-search">
        <input type="search" aria-label="포켓몬 이름이나 도감 번호" placeholder="이름 또는 번호" value={query}
          onChange={e => { setQuery(e.target.value); setPage(0) }} />
        <select aria-label="도감 세대" value={generation} onChange={e => { setGeneration(Number(e.target.value)); setPage(0) }}>
          <option value={0}>모든 세대</option>
          {generationLabels.map((region, i) => <option key={region} value={i + 1}>{i + 1}세대 · {region}</option>)}
        </select>
      </div>
    </div>
    {selected && entries.some(mon => mon.id === selected) && <section className="dex-guide" aria-label="획득 방법">
      <strong>{species[selected].nameKo} 획득 방법</strong>
      <ul>{hints.map(hint => <li key={hint}>{hint}</li>)}</ul>
    </section>}
    {entries.length ? <div className="dex-grid">
      {entries.slice(pageStart, pageStart + dexPageSize).map(mon => <button type="button" key={mon.id} aria-label={mon.nameKo + ' 획득 방법'}
        aria-expanded={selected === mon.id} onClick={() => setSelected(selected === mon.id ? '' : mon.id)}
        className={'dex-tile' + (seen.has(mon.id) ? '' : ' undiscovered')}>
        <span>#{String(mon.pokedexNumber).padStart(4, '0')}</span>
        <Pokemon id={mon.id} />
        <strong>{mon.nameKo}</strong>
        <small>{caught.has(mon.id) ? '보유 기록' : seen.has(mon.id) ? '발견' : '미발견'}</small>
      </button>)}
    </div> : <p className="empty">조건에 맞는 포켓몬이 없습니다.</p>}
    {pageCount > 1 && <nav className="dex-pages" aria-label="도감 페이지">
      <button className="small-button" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}>이전</button>
      <span>{activePage + 1} / {pageCount}</span>
      <button className="small-button" disabled={activePage + 1 === pageCount} onClick={() => setPage(activePage + 1)}>다음</button>
    </nav>}
  </Card>
}

function Bag({ game, send }: { game: GameSave; send: Command }) {
  const inventory = Object.entries(game.inventory).filter(([id, count]) => count > 0 && items[id])
  return <Card title={'가방 · ' + inventory.length + ' / 100'}>
    {inventory.length ? <ul className="detail-list bag-list">{inventory.map(([id, count]) => {
      const item = items[id]
      const ball = captureBallIds.find(ballId => ballId === id)
      const collection = item.kind === 'fossil' || item.kind === 'evolution'
      const equipped = game.player.heldItemId === id
      const inUse = item.kind === 'equipment' && availableEquipment(game, id) <= 0
      return <li key={id}>
        <span className={'item-icon ' + item.rarity}><ItemSprite id={id} /></span>
        <div><strong>{item.nameKo} <span>×{count}</span></strong><small>{collection ? collectionItemHint(id) : item.description}</small></div>
        <span className={'rarity ' + item.rarity}>{rarityLabels[item.rarity]}</span>
        {collection && <button className="small-button" disabled={!canUseCollectionItem(game, id)}
          onClick={() => send({ type: 'useItem', itemId: id })}>{item.kind === 'fossil' ? '복원' : '진화'}</button>}
        {ball && <button className="small-button" disabled={!canThrowBall(game, ball)}
          aria-label={item.nameKo + ' 던지기'} onClick={() => send({ type: 'throwBall', itemId: ball })}>던지기</button>}
        {(item.kind === 'recovery' || item.kind === 'boost' || item.kind === 'equipment') &&
          <button className="small-button" disabled={equipped || inUse} onClick={() => send(item.kind === 'equipment'
            ? { type: 'equip', itemId: id } : { type: 'useItem', itemId: id })}>
            {equipped ? '장착 중' : inUse ? '동료 사용 중' : item.kind === 'equipment' ? '장착' : '사용'}
          </button>}
      </li>
    })}</ul> : <p className="empty">사냥에서 얻은 아이템이 여기에 쌓입니다.</p>}
  </Card>
}

function SettingsPane({ game, snapshot, send }: { game: GameSave; snapshot: AdventureSnapshot; send: Command }) {
  const settings = game.settings
  const change = (update: Partial<Settings>) => send({ type: 'settings', settings: update })
  return <div className="pane-grid">
    <Card title="모험">
      <Switch label="자동 사냥" checked={game.autoBattle} onChange={enabled => send({ type: 'autoBattle', enabled })} />
      <Switch label="자동 회복" checked={settings.autoHeal} onChange={autoHeal => change({ autoHeal })} />
      <Switch label="자동 진화" checked={settings.autoEvolve} onChange={autoEvolve => change({ autoEvolve })} />
      <label className="select-field"><span><strong>자동 포획</strong><small className="field-note">야생 HP 35% 이하에서 조우당 1회</small></span>
        <select aria-label="자동 포획" value={settings.autoCaptureBall ?? ''}
          onChange={e => change({ autoCaptureBall: captureBallIds.find(id => id === e.target.value) ?? null })}>
          <option value="">끄기</option>
          {captureBallIds.map(id => <option value={id} key={id}>{items[id].nameKo}</option>)}
        </select>
      </label>
      <label className="select-field"><strong>탐험 성향</strong><select value={settings.exploration} onChange={e => change({ exploration: e.target.value as Settings['exploration'] })}>
        {Object.entries(encounterOptions).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
      </select></label>
      <label className="select-field"><strong>야생 출현 빈도</strong><select value={settings.spawnRate} onChange={e => change({ spawnRate: Number(e.target.value) })}>
        <option value={0.5}>낮음</option><option value={1}>기본</option><option value={1.5}>높음</option>
      </select></label>
      <Switch label="효과음" checked={settings.sound} onChange={sound => change({ sound })} />
      <Switch label="알림" checked={settings.notifications} onChange={notifications => change({ notifications })} />
      <Switch label="Windows 시작 시 실행" checked={snapshot.launchAtLogin} onChange={enabled => send({ type: 'setLaunchAtLogin', enabled })} />
      <div className="setting-actions"><button className="small-button" onClick={() => send({ type: 'save' })}>지금 저장</button>
        <button className="small-button" onClick={() => send({ type: 'quit' })}>게임 종료</button></div>
    </Card>
    <Card title="바탕화면 표시">
      <Switch label="캐릭터 표시" checked={settings.overlayVisible} onChange={overlayVisible => change({ overlayVisible })} />
      <Switch label="항상 위에 표시" checked={settings.alwaysOnTop} onChange={alwaysOnTop => change({ alwaysOnTop })} />
      <Switch label="전투·포획·아이템·진화 연출" checked={settings.effects} onChange={effects => change({ effects })} />
      <Switch label="간단 상태 표시" checked={settings.hud} onChange={hud => change({ hud })} />
      <label className="select-field"><strong>프레임 속도</strong><select value={settings.fps} onChange={e => change({ fps: Number(e.target.value) as 15 | 30 })}>
        <option value={30}>30 FPS</option><option value={15}>15 FPS · 저전력</option>
      </select></label>
      <label className="select-field"><strong>캐릭터 크기</strong><select value={settings.spriteScale} onChange={e => change({ spriteScale: Number(e.target.value) })}>
        <option value={0.75}>75%</option><option value={1}>100%</option><option value={1.25}>125%</option><option value={1.5}>150%</option><option value={2}>200%</option>
      </select></label>
    </Card>
  </div>
}

function Dashboard({ game, snapshot, send, busy }: { game: GameSave; snapshot: AdventureSnapshot; send: Command; busy: boolean }) {
  const [tab, setTab] = useState<typeof tabs[number]>('상태')
  const [mapFocus, setMapFocus] = useState<string>()
  const region = worldRegions[game.regionId]
  const [result, setResult] = useState<TrainerResult | null>(null)
  const bout = useRef<{ name: string; wins: number; logId: number; speciesId: string; formId?: string } | null>(null)
  const trainerId = game.campaign.battle?.trainerId
  useEffect(() => {
    const trainer = currentTrainer(game)
    if (trainer) {
      bout.current ??= { name: trainer.name, wins: game.wins, logId: game.history[0]?.id ?? 0, speciesId: game.player.speciesId }
      bout.current.speciesId = game.player.speciesId
      bout.current.formId = game.player.formId
    } else if (bout.current) {
      const record = bout.current
      bout.current = null
      const entry = game.history.find(entry => entry.id > record.logId && entry.kind === 'battle')
      setResult({ ...record, message: entry?.text ?? '', practiceResult: entry?.practiceResult,
        won: entry?.practiceResult === 'win' || game.wins > record.wins })
      setTab('도전')
    }
  }, [trainerId, game.player.instanceId, game.player.speciesId, game.player.formId])
  const destinations = regionOrder.filter(id => canTransferRegion(game, id))
  function showMap(locationId?: string) {
    setMapFocus(locationId)
    setTab('지도')
  }
  function begin(kind: ChallengeKind, trainerId?: string) {
    send(kind === 'practice' ? { type: 'practiceGym' } : kind === 'gym' ? { type: 'challengeGym' } : kind === 'finale' ? { type: 'challengeFinale' } : { type: 'challengeLeague', trainerId })
    setTab('도전')
  }

  if (game.campaign.battle) return <TrainerArena key={game.campaign.battle.trainerId} game={game} />
  if (result) return <BattleResult result={result} sound={game.settings.sound} close={() => setResult(null)} />

  return <>
    <div className="page-heading dashboard-heading">
      <div><h1>나의 모험<span>.</span></h1>
        <p>{species[game.player.speciesId].nameKo}와 함께하는 바탕화면 산책 · {' '}
          <button className="dashboard-location" onClick={() => showMap()}>
            {region.locationById[game.locationId]?.name ?? region.name}
          </button>
        </p>
      </div>
      <div className="dashboard-actions">
        {destinations.map(targetId => <button key={targetId} className="primary" disabled={busy} onClick={() => {
          send({ type: 'transferRegion', regionId: targetId })
          showMap()
        }}>{worldRegions[targetId].name}으로 이동</button>)}
        <button className="primary observe-button" onClick={() => send({ type: 'observe' })}>
          바탕화면에서 보기 <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
    <nav className="dashboard-tabs" aria-label="모험 메뉴">
      {tabs.map(name => <button aria-current={name === tab ? 'page' : undefined} key={name} onClick={() => name === '지도' ? showMap() : setTab(name)}>{name}</button>)}
    </nav>
    {tab === '상태' && <Status game={game} send={send} />}
    {tab === '지도' && <RegionMap key={game.regionId + ':' + (mapFocus ?? 'current')} game={game} focus={mapFocus} travel={locationId => send({ type: 'travel', locationId })} busy={busy} begin={begin} />}
    {tab === '도전' && <Campaign game={game} busy={busy} begin={begin} locate={showMap} />}
    {tab === '포켓몬' && <Partner game={game} send={send} />}
    {tab === '파티' && <Party game={game} busy={busy} send={send} />}
    {tab === '도감' && <Pokedex game={game} />}
    {tab === '가방' && <div className="dashboard-stack"><FriendlyShop game={game} busy={busy} buy={send} /><Bag game={game} send={send} /></div>}
    {tab === '전투 기록' && <Card title="전투 기록"><History game={game} /></Card>}
    {tab === '설정' && <SettingsPane game={game} snapshot={snapshot} send={send} />}
  </>
}

export function Control() {
  const { snapshot, error } = useAdventure()
  const [response, setResponse] = useState<AdventureSnapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => { setResponse(null) }, [snapshot])
  const current = response || snapshot
  const send: Command = action => {
    if (busy) return
    setBusy(true)
    setMessage('')
    void window.adventure.dispatch(action).then(next => {
      setResponse(next)
      if (action.type === 'save' && !next.warning) setMessage('저장했습니다.')
      if (action.type === 'buyItem' && !next.warning) setMessage(items[action.itemId].nameKo + ' ' + action.quantity + '개를 가방에 담았습니다.')
    }).catch(() => setMessage('변경 사항을 적용하지 못했습니다.')).finally(() => setBusy(false))
  }

  if (!current) return <div className="loading" role={error ? 'alert' : 'status'}>{error || '모험을 불러오는 중…'}</div>
  return <>
    {!current.game?.campaign.battle && <Header snapshot={current} send={send} busy={busy} />}
    <main className={current.game?.campaign.battle ? 'shell arena-shell' : 'shell'}>
      {(current.warning || message) && <p className="notice" role={current.warning ? 'alert' : 'status'}>{current.warning || message}</p>}
      {current.game
        ? <Dashboard key={current.selectedSlot} game={current.game} snapshot={current} send={send} busy={busy} />
        : <Onboarding key={current.selectedSlot} send={send} busy={busy} />}
    </main>
    <footer><span>{current.game ? '자동 저장 · 슬롯 ' + current.selectedSlot : '스타팅 포켓몬 ' + playableStarters.length + '종'}</span></footer>
  </>
}
