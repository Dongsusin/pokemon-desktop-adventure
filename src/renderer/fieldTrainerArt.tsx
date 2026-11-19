import type { FieldTrainer } from '../game/regions/fieldTrainers'
import './field-trainer-art.css'

const bossPortraits: Readonly<Record<string, readonly string[] | undefined>> = {
  'boss-proton-petrel': ['proton', 'petrel'],
  'boss-ariana-archer': ['ariana', 'd-192'],
}

function portraitUrl(key: string) {
  return 'battle/field-trainers/' + key + '.png'
}

export function fieldTrainerPortrait(trainer: FieldTrainer) {
  return portraitUrl(bossPortraits[trainer.sprite]?.[0] ?? trainer.sprite)
}

interface PortraitProps {
  trainer: FieldTrainer
  alt?: string
  className?: string
  width?: number
  height?: number
  loading?: 'eager' | 'lazy'
}

export function FieldTrainerPortrait({ trainer, alt = '', className, width, height, loading }: PortraitProps) {
  const members = bossPortraits[trainer.sprite]
  if (!members) {
    return <img src={fieldTrainerPortrait(trainer)} data-trainer-sprite={trainer.sprite} className={className}
      alt={alt} width={width} height={height} loading={loading} draggable={false}
      style={trainer.sprite === 'factory-clown' ? { imageRendering: 'auto' } : undefined} />
  }
  return <span className={className ? className + ' field-portrait-pair' : 'field-portrait-pair'}
    data-trainer-sprite={trainer.sprite} style={{ width, height }}
    role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
    {members.map(member => <img key={member} src={portraitUrl(member)} data-member={member}
      alt="" loading={loading} draggable={false} />)}
  </span>
}

export function fieldTrainerGround(trainer: FieldTrainer) {
  return 'battle/field-venues/' + trainer.venue + '.png'
}
