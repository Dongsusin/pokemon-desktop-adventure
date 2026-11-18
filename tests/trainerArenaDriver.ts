import { arenaSkills, dispatch, tick, type GameSave } from '../src/game/engine'
import { formStats } from '../src/game/forms'
import { teraAttackMultiplier } from '../src/game/regions/paldeaTera'

const bounds = { width: 1280, height: 800 }
const frame = 100

function resume(game: GameSave) {
  if (game.campaign.battle?.arena.paused) dispatch(game, { type: 'arena-pause', paused: false })
}

// Drive only the same movement, dodge and skill commands as the trainer battle controls.
export function playFrame(game: GameSave, moveId?: string): boolean {
  resume(game)
  const arena = game.campaign.battle?.arena
  if (!arena) return false
  if (arena.needsSwitch) {
    const next = game.followers.find(member => member.currentHP > 0)
    if (next) dispatch(game, { type: 'arena-switch', instanceId: next.instanceId })
  }

  const { player, enemy, telegraph } = arena
  let dx = enemy.x - player.x
  let dy = enemy.y - player.y
  if (telegraph) {
    const ox = player.x - telegraph.center.x
    const oy = (player.y - telegraph.center.y) * 9 / 16
    if (Math.hypot(ox, oy) <= telegraph.radius + 0.02) {
      // Move into the open half of the field if the marker is centered on us.
      dx = Math.abs(ox) > 0.04 ? ox : player.x < 0.5 ? 1 : -1
      dy = Math.abs(oy) > 0.04 ? oy : player.y < 0.5 ? 1 : -1
      dispatch(game, { type: 'arena-move', x: Math.sign(dx), y: Math.sign(dy) })
      dispatch(game, { type: 'arena-dodge' })
    } else {
      dx = 0
      dy = 0
    }
  }
  dispatch(game, { type: 'arena-move', x: Math.abs(dx) < 0.03 ? 0 : Math.sign(dx), y: Math.abs(dy) < 0.03 ? 0 : Math.sign(dy) })
  const target = game.wild[0]
  const types = formStats(game.player.speciesId, game.player.formId).types
  const options = arenaSkills(game)
    .map((skill, slot) => ({ ...skill, slot }))
    .filter(skill => skill.unlocked && skill.inRange && skill.cooldownMs <= 0 &&
      (moveId ? skill.move.id === moveId : skill.move.category !== 'healing'))
    .filter(skill => moveId || !target.teraType || teraAttackMultiplier(skill.move.type, types, types[0], target.teraType, target.abilityId) > 0)
    .sort((a, b) => b.move.power - a.move.power)
  const cast = Boolean(options[0] && dispatch(game, { type: 'arena-skill', slot: options[0].slot }))
  tick(game, frame, bounds)
  return cast
}

export function castSkill(game: GameSave, moveId?: string) {
  for (let i = 0; i < 250 && game.campaign.battle; i++) {
    if (playFrame(game, moveId)) return
  }
  throw Error('Unable to cast ' + (moveId ?? 'a damaging skill') + ' against ' + game.campaign.battle?.trainerId)
}

export function finishChallenge(game: GameSave) {
  for (let i = 0; i < 4000 && game.campaign.battle; i++) playFrame(game)
  if (game.campaign.battle) throw Error('Challenge did not finish against ' + game.campaign.battle.trainerId)
}

export function idleUntilHit(game: GameSave) {
  resume(game)
  const hp = game.player.currentHP
  for (let i = 0; i < 180 && game.campaign.battle && game.player.currentHP === hp; i++) tick(game, frame, bounds)
}
