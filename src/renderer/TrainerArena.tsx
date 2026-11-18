import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { arenaSkills, currentTrainer, effectiveLevel, playerStats, type GameAction, type GameSave, type Position } from '../game/engine'
import { species } from '../game/catalog'
import { battleForm, formStats } from '../game/forms'
import { worldRegions } from '../game/regions/world'
import { Pokemon, pokemonName, types } from './shared'
import { ArenaEffects, moveColors } from './ArenaEffects'
import { ArenaFighter } from './ArenaFighter'
import { nativeBodyStyle } from './NativeMove'
import { ArenaTrainers } from './ArenaTrainers'
import { useMoveSounds } from './useMoveSounds'
import { arenaHeightRatio } from '../game/arenaMoves'
import { battleGroundUrl } from './battleGround'
import './trainer-arena.css'

type Input = Extract<GameAction, { type: `arena-${string}` }>
type Arena = NonNullable<GameSave['campaign']['battle']>['arena']
type Feedback = NonNullable<Arena['feedback']>
const letters = ['Q', 'W', 'E', 'R']
const arrows: Record<string, Position> = {
  ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }
}
const point = (pos: Position): CSSProperties => ({ left: pos.x * 100 + '%', top: pos.y * 100 + '%' })
const duration = (ms: number) => (Math.ceil(ms / 100) / 10).toFixed(1) + '초'

function Health({ id, formId, level, hp, max, rival, remaining }: {
  id: string; formId?: string; level: number; hp: number; max: number; rival?: boolean; remaining: boolean[]
}) {
  const ratio = Math.max(0,Math.min(1,hp/Math.max(1,max)))
  return <div className={'ring-health ' + (rival ? 'rival' : 'ally')}>
    <div className="ring-portrait"><Pokemon id={id} formId={formId}/></div>
    <div className="ring-health-body">
      <div className="ring-health-heading"><strong>{pokemonName(id,formId)}</strong><small>Lv.{level}</small>
        <span className="ring-reserves" aria-label={'남은 포켓몬 ' + remaining.filter(Boolean).length + '마리'}>
          {remaining.map((available,index)=><i key={index} className={available ? '' : 'down'}/>)}</span>
      </div>
      <div className="ring-hp-row"><span className="ring-hp-track" role="progressbar" aria-label={(rival ? '상대' : '내 포켓몬') + ' HP'}
        aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}>
        <i style={{ width: ratio * 100 + '%', backgroundColor: ratio <= .22 ? '#e66360' : ratio <= .5 ? '#f8be51' : undefined }}/>
      </span><span className="ring-hp-number">{hp}/{max}</span></div>
    </div>
  </div>
}

function Impact({ feedback, pos }: { feedback: Feedback; pos: Position }) {
  const [at] = useState(() => ({ ...(feedback.position ?? pos) }))
  const message = feedback.kind === 'hit' ? feedback.amount ?? '명중' : feedback.kind === 'heal' ? '+' + (feedback.amount ?? '회복') :
    feedback.kind === 'dodge' ? '회피' : feedback.kind === 'miss' ? '빗나감' : '출전'
  if (feedback.kind.startsWith('clash-')) return null
  return <div className={'ring-impact ' + feedback.kind} data-impact-id={feedback.id} style={point(at)} aria-hidden="true">
    {feedback.kind === 'hit' && <i/>}<b>{message}</b>
  </div>
}

export function TrainerArena({ game }: { game: GameSave }) {
  const battle = game.campaign.battle!
  const arena = battle.arena
  const trainer = currentTrainer(game)!
  const foe = game.wild.find(mon => mon.trainerId === trainer.id && mon.id === game.runtime.targetId)
  const region = worldRegions[game.regionId]
  const player = game.player
  const skills = arenaSkills(game)
  const maxHP = playerStats(game).hp
  const members = new Map([player, ...game.followers].map(mon => [mon.instanceId, mon]))
  const roster = arena.partyOrder.map(id => members.get(id)).filter(mon => !!mon)
  const [goal, setGoal] = useState<Position | null>(null)
  const [rangeSlot, setRangeSlot] = useState<number | null>(null)
  const [hint, setHint] = useState('')
  const [confirmExit, setConfirmExit] = useState(false)
  const keys = useRef(new Set<string>())
  const sent = useRef<Position>({ x: 0, y: 0 })
  const surface = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  const isPlaying = !arena.paused && !arena.needsSwitch
  const feedback = arena.feedback
  useMoveSounds(arena.casts, game.settings.sound, isPlaying)
  useBattleSound(game.settings.sound && !feedback?.moveId, feedback?.id, feedback ? feedback.kind === 'heal' ? 560 : feedback.kind === 'hit' ? feedback.actor === 'enemy' ? 180 : 330 : 465 : 0, feedback?.actor === 'enemy' ? .82 : 1.28)

  function input(action: Input) {
    void window.adventure.dispatch({ type: 'arenaInput', action }).catch(() => {
      if (mounted.current) setHint('현재 전투 상태에서 사용할 수 없습니다.')
    })
  }
  function direction(x: number, y: number) {
    if (x !== sent.current.x || y !== sent.current.y) {
      sent.current = { x, y }
      input({ type: 'arena-move', x, y })
    }
  }
  function stop() {
    keys.current.clear()
    setGoal(null)
    direction(0, 0)
  }
  function pause(paused: boolean) {
    stop()
    setConfirmExit(false)
    setHint('')
    input({ type: 'arena-pause', paused })
  }
  function walkKeys() {
    let x = 0, y = 0
    for (const code of keys.current) { x += arrows[code].x; y += arrows[code].y }
    direction(Math.sign(x), Math.sign(y))
  }
  function skill(slot: number) {
    if (!isPlaying) return
    const item = skills[slot]
    setRangeSlot(slot)
    if (!item || !item.unlocked) { setHint('이 자리에 사용할 수 있는 기술이 없습니다.'); return }
    if (item.cooldownMs > 0 || arena.skillLockMs > 0) { setHint('기술을 준비하고 있습니다.'); return }
    if (item.move.category === 'healing' && player.currentHP >= maxHP) { setHint('이미 체력이 가득 찼습니다.'); return }
    setHint('')
    input({ type: 'arena-skill', slot })
  }
  function changeMember(index: number) {
    const next = roster[index]
    if (!next || next.instanceId === player.instanceId || next.currentHP <= 0 || (arena.paused && !arena.needsSwitch)) return
    if (!arena.needsSwitch && arena.switchCooldownMs > 0) return
    stop()
    setHint('')
    setRangeSlot(null)
    input({ type: 'arena-switch', instanceId: next.instanceId })
  }
  function dodge() {
    if (isPlaying && arena.dodgeCharges > 0 && arena.dodgeMs <= 0 && arena.invulnerableMs <= 0) { setHint(''); input({ type: 'arena-dodge' }) }
  }

  const events = useRef({ down: (_e: KeyboardEvent) => {}, up: (_e: KeyboardEvent) => {}, suspend: () => {} })
  events.current = {
    down: (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return
      const code = e.code
      if (code === 'Escape') { e.preventDefault(); if (!e.repeat) pause(!arena.paused); return }
      if (Object.hasOwn(arrows, code)) {
        if (!isPlaying) return
        e.preventDefault()
        if (!keys.current.has(code)) { keys.current.add(code); setGoal(null); walkKeys() }
        return
      }
      if (e.repeat) return
      if (/^(Digit|Numpad)[1-6]$/.test(code)) { e.preventDefault(); changeMember(Number(code.at(-1)) - 1); return }
      if (!isPlaying) return
      const slot = letters.indexOf(code.replace('Key', ''))
      if (slot >= 0) { e.preventDefault(); skill(slot) }
      else if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') {
        e.preventDefault()
        dodge()
      }
    },
    up: (e) => {
      if (keys.current.delete(e.code)) { e.preventDefault(); walkKeys() }
    },
    suspend: () => { stop(); if (!arena.paused) pause(true) }
  }
  useEffect(() => {
    mounted.current = true
    surface.current?.focus({ preventScroll: true })
    const down = (e: KeyboardEvent) => events.current.down(e)
    const up = (e: KeyboardEvent) => events.current.up(e)
    const suspend = () => events.current.suspend()
    const visibility = () => { if (document.hidden) suspend() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', suspend)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      mounted.current = false
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', suspend)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  useEffect(() => {
    if (!isPlaying) { keys.current.clear(); sent.current = { x: 0, y: 0 }; setGoal(null); return }
    if (!goal || keys.current.size) return
    const x = goal.x - arena.player.x, y = (goal.y - arena.player.y) * arenaHeightRatio
    const dx = Math.abs(x) < .026 ? 0 : Math.sign(x), dy = Math.abs(y) < .026 ? 0 : Math.sign(y)
    direction(dx, dy)
    if (!dx && !dy) setGoal(null)
  }, [goal, isPlaying, arena.player.x, arena.player.y])
  useEffect(() => {
    if (!hint) return
    const timer = window.setTimeout(() => setHint(''), 2200)
    return () => window.clearTimeout(timer)
  }, [hint])
  function pointAndWalk(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isPlaying) return
    if (event.pointerType === 'mouse' && !event.altKey && (event.button === 0 || event.button === 2)) {
      event.preventDefault()
      skill(event.button === 0 ? 0 : 1)
      event.currentTarget.focus({ preventScroll: true })
      return
    }
    if (event.button !== 0) return
    const rect = (world.current ?? event.currentTarget).getBoundingClientRect()
    keys.current.clear()
    setGoal({ x: Math.max(.055, Math.min(.945, (event.clientX - rect.left) / rect.width)),
      y: Math.max(.09, Math.min(.91, (event.clientY - rect.top) / rect.height)) })
    event.currentTarget.focus({ preventScroll: true })
  }

  const actorSpan = Math.max(Math.abs(arena.player.x-arena.enemy.x),Math.abs(arena.player.y-arena.enemy.y))
  const zoom = Math.min(1.48, Math.max(1, 1.62 - actorSpan * 1.05))
  const crop = (a: number, b: number) => Math.max(0,Math.min(1-1/zoom,(a+b)/2-.5/zoom))
  const cx = crop(arena.player.x,arena.enemy.x), cy = crop(arena.player.y,arena.enemy.y)
  const camera = 'scale('+zoom+') translate('+(-cx*100)+'%, '+(-cy*100)+'%)'
  const label = trainer.cupRound ?? (trainer.trialKind === 'totem' ? '시련' : trainer.trialKind === 'kahuna' ? '큰 시련'
    : trainer.role === 'gym' ? '체육관전' : trainer.role === 'champion' ? '챔피언전' : '사천왕전')
  const foeMember = trainer.team[battle.opponentIndex]
  const opponentId = foe?.speciesId ?? foeMember.speciesId
  const opponentForm = foe ? battleForm(foe) : foeMember.formId
  const range = rangeSlot === null ? undefined : skills[rangeSlot]
  const playerType = formStats(player.speciesId, player.formId).types[0]
  const terrain = trainer.type ?? (trainer.role === 'champion' ? 'champion' : 'normal')
  const preview = range?.unlocked && isPlaying ? range.preview : undefined
  const ground = battleGroundUrl(trainer.locationId, terrain, trainer.role !== 'gym')
  const location = region.locationById[trainer.locationId].name
  const special = foe?.teraType ? types[foe.teraType] + ' 테라스탈'
    : foe?.maxActionsLeft ? (foe.dynamax === 'gigantamax' ? '거다이맥스' : '다이맥스') + ' · 남은 ' + Math.ceil(foe.maxActionsLeft / 2) + '턴'
    : trainer.totemAura ? '주인 포켓몬의 오라' : ''
  return <section className="trainer-arena" aria-label="실시간 도전 배틀">
    <div className="ring-frame">
      <header className="ring-scoreboard">
        <Health id={player.speciesId} formId={player.formId} hp={player.currentHP} max={maxHP} level={effectiveLevel(game)}
          remaining={roster.map(mon=>mon.currentHP>0)}/>
        <div className="ring-match"><span>{label}</span><h1>VS {trainer.name}</h1></div>
        <Health rival id={opponentId} formId={opponentForm} hp={foe?.currentHP ?? 0} max={foe?.maxHP ?? 1} level={foeMember.level}
          remaining={trainer.team.map((_,i)=>i>=battle.opponentIndex)}/>
      </header>
      <div className={'ring-floor' + (isPlaying ? '' : ' stopped')} data-terrain={terrain} style={{backgroundImage: 'url("' + ground + '")'}}
        ref={surface} tabIndex={0} role="group" aria-label="배틀 경기장 · 방향키 또는 Alt와 바닥 클릭으로 이동" onPointerDown={pointAndWalk} onContextMenu={event => event.preventDefault()}>
        <div className="ring-location">{location}</div>
        <div ref={world} className="ring-world" style={{transform:camera}} data-zoom={zoom}>
        <ArenaTrainers trainer={trainer}/>
        {goal && isPlaying && <i className="ring-goal" aria-hidden="true" style={point(goal)}/>}
        <ArenaEffects casts={arena.casts} clash={arena.beamClash} lastClash={arena.lastClash} preview={preview} effects={game.settings.effects} playing={isPlaying}/>
        <ArenaFighter side="enemy" pos={arena.enemy} bodyStyle={game.settings.effects ? nativeBodyStyle(arena.casts, 'enemy') : undefined} id={opponentId} formId={opponentForm}
          health={(foe?.currentHP ?? 0)/(foe?.maxHP ?? 1)} playing={isPlaying} feedback={feedback}
          casting={arena.casts.find(cast=>cast.side==='enemy')} dynamax={!!foe?.maxActionsLeft} tera={foe?.teraType}/>
        <ArenaFighter side="player" pos={arena.player} direction={arena.direction} bodyStyle={game.settings.effects ? nativeBodyStyle(arena.casts, 'player') : undefined} id={player.speciesId} formId={player.formId}
          health={player.currentHP/maxHP} playing={isPlaying} feedback={feedback} casting={arena.casts.find(cast=>cast.side==='player')}
          invincible={arena.dodgeMs > 0 || arena.invulnerableMs > 0} dynamax={!!foe?.maxActionsLeft} tera={foe?.teraType ? playerType : undefined}/>
        {feedback && game.settings.effects && <Impact key={feedback.id} feedback={feedback} pos={feedback.actor==='enemy' ? arena.player : arena.enemy}/>}
        </div>
        {(arena.paused || arena.needsSwitch) && <div className="ring-scrim" onPointerDown={e => e.stopPropagation()}>
          <div className="ring-pause-panel">
            <strong>{confirmExit ? '이 도전을 포기할까요?' : arena.paused ? '일시정지' : '다음 포켓몬을 선택하세요'}</strong>
            {confirmExit && <small>{trainer.role === 'gym' || trainer.id === region.finaleTrainer?.id ? '이번 상대와의 전투를 종료합니다.' : '포기하면 이번 리그 도전의 연승 기록이 초기화됩니다.'}</small>}
            {confirmExit ? <div><button onClick={() => setConfirmExit(false)}>돌아가기</button>
              <button className="danger" onClick={() => input({ type: 'arena-surrender' })}>포기 확정</button></div>
              : arena.paused ? <div><button onClick={() => pause(false)}>배틀 재개</button>
                <button onClick={() => setConfirmExit(true)}>도전 포기</button></div>
              : <small>아래 파티에서 전투에 나갈 포켓몬을 골라 주세요.</small>}
          </div></div>}
      </div>
      <div className="ring-deck">
        <section className={'ring-party' + (arena.needsSwitch ? ' replacement' : '')} aria-label="배틀 파티">
          <h2>파티 교체 <small>{arena.switchCooldownMs > 0 && !arena.needsSwitch ? duration(arena.switchCooldownMs) : '1–6'}</small></h2>
          <div className="ring-team">{roster.map((member, index) => {
            const active = member.instanceId === player.instanceId
            const name = pokemonName(member.speciesId,member.formId)
            const state = active ? '출전 중' : member.currentHP <= 0 ? '기절' : 'HP ' + member.currentHP
            return <button key={member.instanceId} title={name+' · '+state}
              disabled={active || member.currentHP <= 0 || (!arena.needsSwitch && (arena.paused || arena.switchCooldownMs > 0))}
              aria-pressed={active} data-member={member.instanceId} aria-label={(index + 1) + '번 ' + name + (active ? ' 출전 중' : ' 교체')}
              className={'ring-party-member' + (active ? ' active' : '') + (member.currentHP<=0 ? ' down' : '')} onClick={() => changeMember(index)}>
              <kbd>{index+1}</kbd><Pokemon id={member.speciesId} formId={member.formId}/>
            </button>
          })}</div>
        </section>
        <section className="ring-skills" aria-label="배틀 기술">
          {letters.map((key, i) => {
            const entry = skills[i]
            const wait = entry ? Math.max(entry.cooldownMs, arena.skillLockMs) : 0
            const fullHP = entry?.move.category === 'healing' && player.currentHP >= maxHP
            const sub = !entry ? '미등록' : !entry.unlocked ? 'Lv.' + entry.move.unlockLevel : wait > 0 ? duration(wait)
              : fullHP ? '체력 가득' : !entry.inRange ? '상대가 사거리 밖' : entry.move.category === 'healing' ? '회복' : '사용 가능'
            return <button key={key} type="button" data-skill-slot={i} className={'ring-skill' + (!entry ? ' empty' : '')}
              aria-label={key + ' ' + (entry?.move.nameKo ?? '빈 기술 칸')} aria-disabled={!isPlaying || !entry?.unlocked || wait > 0 || fullHP}
              disabled={!entry || !isPlaying || !entry.unlocked} style={{ '--move-color': moveColors[entry?.move.type ?? 'normal'] ?? moveColors.normal } as CSSProperties}
              onPointerEnter={() => setRangeSlot(i)} onPointerLeave={() => setRangeSlot(null)}
              onFocus={() => setRangeSlot(i)} onBlur={() => setRangeSlot(null)} onClick={() => skill(i)}>
              <span className="ring-skill-type"><kbd>{key}</kbd>{entry && types[entry.move.type]}</span>
              <strong>{entry?.move.nameKo ?? '빈 기술 칸'}</strong><small>{sub}</small>
            </button>
          })}
        </section>
        <div className="ring-utilities">
          <button className="ring-dodge" aria-label={'회피 Shift · '+arena.dodgeCharges+'회'} disabled={!isPlaying || arena.dodgeCharges === 0 || arena.dodgeMs > 0 || arena.invulnerableMs > 0} onClick={dodge}>
            <kbd>Shift</kbd><strong>회피 {arena.dodgeCharges}/2</strong>
            {arena.dodgeCharges < 2 && <small>{duration(arena.dodgeCooldownMs)}</small>}
          </button>
          <button className="ring-pause-button" onClick={() => pause(!arena.paused)}>{arena.paused ? '재개' : '일시정지'} <kbd>Esc</kbd></button>
        </div>
      </div>
    </div>
    <div className="ring-announce" role="status"><i/>{hint || (arena.needsSwitch ? '선두가 쓰러졌습니다. 교체할 포켓몬을 고르세요.'
      : arena.beamClash ? '광선 맞대결 중 · 방향을 틀거나 회피해 빠져나올 수 있습니다.'
      : feedback?.text || '방향키·Alt 클릭 이동 / Q W E R 기술 / 좌·우 클릭 Q·W / Shift·Space 회피')}</div>
    {special && <p className="ring-special">{special}{foe?.abilityId && ' · 특성 ' + (foe.abilityId === 'levitate' ? '부유' : '저수')}</p>}
  </section>
}

function useBattleSound(enabled: boolean, id: number | undefined, pitch: number, ratio: number) {
  const context = useRef<AudioContext | null>(null)
  const last = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (id === undefined || id === last.current) return
    last.current = id
    if (!enabled) return
    try {
      const ctx = context.current ??= new AudioContext()
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
      const tone = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime
      tone.type = 'triangle'
      tone.frequency.setValueAtTime(pitch, now)
      tone.frequency.setValueAtTime(pitch * ratio, now + .07)
      gain.gain.setValueAtTime(.025, now)
      gain.gain.exponentialRampToValueAtTime(.001, now + .2)
      tone.connect(gain); gain.connect(ctx.destination)
      tone.start(now); tone.stop(now + .21)
    } catch { /* Audio devices are optional. */ }
  }, [enabled, id, pitch, ratio])
  useEffect(() => () => { if (context.current) void context.current.close().catch(() => {}) }, [])
}

export interface TrainerResult { name: string; won: boolean; message: string; speciesId: string; formId?: string }

export function BattleResult({ result, close, sound }: { result: TrainerResult; close: () => void; sound: boolean }) {
  const title = result.won ? '도전 승리' : result.message.includes('포기') ? '도전 포기' : '도전 패배'
  useBattleSound(sound, 1, result.won ? 523.25 : 293.66, result.won ? 1.5 : .8)
  return <section className="ring-result" aria-label="도전 결과">
    <div className="ring-result-top"><span>{result.name} 배틀</span><h1>{title}</h1>
      <Pokemon id={result.speciesId} formId={result.formId} label /></div>
    {result.message && <p>{result.message}</p>}
    <button className="primary" onClick={close}>도전 화면으로</button>
  </section>
}
