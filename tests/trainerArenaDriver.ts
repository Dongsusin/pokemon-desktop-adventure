import { advanceScripted } from './arenaSimulation'
import { arenaCastFrame, arenaCastTouches } from '../src/game/arenaMoves'
import { performArenaTactic, arenaSkills, battleGimmickStatus, currentTrainer, dispatch, hydrateSave, moves, typeMultiplier, type GameSave } from '../src/game/engine'

import { megaFormFor } from '../src/game/battleGimmicks'
import { formStats } from '../src/game/forms'
import { isMoveMotionSupported } from '../src/game/motionEligibility'

const bounds = { width: 1280, height: 800 }
const frame = 100

function resume(game: GameSave) {
  if (game.campaign.battle?.arena.paused) dispatch(game, { type: 'arena-pause', paused: false })
}

// Resume a legal last-survivor state for tests of one specific opponent's battle mechanics.
export function resumeWithLastOpponent(game: GameSave, index = currentTrainer(game)!.team.length - 1): GameSave {
  const saved = structuredClone(game)
  const team = currentTrainer(saved)!.team, battle = saved.campaign.battle!, member = team[index]
  battle.opponentIndex = index
  battle.fieldAI!.benchHP = team.map((_, i) => i === index ? null : 0)
  Object.assign(saved.wild[0], { speciesId: member.speciesId, formId: member.formId, level: member.level,
    fieldSlot: index, currentHP: Number.MAX_SAFE_INTEGER })
  const restored = hydrateSave(saved, game.selectedSlot)!
  if (restored.campaign.battle?.opponentIndex !== index) throw Error('Invalid trainer test fixture')
  resume(restored)
  return restored
}

// Feed the same fighter actions that the partner AI uses into the arena simulation.
export function playFrame(game: GameSave, moveId?: string): boolean {
  resume(game)
  const arena = game.campaign.battle?.arena
  if (!arena) return false
  if (arena.needsSwitch) {
    const next = game.followers.find(member => member.currentHP > 0)
    if (next) dispatch(game, { type: 'arena-switch', instanceId: next.instanceId })
  }

  const { player, enemy } = arena
  let dx = enemy.x - player.x
  let dy = enemy.y - player.y
  const threat = arena.casts.find(cast => cast.side === 'enemy' && cast.profile.kind !== 'self' && !cast.resolved)
  if (threat) {
    const stop = threat.profile.startupMs + threat.profile.activeMs
    if (arenaCastTouches(threat, threat.elapsedMs, stop, player, player)) {
      if (threat.profile.kind === 'burst') {
        dx = player.x - threat.target.x
        dy = player.y - threat.target.y
        if (Math.abs(dx) + Math.abs(dy) < 0.04) {
          dx = player.x < 0.5 ? 1 : -1
          dy = player.y < 0.5 ? 1 : -1
        }
      } else {
        const { direction } = arenaCastFrame(threat)
        const perpendicular = { x: -direction.y, y: direction.x }
        const towardsCenter = perpendicular.x * (0.5 - player.x) + perpendicular.y * (0.5 - player.y)
        const sign = towardsCenter >= 0 ? 1 : -1
        dx = perpendicular.x * sign
        dy = perpendicular.y * sign
      }
      performArenaTactic(game, { type: 'arena-move', x: Math.sign(dx), y: Math.sign(dy) })
      performArenaTactic(game, { type: 'arena-dodge' })
    } else {
      dx = 0
      dy = 0
    }
  }
  performArenaTactic(game, { type: 'arena-move', x: Math.abs(dx) < 0.03 ? 0 : Math.sign(dx), y: Math.abs(dy) < 0.03 ? 0 : Math.sign(dy) })
  const options = arenaSkills(game)
    .map((skill, slot) => ({ ...skill, slot }))
    .filter(skill => skill.unlocked && skill.inRange && skill.cooldownMs <= 0 &&
      (moveId ? skill.move.id === moveId : skill.move.category !== 'healing'))
    .map(skill => ({ ...skill, score: skill.move.power * (typeof skill.effectiveness === 'number' ? skill.effectiveness : 0) }))
    .filter(skill => moveId || skill.score > 0)
    .sort((a, b) => b.score - a.score)
  const cast = Boolean(options[0] && performArenaTactic(game, { type: 'arena-skill', slot: options[0].slot }))
  advanceScripted(game, frame, bounds)
  return cast
}

export function castSkill(game: GameSave, moveId?: string) {
  for (let i = 0; i < 250 && game.campaign.battle; i++) {
    const previousTarget = game.wild[0]?.id
    if (!playFrame(game, moveId)) continue
    const committed = game.campaign.battle?.arena.casts.filter(cast => cast.side === 'player').at(-1)
    if (!committed || game.wild[0]?.id !== previousTarget) return
    performArenaTactic(game, { type: 'arena-move', x: 0, y: 0 })
    const duration = committed.profile.startupMs + committed.profile.activeMs + committed.profile.recoveryMs
    for (let t = 0; t <= duration && !committed.resolved && game.campaign.battle; t += frame) {
      advanceScripted(game, frame, bounds)
    }
    if (committed.result === 'hit' || game.wild[0]?.id !== previousTarget) return
  }
  throw Error('Unable to cast ' + (moveId ?? 'a damaging skill') + ' against ' + game.campaign.battle?.trainerId)
}

function useRegionalPower(game: GameSave) {
  const status = battleGimmickStatus(game)
  if (status?.phase !== 'ready') return
  if (status.kind === 'mega') {
    const party = game.player
    const form = megaFormFor(party.speciesId, party.formId)
    const attacks = party.moveIds.filter(id => moves[id].category !== 'healing' && isMoveMotionSupported(party.speciesId, form, id))
    const battle = game.campaign.battle!
    const remaining = currentTrainer(game)!.team.filter((_,i) => battle.fieldAI ? battle.fieldAI.benchHP[i] !== 0 : i >= battle.opponentIndex)
    // A native Mega can lose its shooting animation; a lone fighter needs coverage for the whole team.
    if (remaining.some(foe => attacks.every(id => !typeMultiplier(moves[id].type, formStats(foe.speciesId, foe.formId).types)))) return
  }
  dispatch(game, { type: 'arena-gimmick' })
}

export function finishChallenge(game: GameSave) {
  for (let i = 0; i < 4000 && game.campaign.battle; i++) {
    resume(game)
    useRegionalPower(game)
    playFrame(game)
  }
  if (game.campaign.battle) throw Error('Challenge did not finish against ' + game.campaign.battle.trainerId)
}

export function idleUntilHit(game: GameSave) {
  resume(game)
  const hp = game.player.currentHP
  for (let i = 0; i < 180 && game.campaign.battle && game.player.currentHP === hp; i++) advanceScripted(game, frame, bounds)
}
