import type { battleGimmickStatus } from '../game/engine'
import { megaForms, type BattleGimmick } from '../game/battleGimmicks'
import { pokemonName, types } from './shared'

export type GimmickStatus = NonNullable<ReturnType<typeof battleGimmickStatus>>

export function GimmickControl({ status, playing, activate, selectedMega, chooseMega }: {
  status: GimmickStatus; playing: boolean; activate: () => void; selectedMega?: string; chooseMega: (formId: string) => void
}) {
  const ready = status.phase === 'ready'
  const element = status.teraType && types[status.teraType]
  let detail = status.detail
  if (status.kind === 'z' && element) {
    detail = ready ? element + ' 타입 공격 강화 · ' + status.detail : element + ' 타입의 다음 공격을 강화합니다.'
  }
  if (status.kind === 'tera' && element) detail = '방어 타입 · ' + element
  const mega = ready ? selectedMega : status.formId
  if (status.kind === 'mega' && mega && megaForms[mega]) {
    detail = '변신 타입 · ' + megaForms[mega].types.map(type => types[type]).join(' / ')
  }
  const caption = ready ? '발동' : status.phase === 'queued' ? '예약됨' : status.phase === 'spent' ? '사용 완료' : status.phase === 'active' ? '발동 중' : '조건 미충족'
  if (status.phase === 'queued') detail = status.detail
  return <div className="ring-gimmick-control" data-gimmick={status.kind} data-phase={status.phase}>
    <button type="button" aria-keyshortcuts="F" aria-label={status.label + ' 발동'} aria-describedby="ring-gimmick-detail"
      disabled={!playing || !ready} onClick={activate}><kbd>F</kbd><strong>{status.label}</strong><span>{caption}</span></button>
    {ready && status.megaOptions && status.megaOptions.length > 1 &&
      <select aria-label="메가진화 모습" value={selectedMega} disabled={!playing} onChange={event => chooseMega(event.target.value)}>
        {status.megaOptions.map(id => <option key={id} value={id}>{pokemonName(megaForms[id].base, id)}</option>)}
      </select>}
    <small id="ring-gimmick-detail">{detail}</small>
  </div>
}

export function GimmickFlare({ kind }: { kind: BattleGimmick }) {
  const native = kind === 'mega' || kind === 'z'
  return <i className="gimmick-flare" data-gimmick={kind} data-native={native || undefined} aria-hidden="true">
    {native && <img src={new URL('battle/gimmicks/' + kind + '.webp', document.baseURI).href} alt="" draggable={false}/>}
    <i/><i/>
  </i>
}
