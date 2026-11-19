import { useState } from 'react'
import { canChallengeFieldTrainer, fieldTrainerRewards, type GameSave } from '../game/engine'
import { fieldTeamVariant, type FieldTrainer } from '../game/regions/fieldTrainers'
import { locationGateRules } from '../game/regions/locationGates'
import { worldRegions } from '../game/regions/world'
import { TrainerTeam } from './Campaign'
import { VenuePreview } from './VenuePreview'
import { FieldTrainerPortrait } from './fieldTrainerArt'

const kinds = { ally: '동료', rival: '라이벌', villain: '악의 조직', trainer: '트레이너' }
const series = { game: '게임', anime: '애니메이션', both: '게임·애니메이션' }

export function fieldTeamLevels(trainer: FieldTrainer) {
  const levels = trainer.team.map(member => member.level)
  const low = Math.min(...levels), high = Math.max(...levels)
  return 'Lv. ' + (low === high ? low : low + '–' + high)
}

export function FieldTrainerCard({ trainer, game, busy, locationLocked, challenge, choose }: {
  trainer: FieldTrainer; game: GameSave; busy: boolean; locationLocked: boolean
  challenge: (id: string, teamNumber: number) => void; choose: (locationId: string) => void
}) {
  const [teamNumber, setTeamNumber] = useState(1)
  const opponent = fieldTeamVariant(trainer, teamNumber) ?? trainer
  const cleared = game.campaign.fieldWins?.includes(trainer.id)
  const here = game.locationId === trainer.locationId
  const eligible = canChallengeFieldTrainer(game, trainer.id)
  const reward = fieldTrainerRewards(opponent)
  const region = worldRegions[game.regionId]
  const destinations = region.locations.filter(place => locationGateRules[region.id][place.id]?.trainerId === trainer.id)
  let requirement = ''
  if (game.campaign.badges.length < trainer.requiredBadges) {
    requirement = (game.regionId === 'alola' ? '시련 ' : '배지 ') + trainer.requiredBadges + '개 필요 · 현재 ' + game.campaign.badges.length + '개'
  } else if (!here) requirement = locationLocked ? '' : '이곳으로 이동하면 도전할 수 있습니다.'
  else if (game.campaign.leagueIndex !== null) requirement = '리그 도전이 끝나면 도전할 수 있습니다.'
  else if (game.player.currentHP <= 0) requirement = '선두 포켓몬의 HP를 회복하세요.'
  else if (!eligible) requirement = '진행 중인 행동이 끝나면 도전할 수 있습니다.'
  return <section className={'field-trainer-card ' + trainer.kind} data-field-trainer={trainer.id} aria-label={trainer.name + ' 지역 트레이너'}>
    <header>
      <FieldTrainerPortrait trainer={trainer} width={46} height={54} />
      <div><small>{trainer.tier ? trainer.tier + '등급' : '보스 도전'} · {kinds[trainer.kind]} · {series[trainer.series]}{destinations.length === 0 && ' · 자유 대결'}</small><h3>{trainer.name}</h3></div>
      <strong className="field-trainer-level">{fieldTeamLevels(opponent)}</strong>
    </header>
    {trainer.teams.length > 1 && <label className="field-party-picker">
      <span>상대 파티</span><select value={teamNumber} onChange={e => setTeamNumber(Number(e.target.value))}>
        {trainer.teams.map((_, index) => <option key={index} value={index + 1}>
          {trainer.sourceId === 'factory-clown' ? '렌탈 파티 ' + (index + 1) : index >= 3 ? '보스 도전 파티' : '파티 ' + (index + 1)}
        </option>)}
      </select>
    </label>}
    <TrainerTeam trainer={opponent} regionId={game.regionId} />
    <VenuePreview region={game.regionId} trainer={trainer} />
    {destinations.length > 0 && <details className="field-trainer-destinations">
      <summary>이 대결에서 이겨야 갈 수 있는 곳 · {destinations.length}곳</summary>
      <div className="filter-row" aria-label="승리가 필요한 장소">
        {destinations.map(place => <button type="button" key={place.id} onClick={() => choose(place.id)}>{place.name}</button>)}
      </div>
    </details>}
    {cleared ? <p className="field-trainer-cleared">✓ 승리 완료 · 첫 승리 보상 수령 완료</p> :
      <p className="field-trainer-prize">첫 승리 보상 · 기본 경험치 {reward.experience} · {reward.coins}코인</p>}
    {requirement && <p className="field-trainer-requirement">{requirement}</p>}
    {here && <button className="primary campaign-cta" disabled={!eligible || busy}
      onClick={() => challenge(trainer.id, teamNumber)}>{trainer.name}{cleared ? ' 연습 재대결' : '에게 도전'}</button>}
  </section>
}
