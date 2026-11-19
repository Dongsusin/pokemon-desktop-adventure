import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { battleGimmickStatus, arenaSkills, currentTrainer, effectiveLevel, playerStats, type GameAction, type GameSave, type Position, type PracticeResult } from '../game/engine'
import { battleForm } from '../game/forms'
import { worldRegions } from '../game/regions/world'
import { Pokemon, pokemonName, types } from './shared'
import { ArenaEffects, moveColors } from './ArenaEffects'
import { ArenaFighter } from './ArenaFighter'
import { nativeBodyStyle } from './NativeMove'
import { ArenaTrainers } from './ArenaTrainers'
import { useMoveSounds } from './useMoveSounds'
import { battleVenue } from './battleGround'
import { GimmickControl } from './GimmickControl'
import { ActiveBattleItem } from './InventoryBag'
import './trainer-arena.css'

type Input = Extract<GameAction, { type: `arena-${string}` }>
type Arena = NonNullable<GameSave['campaign']['battle']>['arena']
type Feedback = NonNullable<Arena['feedback']>
const point = (pos: Position): CSSProperties => ({ left: pos.x * 100 + '%', top: pos.y * 100 + '%' })
const duration = (ms: number) => (Math.ceil(ms / 100) / 10).toFixed(1) + '초'

function effectivenessLabel(value: number | 'absorb' | null) {
  if (value === null) return ''
  if (value === 'absorb') return '흡수'
  if (value === 0) return '무효'
  if (value === 1) return '보통 ×1'
  return (value > 1 ? '약점 ×' : '저항 ×') + value
}

function Health({ id, formId, level, hp, max, rival, remaining }: {
  id: string; formId?: string; level: number; hp: number; max: number; rival?: boolean; remaining?: boolean[]
}) {
  const ratio = Math.max(0,Math.min(1,hp/Math.max(1,max)))
  return <div className={'ring-health ' + (rival ? 'rival' : 'ally')}>
    <div className="ring-portrait"><Pokemon id={id} formId={formId}/></div>
    <div className="ring-health-body">
      <div className="ring-health-heading"><strong>{pokemonName(id,formId)}</strong><small>Lv.{level}</small>
        {remaining && <span className="ring-reserves" aria-label={'남은 포켓몬 ' + remaining.filter(Boolean).length + '마리'}>
          {remaining.map((available,index)=><i key={index} className={available ? '' : 'down'}/>)}</span>}
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
    feedback.kind === 'dodge' ? '회피' : feedback.kind === 'miss' ? '빗나감' : feedback.kind === 'status' ? feedback.text : '출전'
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
  const playerGimmick = battleGimmickStatus(game)
  const enemyGimmick = battleGimmickStatus(game, 'enemy')
  const allyActive = playerGimmick?.phase === 'active' ? playerGimmick : undefined
  const enemyActive = enemyGimmick?.phase === 'active' ? enemyGimmick : undefined
  const playerForm = allyActive?.formId ?? player.formId
  const [megaChoice, setMegaChoice] = useState<{ owner: string; formId: string } | null>(null)
  const options = playerGimmick?.megaOptions
  const chosenMega = megaChoice?.owner === player.instanceId && options?.includes(megaChoice.formId) ? megaChoice.formId : undefined
  const selectedMega = chosenMega ?? playerGimmick?.formId ?? options?.[0]
  const maxHP = playerStats(game).hp
  const members = new Map([player, ...game.followers].map(mon => [mon.instanceId, mon]))
  const roster = arena.partyOrder.map(id => members.get(id)).filter(mon => !!mon)
  const [hint, setHint] = useState('')
  const [confirmExit, setConfirmExit] = useState(false)
  const resumeOnCancel = useRef(false)
  const mounted = useRef(true)
  const isPlaying = !arena.paused && !arena.needsSwitch
  const canActivate = isPlaying
  const feedback = arena.feedback
  useMoveSounds(arena.casts, game.settings.sound, isPlaying)
  useBattleSound(game.settings.sound && !feedback?.moveId, feedback?.id, feedback ? feedback.kind === 'heal' ? 560 : feedback.kind === 'hit' ? feedback.actor === 'enemy' ? 180 : 330 : 465 : 0, feedback?.actor === 'enemy' ? .82 : 1.28)

  function input(action: Input) {
    void window.adventure.dispatch({ type: 'arenaInput', action }).catch(() => {
      if (mounted.current) setHint('현재 전투 상태에서 사용할 수 없습니다.')
    })
  }
  function pause(paused: boolean) {
    setConfirmExit(false)
    setHint('')
    input({ type: 'arena-pause', paused })
  }
  function requestExit() {
    if (confirmExit) return
    resumeOnCancel.current = !arena.paused
    setConfirmExit(true)
    if (!arena.paused) input({ type: 'arena-pause', paused: true })
  }
  function cancelExit() {
    setConfirmExit(false)
    if (resumeOnCancel.current) input({ type: 'arena-pause', paused: false })
    resumeOnCancel.current = false
  }
  function canSwitch(member: typeof roster[number]) {
    return !confirmExit && !arena.maxClash && member.instanceId !== player.instanceId && member.currentHP > 0
      && (arena.needsSwitch || (!arena.paused && arena.switchCooldownMs <= 0))
  }
  function switchAt(index: number) {
    const member = roster[index]
    if (member && canSwitch(member)) input({ type: 'arena-switch', instanceId: member.instanceId })
  }
  function activateGimmick() {
    if (confirmExit || !canActivate || playerGimmick?.phase !== 'ready') return
    setHint('')
    input({ type: 'arena-gimmick', ...(chosenMega && { formId: chosenMega }) })
  }
  const onKey = useRef<(event: KeyboardEvent) => void>(() => {})
  onKey.current = event => {
    if (event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
    if (event.code === 'Escape') {
      event.preventDefault()
      if (confirmExit) cancelExit()
      else pause(!arena.paused)
      return
    }
    if (confirmExit) return
    if (event.code === 'KeyF' && playerGimmick) { event.preventDefault(); activateGimmick(); return }
    if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement) return
    if (/^(Digit|Numpad)[1-6]$/.test(event.code)) {
      event.preventDefault()
      switchAt(Number(event.code.slice(-1)) - 1)
    }
  }
  useEffect(() => {
    mounted.current = true
    const keydown = (event: KeyboardEvent) => onKey.current(event)
    window.addEventListener('keydown', keydown)
    return () => { mounted.current = false; window.removeEventListener('keydown', keydown) }
  }, [])
  useEffect(() => {
    if (!hint) return
    const timer = window.setTimeout(() => setHint(''), 2200)
    return () => window.clearTimeout(timer)
  }, [hint])
  const actorSpan = Math.max(Math.abs(arena.player.x-arena.enemy.x),Math.abs(arena.player.y-arena.enemy.y))
  const zoom = Math.min(1.48, Math.max(1, 1.62 - actorSpan * 1.05))
  const crop = (a: number, b: number) => Math.max(0,Math.min(1-1/zoom,(a+b)/2-.5/zoom))
  const cx = crop(arena.player.x,arena.enemy.x), cy = crop(arena.player.y,arena.enemy.y)
  const camera = 'scale('+zoom+') translate('+(-cx*100)+'%, '+(-cy*100)+'%)'
  const label = trainer.cupRound ?? (trainer.trialKind === 'totem' ? '시련' : trainer.trialKind === 'kahuna' ? '큰 시련'
    : { gym: '체육관전', field: '지역 트레이너전', champion: '챔피언전', elite: '사천왕전' }[trainer.role])
  const foeMember = trainer.team[battle.opponentIndex]
  const opponentId = foe?.speciesId ?? foeMember.speciesId
  const opponentForm = enemyActive?.formId ?? (foe ? battleForm(foe) : foeMember.formId)
  const allyCast = arena.casts.find(cast => cast.side === 'player')
  const bursts = game.settings.effects ? game.effects.filter(e => e.gimmick && e.kind === 'travel') : []
  const allyBurst = bursts.filter(e => e.actor === 'partner').at(-1)
  const enemyBurst = bursts.filter(e => foe && e.actor === foe.id).at(-1)
  const terrain = trainer.type ?? (trainer.role === 'champion' ? 'champion' : 'normal')
  const venue = battleVenue(region.id, trainer)
  const location = region.locationById[trainer.locationId].name
  const venueLabel = venue.name?.startsWith(location) ? venue.name : [location, venue.name].filter(Boolean).join(' · ')
  const special = [trainer.totemAura && '주인 포켓몬의 오라', enemyActive && ('상대 ' + enemyActive.label + ' · ' + enemyActive.detail)].filter(Boolean).join(' · ')
  return <section className="trainer-arena" data-has-gimmick={playerGimmick ? true : undefined} aria-label="실시간 도전 배틀">
    <div className="ring-frame">
      <header className="ring-scoreboard">
        <Health id={player.speciesId} formId={playerForm} hp={player.currentHP} max={maxHP} level={effectiveLevel(game)}
          remaining={roster.map(mon=>mon.currentHP>0)}/>
        <div className="ring-match"><span>{battle.practice ? '연습 재대결' : label}</span><h1>VS {trainer.name}</h1></div>
        <Health rival id={opponentId} formId={opponentForm} hp={foe?.currentHP ?? 0} max={foe?.maxHP ?? 1} level={foeMember.level}/>
      </header>
      <div className={'ring-floor' + (isPlaying ? '' : ' stopped')} data-terrain={terrain} data-venue={region.id + '/' + trainer.id} style={{backgroundImage: 'url("' + venue.image + '")'}}
        role="group" aria-label="자동 배틀 경기장">
        <div className="ring-location">{venueLabel}</div>
        <div className="ring-world" style={{transform:camera}} data-zoom={zoom}>
        <ArenaTrainers trainer={trainer} avatar={game.trainerAvatar} commanding={arena.casts.some(cast => cast.side === 'player')} />
        <ArenaEffects casts={arena.casts} clash={arena.beamClash} maxClash={arena.maxClash} lastClash={arena.lastClash} effects={game.settings.effects} playing={isPlaying}/>
        <ArenaFighter side="enemy" pos={arena.enemy} bodyStyle={game.settings.effects ? nativeBodyStyle(arena.casts, 'enemy') : undefined} id={opponentId} formId={opponentForm}
          health={(foe?.currentHP ?? 0)/(foe?.maxHP ?? 1)} playing={isPlaying} feedback={feedback}
          casting={arena.casts.find(cast=>cast.side==='enemy')} gimmick={enemyActive} effects={game.settings.effects} burst={enemyBurst}/>
        <ArenaFighter side="player" pos={arena.player} direction={arena.direction} bodyStyle={game.settings.effects ? nativeBodyStyle(arena.casts, 'player') : undefined} id={player.speciesId} formId={playerForm}
          health={player.currentHP/maxHP} playing={isPlaying} feedback={feedback} casting={allyCast}
          invincible={arena.dodgeMs > 0 || arena.invulnerableMs > 0} gimmick={allyActive} effects={game.settings.effects} burst={allyBurst}/>
        {feedback && game.settings.effects && !bursts.some(effect => effect.text === feedback.text) && <Impact key={feedback.id} feedback={feedback} pos={feedback.actor==='enemy' ? arena.player : arena.enemy}/>}
        </div>
        {(confirmExit || arena.paused || arena.needsSwitch) && <div className="ring-scrim" onPointerDown={e => e.stopPropagation()}>
          <div className="ring-pause-panel">
            <strong>{confirmExit ? (battle.practice ? '연습을 끝낼까요?' : '이 도전을 포기할까요?') : arena.needsSwitch ? '교체할 포켓몬을 선택하세요' : '일시정지'}</strong>
            {confirmExit && <small>{battle.practice ? '입장 전 파티와 체력으로 돌아갑니다.' : trainer.role === 'gym' || trainer.role === 'field' || trainer.id === region.finaleTrainer?.id ? '이번 상대와의 전투를 종료합니다.' : '포기하면 이번 리그 도전의 연승 기록이 초기화됩니다.'}</small>}
            {confirmExit ? <div><button onClick={cancelExit}>돌아가기</button>
              <button className="danger" onClick={() => input({ type: 'arena-surrender' })}>{battle.practice ? '연습 종료' : '포기 확정'}</button></div>
              : <>{arena.needsSwitch && <small>아래 파티에서 포켓몬을 누르거나 자리 번호를 입력하세요.</small>}
                {arena.paused && <div><button onClick={() => pause(false)}>배틀 재개</button>
                  <button onClick={requestExit}>{battle.practice ? '연습 나가기' : '도전 포기'}</button></div>}</>}
          </div></div>}
      </div>
      <div className="ring-deck">
        <section className={'ring-party' + (arena.needsSwitch ? ' replacement' : '')} aria-label="배틀 파티">
          <h2>파티 교체 <small>{arena.switchCooldownMs > 0 ? duration(arena.switchCooldownMs) : '1–6'}</small></h2>
          <div className="ring-team">{roster.map((member, index) => {
            const active = member.instanceId === player.instanceId
            const name = pokemonName(member.speciesId, member.formId)
            const state = member.currentHP <= 0 ? '기절' : active ? '출전 중' : 'HP ' + member.currentHP
            return <button type="button" key={member.instanceId} title={name + ' · ' + state} disabled={!canSwitch(member)}
              aria-pressed={active} aria-keyshortcuts={String(index + 1)} aria-label={(index + 1) + '번 ' + name + (active ? ' 출전 중' : ' 교체')} onClick={() => switchAt(index)}
              data-member={member.instanceId} className={'ring-party-member' + (active ? ' active' : '') + (member.currentHP <= 0 ? ' down' : '')}>
              <kbd>{index + 1}</kbd><Pokemon id={member.speciesId} formId={active ? playerForm : member.formId}/>
            </button>
          })}</div>
        </section>
        <section className="ring-skills" aria-label="자동 배틀 기술">
          {skills.map((entry, slot) => {
            const casting = allyCast?.moveId === entry.move.id
            const matchup = effectivenessLabel(entry.effectiveness)
            const sub = casting ? '시전 중' : !entry.unlocked ? 'Lv.' + entry.move.unlockLevel :
              entry.gimmickLocked ? '거대화 중' : entry.cooldownMs > 0 ? duration(entry.cooldownMs) : entry.inRange ? '준비' : '사거리 밖'
            return <div key={entry.move.id} data-skill-slot={slot} data-gimmick={entry.move.gimmick} data-casting={casting || undefined}
              className="ring-skill" style={{ '--move-color': moveColors[entry.move.type] ?? moveColors.normal } as CSSProperties}>
              <span className="ring-skill-type">{types[entry.move.type]}</span>
              <strong>{casting ? allyCast.moveName : entry.move.nameKo}</strong>
              {matchup && <span className="ring-matchup" data-effectiveness={entry.effectiveness}>{matchup}</span>}
              <small>{sub}</small>
            </div>
          })}
        </section>
        <div className="ring-utilities">
          <strong className="ring-auto-label">자동 배틀</strong>
          <button className="ring-pause-button" disabled={confirmExit} onClick={() => pause(!arena.paused)}>{arena.paused ? '재개' : '일시정지'} <kbd>Esc</kbd></button>
          {!arena.paused && !confirmExit && <button className="ring-pause-button" onClick={requestExit}>{battle.practice ? '연습 나가기' : '도전 포기'}</button>}
        </div>
      </div>
      {playerGimmick && <GimmickControl status={playerGimmick} playing={canActivate && !confirmExit} activate={activateGimmick}
        selectedMega={selectedMega} chooseMega={formId => setMegaChoice({ owner: player.instanceId, formId })}/>}
    </div>
    <div className="ring-announce" role="status"><i/>{hint || (arena.maxClash ? '다이맥스기 맞대결 중' : arena.beamClash ? '광선 힘겨루기 중'
       : arena.needsSwitch ? '다음 포켓몬의 출전을 기다리고 있습니다.'
      : feedback?.text || '두 포켓몬이 전장에 나왔습니다.')}</div>
    {special && <p className="ring-special">{special}</p>}
    <ActiveBattleItem game={game}/>

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

export interface TrainerResult { returnToMap?: boolean; practiceResult?: PracticeResult; name: string; won: boolean; message: string; speciesId: string; formId?: string }

export function BattleResult({ result, close, sound }: { result: TrainerResult; close: () => void; sound: boolean }) {
  const title = result.practiceResult ? { win: '연습 승리', loss: '연습 패배', left: '연습 종료' }[result.practiceResult]
    : result.won ? '도전 승리' : result.message.includes('포기') ? '도전 포기' : '도전 패배'
  useBattleSound(sound, 1, result.won ? 523.25 : 293.66, result.won ? 1.5 : .8)
  return <section className="ring-result" aria-label="도전 결과">
    <div className="ring-result-top"><span>{result.name} 배틀</span><h1>{title}</h1>
      <Pokemon id={result.speciesId} formId={result.formId} label /></div>
    {result.message && <p>{result.message}</p>}
    <button className="primary" onClick={close}>{result.returnToMap ? '지도로 돌아가기' : '도전 화면으로'}</button>
  </section>
}
