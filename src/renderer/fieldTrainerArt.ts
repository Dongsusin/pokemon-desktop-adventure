import type { FieldTrainer } from '../game/regions/fieldTrainers'

export function fieldTrainerPortrait(trainer: FieldTrainer) {
  return 'battle/field-trainers/' + trainer.sprite + '.png'
}

export function fieldTrainerGround(trainer: FieldTrainer) {
  return 'battle/field-venues/' + trainer.venue + '.png'
}
