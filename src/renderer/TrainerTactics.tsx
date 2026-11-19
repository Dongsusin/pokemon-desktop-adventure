import { fieldMemberMoves, fieldPowerOptions } from '../game/engine'
import { gimmickLabels } from '../game/gimmickCombat'
import { isSpeciesMotionSupported } from '../game/motionEligibility'
import type { KantoTrainer } from '../game/regions/kantoCampaign'
import { pokemonName, types } from './shared'

export function TrainerTactics({ trainer }: { trainer: KantoTrainer }) {
  if (!trainer.team[0]?.plan) return null
  return <details className="field-trainer-tactics"><summary>상대 기술과 기믹</summary>
      <dl>{trainer.team.map((member,index) => {
        const skills = fieldMemberMoves(member)
        const powers = fieldPowerOptions(member)
        return <div key={index}><dt>{pokemonName(member.speciesId,member.formId)}</dt>
          <dd>{skills.map(m=>m.nameKo).join(' · ')}
            {powers.map(p => <small key={p.kind}>{p.formId ? pokemonName(member.speciesId,p.formId) :
              p.giant && !member.formId && isSpeciesMotionSupported(member.speciesId,member.speciesId+'-gmax') ? '거다이맥스' : gimmickLabels[p.kind] + (p.type ? ' · ' + types[p.type] : '')}</small>)}</dd></div>
      })}</dl>
    </details>
}
