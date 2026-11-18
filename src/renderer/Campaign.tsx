import {
  canChallengeFinale, canChallengeGym, canChallengeLeague, currentTrainer, leagueOpponents, levelCap, nextGymTrainer,
  type GameSave
} from '../game/engine'
import type { KantoTrainer } from '../game/regions/kantoCampaign'
import { battleForm, formStats, locationForm } from '../game/forms'
import { worldRegions, type RegionId } from '../game/regions/world'
import { species } from '../game/catalog'
import { Pokemon, TeraIcon, statNames, types } from './shared'
import './campaign.css'

export type ChallengeKind = 'gym' | 'league' | 'finale'

const frameSize = 32

function gymHeading(locationName: string, trainer: KantoTrainer) {
  const label = challengeName(trainer)
  return locationName.endsWith(label) ? locationName : locationName + ' ' + label
}

export function challengeName(trainer: KantoTrainer) {
  return trainer.trialKind === 'totem' ? '시련' : trainer.trialKind === 'kahuna' ? '큰 시련' : '체육관'
}

function TrainerTeam({ trainer, regionId, active, activeForm }: {
  trainer: KantoTrainer; regionId: RegionId; active?: number; activeForm?: string
}) {
  return <ul className="trainer-team" aria-label={trainer.name + '의 포켓몬'}>
    {trainer.team.map((member, index) => {
      const name = species[member.speciesId].nameKo
      const state = active === undefined ? '' : index < active ? ' is-defeated' : index === active ? ' is-battling' : ''
      return <li key={index} className={state} aria-current={index === active ? 'step' : undefined}>
        <Pokemon id={member.speciesId} formId={index === active ? activeForm : member.formId ?? locationForm(regionId, trainer.locationId, member.speciesId)} />
        <strong>{name}</strong>
        <small>Lv. {member.level} {member.teraType && <TeraIcon type={member.teraType} />}</small>
      </li>
    })}
  </ul>
}

export function ChallengeActions({ game, kind, busy, begin }: {
  game: GameSave
  kind: ChallengeKind
  busy: boolean
  begin: (kind: ChallengeKind, trainerId?: string) => void
}) {
  const region = worldRegions[game.regionId]
  if (kind === 'finale') {
    if (game.campaign.finaleWon) return <p className="campaign-result">✓ 네모에게 승리 · 챔피언 로드 완료</p>
    if (!game.campaign.champion) return <p className="campaign-requirement">챔피언 테스트에 합격하면 네모에게 도전할 수 있습니다.</p>
    return <button className="primary campaign-cta" disabled={busy || !canChallengeFinale(game)}
      onClick={() => begin('finale')}>네모에게 도전</button>
  }
  if (kind === 'gym') {
    const gym = region.gymTrainerByLocationId[game.locationId]
    if (!gym) return null
    if (game.campaign.badges.includes(gym.id)) return <p className="campaign-result">✓ {gym.badge} 획득</p>
    const next = nextGymTrainer(game)
    if (next && next.id !== gym.id) {
      const location = region.locationById[next.locationId]
      return <p className="campaign-requirement">{location.name}에서 {next.badge}를 먼저 획득하세요.</p>
    }
    return <button className="primary campaign-cta" disabled={busy || !canChallengeGym(game)}
      onClick={() => begin('gym')}>{challengeName(gym)} 도전</button>
  }

  if (game.campaign.champion && region.id === 'paldea') return <p className="campaign-result">✓ 챔피언 테스트 합격</p>
  if (game.campaign.champion) return <p className="campaign-result">✓ {region.id === 'galar' ? '가라르 챔피언컵' : region.name.replace(/지방$/, '') + ' 리그'} 우승</p>
  if (game.campaign.badges.length < region.gymTrainers.length) {
    return <p className="campaign-requirement">{region.id === 'alola' ? '시련 7개와 큰 시련 4개를 완료하세요' : '배지 ' + region.gymTrainers.length + '개가 필요합니다'} · {game.campaign.badges.length}/{region.gymTrainers.length}</p>
  }
  const candidates = leagueOpponents(game)
  if (region.freeEliteOrder && candidates.length > 1) {
    return <div className="league-choices" role="group" aria-label="도전할 사천왕 선택">
      {candidates.map(trainer => <button key={trainer.id} className="small-button" disabled={busy || !canChallengeLeague(game)}
        aria-label={trainer.name + '에게 도전'} onClick={() => begin('league', trainer.id)}>
        {trainer.name}에게 도전 {trainer.type && <small>{types[trainer.type]}</small>}
      </button>)}
    </div>
  }
  const opponent = candidates[0]
  return <button className="primary campaign-cta" disabled={busy || !canChallengeLeague(game)}
    onClick={() => begin('league')}>{game.campaign.leagueIndex === null || !opponent ? (region.id === 'paldea' ? '챔피언 테스트 도전' : region.id === 'galar' ? '챔피언컵 도전' : '리그 도전') : opponent.name + '에게 도전'}</button>
}

export function TrainerBattleCard({ game }: { game: GameSave }) {
  const battle = game.campaign.battle
  const trainer = currentTrainer(game)
  if (!battle || !trainer) return null

  const opponent = game.wild.find(mon => mon.id === game.runtime.targetId && mon.trainerId === trainer.id)
  const leadType = formStats(game.player.speciesId, game.player.formId).types[0]
  const leagueFinal = game.regionId === 'alola' ? '초대 챔피언 결정전' : '챔피언전'
  const label = trainer.cupRound ?? (trainer.trialKind ? challengeName(trainer) : { gym: '체육관전', elite: '사천왕전', champion: leagueFinal }[trainer.role])
  return <section className="card campaign-battle" aria-label="진행 중인 트레이너 배틀">
    <div className="campaign-heading"><h2>{label} · {trainer.name}</h2>
      <span>{battle.opponentIndex + 1}/{trainer.team.length}마리째</span></div>
    {opponent?.teraType && <p className="campaign-subtitle tera-match"><span><TeraIcon type={leadType} /> 선두 · {types[leadType]}</span>
      <span><TeraIcon type={opponent.teraType} /> 상대 · {types[opponent.teraType]}</span>테라스탈{opponent.abilityId && <span>특성 · {opponent.abilityId === 'levitate' ? '부유' : '저수'}</span>}</p>}
    {opponent && Boolean(opponent.maxActionsLeft) && <p className="campaign-subtitle">선두 다이맥스 · 상대 {opponent.dynamax === 'gigantamax' ? '거다이맥스' : '다이맥스'} · 남은 {Math.ceil(opponent.maxActionsLeft! / 2)}턴</p>}
    {trainer.totemAura && <p className="campaign-subtitle">주인 오라 · {trainer.totemAura.stat === 'all' ? '모든 능력' : statNames[trainer.totemAura.stat]} {trainer.totemAura.stages}랭크 상승</p>}
    <TrainerTeam trainer={trainer} regionId={game.regionId} active={battle.opponentIndex} activeForm={opponent && battleForm(opponent)} />
    {opponent && <div className="campaign-hp">
      <span>상대 HP <strong>{opponent.currentHP}/{opponent.maxHP}</strong></span>
      <progress aria-label="상대 HP" value={opponent.currentHP} max={opponent.maxHP} />
    </div>}
  </section>
}

export function Campaign({ game, busy, begin, locate }: {
  game: GameSave
  busy: boolean
  begin: (kind: ChallengeKind, trainerId?: string) => void
  locate: (locationId: string) => void
}) {
  const region = worldRegions[game.regionId]
  const regionName = region.name.replace(/지방$/, '')
  const leagueTitle = regionName + (region.id === 'paldea' ? ' 챔피언 테스트' : region.id === 'galar' ? ' 챔피언컵' : ' 리그')
  const progressTitle = regionName + (region.id === 'alola' ? ' 섬 순례' : ' 배지')
  const badgeSheet = new URL('maps/' + region.id + '/gym-badges.png', document.baseURI).href
  const gym = region.gymTrainerByLocationId[game.locationId]
  const atLeague = game.locationId === region.leagueLocationId
  const stage = game.campaign.leagueIndex
  const inBattle = Boolean(game.campaign.battle)
  const options = atLeague && !inBattle ? leagueOpponents(game) : []
  const next = options.length === 1 ? options[0] : undefined
  const finale = region.finaleTrainer && (region.trainerForStarter?.(region.finaleTrainer, game.starterSpeciesId) ?? region.finaleTrainer)

  return <div className="campaign-layout">
    <section className="card campaign-badges" aria-label={progressTitle}>
      <div className="campaign-heading"><h2>{progressTitle}</h2>
        <span className="campaign-count">{game.campaign.badges.length} / {region.gymTrainers.length}</span></div>
      <p className="campaign-subtitle">레벨 상한 Lv. {levelCap(game)}
        {game.campaign.badges.length < region.gymTrainers.length &&
          (region.id === 'alola' ? ' · 다음 시련 완료 시 Lv. ' : ' · 다음 배지 획득 시 Lv. ') + region.levelCaps[game.campaign.badges.length + 1]}
      </p>
      <ul className="badge-grid">
        {region.gymTrainers.map((trainer, index) => {
          const obtained = game.campaign.badges.includes(trainer.id)
          const location = region.locationById[trainer.locationId]
          const tile = index * 2 + (obtained ? 1 : 0)
          return <li key={trainer.id}>
            <button className={'badge-tile' + (obtained ? ' is-earned' : '')}
              onClick={() => locate(trainer.locationId)} title={location.name + ' 지도에서 보기'}>
              <span className="badge-art" aria-hidden="true"
                style={{ backgroundImage: 'url("' + badgeSheet + '")', backgroundPositionY: '-' + tile * frameSize + 'px' }} />
              <span className="badge-name"><strong>{trainer.badge}</strong><small>{trainer.trialKind ? challengeName(trainer) + ' · ' : ''}{location.name} · {trainer.name}</small></span>
              <span className="badge-state">{obtained ? '획득' : '지도'}</span>
            </button>
          </li>
        })}
      </ul>
    </section>

    <div className="campaign-stack">
      <TrainerBattleCard game={game} />
      {gym && !inBattle && <section className="card campaign-gym">
        <div className="campaign-heading"><h2>{gymHeading(region.locationById[gym.locationId].name, gym)}</h2>
          <span>{gym.type ? types[gym.type] : ''}</span></div>
        <p className="campaign-subtitle">{gym.trialKind === 'totem' ? gym.name : (gym.trialKind === 'kahuna' ? '섬의 대표' : '관장') + ' · ' + gym.name}</p>
        <TrainerTeam trainer={gym} regionId={region.id} />
        <ChallengeActions game={game} kind="gym" busy={busy} begin={begin} />
      </section>}
      <section className="card campaign-league" aria-label={leagueTitle}>
        <div className="campaign-heading"><h2>{leagueTitle}</h2>
          {stage !== null && !game.campaign.champion && <span>승리 {stage}/{region.leagueTrainers.length}</span>}</div>
        <ol className="league-steps">
          {region.leagueTrainers.map((trainer, index) => {
            const complete = game.campaign.champion || (region.freeEliteOrder
              ? game.campaign.eliteWins?.includes(trainer.id) : stage !== null && index < stage)
            const active = !complete && (region.freeEliteOrder
              ? game.campaign.battle?.trainerId === trainer.id || next?.id === trainer.id : stage === index)
            return <li key={trainer.id} aria-current={active ? 'step' : undefined}
              className={complete ? 'is-complete' : active ? 'is-next' : ''}>
              <span>{trainer.cupRound ?? (trainer.role === 'champion' ? region.id === 'alola' ? '결정전' : '챔피언' : '사천왕')}</span>
              <strong>{trainer.name}</strong>
              {complete && <small>승리</small>}
            </li>
          })}
        </ol>
        {next && <div className="league-next"><p className="campaign-subtitle">다음 상대 · {next.name}</p>
          <TrainerTeam trainer={next} regionId={region.id} /></div>}
        {atLeague || game.campaign.champion ? <ChallengeActions game={game} kind="league" busy={busy} begin={begin} />
          : <button className="small-button" onClick={() => locate(region.leagueLocationId)}>{region.locationById[region.leagueLocationId].name} 지도에서 보기</button>}
      </section>
      {finale && game.campaign.champion && <section className="card campaign-finale" aria-label="챔피언 로드 최종전">
        <div className="campaign-heading"><h2>네모와의 결전</h2><span>{region.locationById[finale.locationId].name}</span></div>
        {!game.campaign.finaleWon && !inBattle && <TrainerTeam trainer={finale} regionId={region.id} />}
        {game.campaign.finaleWon || game.locationId === finale.locationId
          ? <ChallengeActions game={game} kind="finale" busy={busy} begin={begin} />
          : <button className="small-button" onClick={() => locate(finale.locationId)}>네모를 지도에서 찾기</button>}
      </section>}
    </div>
  </div>
}
