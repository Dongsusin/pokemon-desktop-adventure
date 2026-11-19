import { canChallengeFieldTrainer, fieldTrainerRewards, type GameSave } from '../game/engine'
import type { FieldTrainer } from '../game/regions/fieldTrainers'
import { locationGateRules } from '../game/regions/locationGates'
import { worldRegions } from '../game/regions/world'
import { TrainerTeam } from './Campaign'
import { VenuePreview } from './VenuePreview'
import { fieldTrainerPortrait } from './fieldTrainerArt'

const kinds = { ally: '동료', rival: '라이벌', villain: '악의 조직', trainer: '트레이너' }
const series = { game: '게임', anime: '애니메이션', both: '게임·애니메이션' }

export function fieldTeamLevels(trainer: FieldTrainer) {
  const levels = trainer.team.map(member => member.level)
  const low = Math.min(...levels), high = Math.max(...levels)
  return 'Lv. ' + (low === high ? low : low + '–' + high)
}

export function FieldTrainerCard({ trainer, game, busy, locationLocked, challenge, choose }: {
  trainer: FieldTrainer; game: GameSave; busy: boolean; locationLocked: boolean
  challenge: (id: string) => void; choose: (locationId: string) => void
}) {
  const cleared = game.campaign.fieldWins?.includes(trainer.id)
  const here = game.locationId === trainer.locationId
  const eligible = canChallengeFieldTrainer(game, trainer.id)
  const reward = fieldTrainerRewards(trainer)
  const region = worldRegions[game.regionId]
  const destinations = region.locations.filter(place => locationGateRules[region.id][place.id]?.trainerId === trainer.id)
  let requirement = ''
  if (!cleared) {
    if (game.campaign.badges.length < trainer.requiredBadges) {
      requirement = (game.regionId === 'alola' ? '시련 ' : '배지 ') + trainer.requiredBadges + '개 필요 · 현재 ' + game.campaign.badges.length + '개'
    } else if (!here) requirement = locationLocked ? '' : '이곳으로 이동하면 도전할 수 있습니다.'
    else if (game.campaign.leagueIndex !== null) requirement = '리그 도전이 끝나면 도전할 수 있습니다.'
    else if (game.player.currentHP <= 0) requirement = '선두 포켓몬의 HP를 회복하세요.'
    else if (!eligible) requirement = '진행 중인 행동이 끝나면 도전할 수 있습니다.'
  }
  return <section className={'field-trainer-card ' + trainer.kind} data-field-trainer={trainer.id} aria-label={trainer.name + ' 지역 트레이너'}>
    <header>
      <img src={fieldTrainerPortrait(trainer)} alt="" width={46} height={54} draggable={false} />
      <div><small>{kinds[trainer.kind]} · {series[trainer.series]}{destinations.length === 0 && ' · 자유 대결'}</small><h3>{trainer.name}</h3></div>
      <strong className="field-trainer-level">{fieldTeamLevels(trainer)}</strong>
    </header>
    <TrainerTeam trainer={trainer} regionId={game.regionId} />
    <VenuePreview region={game.regionId} trainer={trainer} />
    {destinations.length > 0 && <details className="field-trainer-destinations">
      <summary>이 대결에서 이겨야 갈 수 있는 곳 · {destinations.length}곳</summary>
      <div className="filter-row" aria-label="승리가 필요한 장소">
        {destinations.map(place => <button type="button" key={place.id} onClick={() => choose(place.id)}>{place.name}</button>)}
      </div>
    </details>}
    <p className="field-trainer-prize">{cleared ? '첫 승리 보상 수령 완료' : '첫 승리 보상'} · 기본 경험치 {reward.experience} · {reward.coins}코인</p>
    {cleared ? <p className="field-trainer-cleared">✓ 승리 완료</p> : <>
      {requirement && <p className="field-trainer-requirement">{requirement}</p>}
      {here && <button className="primary campaign-cta" disabled={!eligible || busy}
        onClick={() => challenge(trainer.id)}>{trainer.name}에게 도전</button>}
    </>}
  </section>
}
