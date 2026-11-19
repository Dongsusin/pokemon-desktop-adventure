import { useState } from 'react'
import { fieldTrainersByRegion, type FieldTrainer } from '../game/regions/fieldTrainers'
import { regionOrder, worldRegions, type RegionId } from '../game/regions/world'
import { FieldTrainerPortrait } from './fieldTrainerArt'

function searchKey(value: string) {
  return value.toLowerCase().replace(/[\s·&/]/g, '')
}

export function FieldTrainerDirectory({ regionId, trainers, wins, selectedId, placeLabel, select }: {
  regionId: RegionId; trainers: readonly FieldTrainer[]; wins: readonly string[]; selectedId: string
  placeLabel: (id: string) => string; select: (trainer: FieldTrainer) => void
}) {
  const [search, setSearch] = useState('')
  const term = searchKey(search)
  const matches = (region: RegionId, trainer: FieldTrainer) => searchKey(trainer.name).includes(term) ||
    searchKey(worldRegions[region].locationById[trainer.locationId].name).includes(term)
  const local = trainers.filter(trainer => matches(regionId, trainer))
  const other = term ? regionOrder.filter(id => id !== regionId).flatMap(id =>
    fieldTrainersByRegion[id].filter(trainer => matches(id, trainer)).map(trainer => ({
      trainer, place: worldRegions[id].name + ' · ' + worldRegions[id].locationById[trainer.locationId].name,
    }))) : []
  return <details className="field-trainer-directory">
    <summary>지역 트레이너 <span>{wins.length}/{trainers.length} 승리</span></summary>
    <input type="search" className="field-trainer-search" aria-label="전체 지방 트레이너·장소 검색"
      placeholder="트레이너 또는 장소 이름 검색" value={search} onChange={event => setSearch(event.target.value)} />
    {local.length > 0 && <ul>{local.map(trainer => <li key={trainer.id}>
      <button type="button" aria-pressed={selectedId === trainer.locationId} onClick={() => select(trainer)}>
        <FieldTrainerPortrait trainer={trainer} width={24} height={30} loading="lazy" />
        <span><strong>{trainer.name}</strong><small>{placeLabel(trainer.locationId)}</small></span>
        {wins.includes(trainer.id) && <small>✓ 승리</small>}
      </button>
    </li>)}</ul>}
    {other.length > 0 && <section className="field-other-regions"><h3>다른 지방</h3>
      <ul>{other.map(({ trainer, place }) => <li key={trainer.id}><strong>{trainer.name}</strong><small>{place}</small></li>)}</ul>
    </section>}
    {local.length + other.length === 0 && <p className="empty">일치하는 트레이너나 장소가 없습니다.</p>}
  </details>
}
