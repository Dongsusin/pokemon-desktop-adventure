import type { KantoTrainer } from '../game/regions/kantoCampaign'
import type { RegionId } from '../game/regions/world'
import { battleVenue } from './battleGround'

export function VenuePreview({ region, trainer }: { region: RegionId; trainer: KantoTrainer }) {
  const venue = battleVenue(region, trainer)
  if (!venue.name) return null
  return <details className="venue-preview" key={region + '/' + trainer.id}>
    <summary>
      <img src={venue.image} width={76} height={48} alt="" loading="lazy" draggable={false} />
      <span><small>배틀맵 미리보기</small><strong>{venue.name}</strong></span>
    </summary>
    <img className="venue-overview" src={venue.image} width={600} height={380}
      alt={trainer.name + '의 배틀맵 · ' + venue.name} loading="lazy" draggable={false} />
  </details>
}
