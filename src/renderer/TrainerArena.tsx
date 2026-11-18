import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { arenaSkills, currentTrainer, effectiveLevel, playerStats, type GameAction, type GameSave, type Position } from '../game/engine'
import { species } from '../game/catalog'
import { battleForm, formStats } from '../game/forms'
import { worldRegions } from '../game/regions/world'
import { Pokemon, TeraIcon, pokemonName, types } from './shared'
import './trainer-arena.css'

type Input = Extract<GameAction, { type: `arena-${string}` }>
type Arena = NonNullable<GameSave['campaign']['battle']>['arena']
type Feedback = NonNullable<Arena['feedback']>
const letters = ['Q', 'W', 'E', 'R']
const arrows: Record<string, Position> = {
  ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }
}
const tint: Record<string, string> = {
  normal: '#b3bab6', fire: '#ff9b67', water: '#6ed9ff', grass: '#a7df74', electric: '#ffe477',
  ice: '#96e5e7', fighting: '#ef936e', poison: '#d9a0e9', ground: '#dbb57d', flying: '#a8cef8',
  psychic: '#f6a5cc', bug: '#c0d776', rock: '#d6ba81', ghost: '#baa8f3', dragon: '#9ca8ff',
  dark: '#b9a99e', steel: '#bfd1d6', fairy: '#f6b4d7',
}
const point = (pos: Position): CSSProperties => ({ left: pos.x * 100 + '%', top: pos.y * 100 + '%' })
const circle = (pos: Position, radius: number): CSSProperties => ({ ...point(pos), width: 200 * radius + '%' })
const duration = (ms: number) => (Math.ceil(ms / 100) / 10).toFixed(1) + '초'

function Health({ name, level, hp, max, rival, extra }: {
  name: string; level: number; hp: number; max: number; rival?: boolean; extra?: string
}) {
  const fraction = Math.max(0, Math.min(1, hp / Math.max(1, max)))
  return <div className={'ring-health ' + (rival ? 'rival' : 'ally')}>
    <div className="ring-health-heading">
      <span className="ring-side">{rival ? '상대' : '내 포켓몬'}</span>
      <strong>{name}</strong><small>Lv. {level}</small>
    </div>
    <div className="ring-hp-row"><span className="ring-hp-track" role="progressbar" aria-label={(rival ? '상대' : '내 포켓몬') + ' HP'}
      aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}>
      <i style={{ width: fraction * 100 + '%', background: fraction < .25 ? '#e77c58' : fraction < .5 ? '#dfb453' : undefined }} />
    </span><span className="ring-hp-number">{hp} / {max}</span></div>
    {extra && <small className="ring-health-extra">{extra}</small>}
  </div>
}

function Fighter({ side, id, formId, pos, facingRight, cue, invincible, dynamax, tera }: {
  side: 'player' | 'enemy'; id: string; formId?: string; pos: Position; facingRight: boolean; cue: Feedback | null;
  invincible?: boolean; dynamax?: boolean; tera?: string
}) {
  const attack = cue?.kind === 'hit'
  const motion = cue?.actor === side ? (attack ? ' striking' : cue.kind === 'dodge' ? ' dodging' : '') : attack ? ' stagger' : ''
  return <div className={'ring-fighter ' + side + (invincible ? ' invincible' : '') + (dynamax ? ' dynamax' : '')}
    data-side={side} data-x={pos.x} data-y={pos.y} data-species={id} style={point(pos)}>
    <span className="ring-fighter-shadow" aria-hidden="true" />
    <div key={cue?.id || 0} className={'ring-fighter-motion' + motion}>
      <div className={'ring-fighter-face' + (facingRight ? ' faces-right' : '')}>
        <Pokemon id={id} formId={formId} label />
      </div>
    </div>
    {tera && <span className="ring-tera"><TeraIcon type={tera} /></span>}
    <span className="ring-fighter-mark" aria-hidden="true">{side === 'player' ? '▼' : '◆'}</span>
  </div>
}

function Strike({ feedback, player, enemy }: { feedback: Feedback; player: Position; enemy: Position }) {
  const from = feedback.actor === 'enemy' ? enemy : player
  const to = feedback.kind === 'hit' ? feedback.actor === 'enemy' ? player : enemy : from
  const color = tint[feedback.moveType ?? 'normal'] ?? tint.normal
  // Freeze the endpoints at impact; later movement should not drag a fired effect.
  const [at] = useState(() => ({ from: { ...from }, to: { ...to } }))
  const style = { '--shot-x': at.from.x * 100 + '%', '--shot-y': at.from.y * 100 + '%',
    '--hit-x': at.to.x * 100 + '%', '--hit-y': at.to.y * 100 + '%', '--effect-color': color } as CSSProperties
  return <div className={'ring-effect ring-' + feedback.kind} style={style} aria-hidden="true">
    {feedback.kind === 'hit' && <><i className="ring-shot" /><i className="ring-impact" /></>}
    {feedback.kind === 'heal' && <i className="ring-impact" />}
    <span className="ring-popup">{feedback.kind === 'hit' ? '명중' : feedback.kind === 'miss' ? '빗나감' : feedback.kind === 'dodge' ? '회피' : feedback.kind === 'heal' ? '회복' : '교체'}</span>
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
  const mounted = useRef(true)
  const isPlaying = !arena.paused && !arena.needsSwitch
  const feedback = arena.feedback
  useBattleSound(game.settings.sound, feedback?.id, feedback ? feedback.kind === 'heal' ? 560 : feedback.kind === 'hit' ? feedback.actor === 'enemy' ? 180 : 330 : 465 : 0, feedback?.actor === 'enemy' ? .82 : 1.28)

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
    if (!item.inRange) { setHint('사거리 밖입니다. 상대에게 더 가까이 이동하세요.'); return }
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
    if (isPlaying && arena.dodgeCooldownMs <= 0) { setHint(''); input({ type: 'arena-dodge' }) }
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
      else if (code === 'Space') {
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
    const x = goal.x - arena.player.x, y = (goal.y - arena.player.y) * 9 / 16
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
    if (!isPlaying || event.button !== 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    keys.current.clear()
    setGoal({ x: Math.max(.055, Math.min(.945, (event.clientX - rect.left) / rect.width)),
      y: Math.max(.09, Math.min(.91, (event.clientY - rect.top) / rect.height)) })
    event.currentTarget.focus({ preventScroll: true })
  }

  const label = trainer.cupRound ?? (trainer.trialKind === 'totem' ? '시련' : trainer.trialKind === 'kahuna' ? '큰 시련'
    : trainer.role === 'gym' ? '체육관전' : trainer.role === 'champion' ? '챔피언전' : '사천왕전')
  const foeMember = trainer.team[battle.opponentIndex]
  const opponentId = foe?.speciesId ?? foeMember.speciesId
  const opponentForm = foe ? battleForm(foe) : foeMember.formId
  const range = rangeSlot === null ? undefined : skills[rangeSlot]
  const playerType = formStats(player.speciesId, player.formId).types[0]
  const terrain = trainer.type ?? (trainer.role === 'champion' ? 'champion' : 'normal')
  return <section className="trainer-arena" aria-label="실시간 도전 배틀">
    <header className="ring-heading"><div><p>{region.locationById[trainer.locationId].name} <span> / </span> {label}</p>
      <h1><small className="ring-versus">VS</small>{trainer.name}</h1></div>
      <button className="ring-pause-button" onClick={() => pause(!arena.paused)}>{arena.paused ? '재개' : '일시정지'} <kbd>Esc</kbd></button></header>
    <div className="ring-layout"><div className="ring-main">
      <div className="ring-scoreboard">
        <Health name={pokemonName(player.speciesId, player.formId)} hp={player.currentHP} max={maxHP} level={effectiveLevel(game)} />
        <Health rival name={pokemonName(opponentId, opponentForm)} hp={foe?.currentHP ?? 0} max={foe?.maxHP ?? 1} level={foeMember.level}
          extra={trainer.team.length + '마리 중 ' + (battle.opponentIndex + 1) + '번째'} />
      </div>
      <div className={'ring-floor' + (isPlaying ? '' : ' stopped')} data-terrain={terrain}
        ref={surface} tabIndex={0} role="group" aria-label="배틀 경기장 · 방향키 또는 바닥 클릭으로 이동" onPointerDown={pointAndWalk}>
        <div className="ring-court" aria-hidden="true"><i /><b /></div>
        {range && isPlaying && <span aria-hidden="true" className={'ring-range' + (range.inRange ? ' inside' : '')} style={circle(arena.player, range.range)} />}
        {goal && isPlaying && <i className="ring-goal" aria-hidden="true" style={point(goal)} />}
        {arena.telegraph && <div className="ring-warning" data-threat="true" style={circle(arena.telegraph.center, arena.telegraph.radius)}>
          <i style={{ transform: 'scale(' + (1 - arena.telegraph.remainingMs / arena.telegraph.durationMs) + ')' }} />
          <span>{arena.telegraph.moveName}</span></div>}
        <Fighter side="enemy" pos={arena.enemy} facingRight={arena.enemy.x < arena.player.x} id={opponentId} formId={opponentForm}
          cue={game.settings.effects ? feedback : null} dynamax={!!foe?.maxActionsLeft} tera={foe?.teraType} />
        <Fighter side="player" pos={arena.player} facingRight={arena.player.x < arena.enemy.x} id={player.speciesId} formId={player.formId}
          cue={game.settings.effects ? feedback : null} invincible={arena.invulnerableMs > 0} dynamax={!!foe?.maxActionsLeft}
          tera={foe?.teraType ? playerType : undefined} />
        {feedback && game.settings.effects && <Strike key={feedback.id} feedback={feedback} player={arena.player} enemy={arena.enemy} />}
        {(arena.paused || arena.needsSwitch) && <div className="ring-scrim" onPointerDown={e => e.stopPropagation()}>
          <div className="ring-pause-panel">
            <strong>{confirmExit ? '이 도전을 포기할까요?' : arena.paused ? '일시정지' : '다음 포켓몬을 선택하세요'}</strong>
            {confirmExit && <small>{trainer.role === 'gym' || trainer.id === region.finaleTrainer?.id ? '이번 상대와의 전투를 종료합니다.' : '포기하면 이번 리그 도전의 연승 기록이 초기화됩니다.'}</small>}
            {confirmExit ? <div><button onClick={() => setConfirmExit(false)}>돌아가기</button>
              <button className="danger" onClick={() => input({ type: 'arena-surrender' })}>포기 확정</button></div>
              : arena.paused ? <div><button onClick={() => pause(false)}>배틀 재개</button>
                <button className="subtle" onClick={() => setConfirmExit(true)}>도전 포기</button></div>
              : <small>아래 파티에서 전투에 나갈 포켓몬을 골라 주세요.</small>}
          </div></div>}
      </div>
      <div className="ring-announce" role="status"><i aria-hidden="true" /><span>{hint || (arena.needsSwitch ? '선두가 쓰러졌습니다. 교체할 포켓몬을 고르세요.'
        : feedback?.text || '방향키 또는 바닥 클릭으로 이동하세요. 상대의 공격 범위는 붉은 원으로 표시됩니다.')}</span></div>
    </div>
    <aside className="ring-command" aria-label="배틀 조작"><h2>기술 <small>자동 조준</small></h2>
      <div className="ring-skills">
        {letters.map((key, i) => {
          const entry = skills[i]
          const wait = entry ? Math.max(entry.cooldownMs, arena.skillLockMs) : 0
          const fullHP = entry?.move.category === 'healing' && player.currentHP >= maxHP
          const sub = !entry ? '미등록' : !entry.unlocked ? '레벨 제한' : wait > 0 ? duration(wait) : fullHP ? '체력 가득' : !entry.inRange ? '거리 좁히기' : entry.move.category === 'healing' ? '회복' : '사거리 안'
          return <button key={key} type="button" data-skill-slot={i} className={'ring-skill' + (!entry ? ' empty' : '')}
            aria-label={key + ' ' + (entry?.move.nameKo ?? '빈 기술 칸')} aria-disabled={!isPlaying || !entry?.unlocked || wait > 0 || fullHP || !entry.inRange}
            disabled={!entry || !isPlaying || !entry.unlocked} style={{ '--move-color': tint[entry?.move.type ?? 'normal'] } as CSSProperties}
            onPointerEnter={() => setRangeSlot(i)} onPointerLeave={() => setRangeSlot(null)}
            onFocus={() => setRangeSlot(i)} onBlur={() => setRangeSlot(null)} onClick={() => skill(i)}>
            <kbd>{key}</kbd><span><strong>{entry?.move.nameKo ?? '빈 기술 칸'}</strong>
              <small>{entry && types[entry.move.type] + ' · '}{sub}</small></span></button>
        })}
      </div>
      <button className="ring-dodge" disabled={!isPlaying || arena.dodgeCooldownMs > 0} onClick={dodge}>
        <span>회피</span><small>{arena.dodgeCooldownMs > 0 ? duration(arena.dodgeCooldownMs) : 'Space'}</small></button>
      <p className="ring-input-help"><span>↑ ↓ ← →</span> 이동 <b>·</b> 바닥 클릭으로 이동</p>
      {(foe?.teraType || foe?.maxActionsLeft || trainer.totemAura) && <p className="ring-special">{foe?.teraType ? types[foe.teraType] + ' 테라스탈'
        : foe?.maxActionsLeft ? (foe.dynamax === 'gigantamax' ? '거다이맥스' : '다이맥스') + ' · 남은 ' + Math.ceil(foe.maxActionsLeft / 2) + '턴'
        : '주인 포켓몬의 오라'}{foe?.abilityId && ' · 특성 ' + (foe.abilityId === 'levitate' ? '부유' : '저수')}</p>}
    </aside></div>
    <section className={'ring-party' + (arena.needsSwitch ? ' replacement' : '')} aria-label="배틀 파티">
      <div className="ring-party-heading"><h2>파티 교체</h2><small>{arena.switchCooldownMs > 0 && !arena.needsSwitch ? duration(arena.switchCooldownMs) + ' 후 교체 가능' : '숫자 1–6 또는 포켓몬 선택'}</small></div>
      <div className="ring-team">{roster.map((member, index) => {
        const active = member.instanceId === player.instanceId
        return <button key={member.instanceId} disabled={active || member.currentHP <= 0 || (!arena.needsSwitch && (arena.paused || arena.switchCooldownMs > 0))}
          aria-pressed={active} data-member={member.instanceId} aria-label={(index + 1) + '번 ' + pokemonName(member.speciesId, member.formId) + (active ? ' 출전 중' : ' 교체')}
          className={'ring-party-member' + (active ? ' active' : '')} onClick={() => changeMember(index)}>
          <kbd>{index + 1}</kbd><Pokemon id={member.speciesId} formId={member.formId} />
          <span><strong>{species[member.speciesId].nameKo}</strong><small>{active ? '출전 중' : member.currentHP <= 0 ? '기절' : 'HP ' + member.currentHP}</small></span>
        </button>
      })}</div>
    </section>
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
