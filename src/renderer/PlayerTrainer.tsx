import { useState, type CSSProperties } from 'react'
import { trainerAvatars, type TrainerAvatar } from '../game/trainerAvatar'
import { wildTrainerCommanding, type GameSave } from '../game/engine'
import './player-trainer.css'

const names: Record<TrainerAvatar, string> = { male: '남성 트레이너', female: '여성 트레이너' }
type Pose = 'front' | 'idle' | 'command'

export function PlayerTrainerSprite({ avatar, pose, className, style }: {
  avatar: TrainerAvatar; pose: Pose; className?: string; style?: CSSProperties
}) {
  return <img className={'player-trainer-sprite ' + (className ?? '')} src={'trainers/player/' + avatar + '/' + pose + '.png'}
    srcSet={pose === 'front' ? 'trainers/player/' + avatar + '/front.png 64w, trainers/player/' + avatar + '/portrait.png 160w' : undefined}
    sizes={pose === 'front' ? '(max-width: 700px) 76px, 96px' : undefined}
    data-player-trainer={avatar} data-pose={pose} width={64} height={64} alt={names[avatar]} draggable={false} style={style} />
}

export function TrainerChoices({ value, choose, busy }: {
  value: TrainerAvatar | null; choose: (avatar: TrainerAvatar) => void; busy: boolean
}) {
  return <fieldset className="trainer-choices" disabled={busy}>
    <legend>내 트레이너</legend>
    <div>{trainerAvatars.map(avatar => <label key={avatar} className={'trainer-choice ' + avatar}>
      <input type="radio" name="trainer-avatar" value={avatar} aria-label={names[avatar]}
        checked={value === avatar} onChange={() => choose(avatar)} />
      <PlayerTrainerSprite avatar={avatar} pose="front" />
      <strong>{names[avatar]}</strong>
    </label>)}</div>
  </fieldset>
}

export function ExistingTrainerChoice({ busy, choose }: { busy: boolean; choose: (avatar: TrainerAvatar) => void }) {
  const [selected, setSelected] = useState<TrainerAvatar | null>(null)
  return <section className="trainer-migration">
    <div className="page-heading"><h1>트레이너를 선택하세요<span>.</span></h1>
      <p>이 슬롯의 포켓몬과 함께 배틀에 나설 모습입니다.</p></div>
    <TrainerChoices value={selected} choose={setSelected} busy={busy} />
    <button className="primary" disabled={busy || !selected} onClick={() => selected && choose(selected)}>이 모습으로 계속</button>
  </section>
}

export function WildTrainer({ game, viewportWidth }: { game: GameSave; viewportWidth: number }) {
  if (!game.trainerAvatar || game.campaign.battle || !game.settings.overlayVisible) return null
  const capturing = game.runtime.captureIn > 0
  if (game.player.state !== 'BATTLE' && !(capturing && game.player.state === 'RECOVER')) return null
  const foe = game.wild.find(mon => mon.id === game.runtime.targetId && !mon.trainerId)
  if (!foe && !capturing) return null
  const { x, y } = game.player.position
  const direction = foe ? (foe.position.x < x ? -1 : 1) : game.player.direction
  const size = Math.round(62 * game.settings.spriteScale)
  const wanted = x - direction * size * 1.25
  const left = Math.max(size / 2, Math.min(viewportWidth - size / 2, wanted))
  const crowded = Math.abs(left - x) < size * .75
  const commanding = capturing || (foe && wildTrainerCommanding(game, foe))
  return <PlayerTrainerSprite avatar={game.trainerAvatar} pose={commanding ? 'command' : 'idle'} className="field-trainer"
    style={{ left, width: size, top: Math.max(size, y - (crowded ? size * .85 : -4)), transform: 'translate(-50%, -92%) scaleX(' + direction + ')' }} />
}
