import { canChallengeFieldTrainer, type GameSave } from '../game/engine'
import type { FieldTrainer } from '../game/regions/fieldTrainers'

export function FieldTrainerCard({ trainer, game, busy, challenge }: {
  trainer: FieldTrainer
  game: GameSave
  busy: boolean
  challenge: (id: string) => void
}) {
  const cleared = game.campaign.fieldWins?.includes(trainer.id)
  return <button type="button" className="primary campaign-cta" data-field-trainer={trainer.id}
    disabled={busy || !canChallengeFieldTrainer(game, trainer.id)} onClick={() => challenge(trainer.id)}>
    {trainer.name}{cleared ? ' 연습 재대결' : '에게 도전'}
  </button>
}
