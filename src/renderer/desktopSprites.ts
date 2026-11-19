import { arenaMoveProfile } from '../game/arenaMoves'
import { battleDirectionRow } from '../game/arenaMuzzle'
import { species } from '../game/catalog'
import { battleGimmickStatus, DYNAMAX_OPPONENT_SCALE, DYNAMAX_PARTNER_SCALE, LOOT_RANGE, type Effect, type GameSave, type Position } from '../game/engine'
import type { BattleGimmick } from '../game/battleGimmicks'
import { battleForm } from '../game/forms'
import { worldRegions } from '../game/regions/world'
import { spriteAtlas, spriteAtlasKey, spriteExtent, spriteFrameIndex } from './spriteAtlas'

export const BALL_LAND = 0.33
export const BALL_REVEAL = 0.78
const PARTNER = 'partner'
type FieldMotion = 'idle' | 'walk' | 'attack' | 'shoot' | 'hurt'
export type Figure = {
  formId?: string
  totem?: boolean
  gimmick?: BattleGimmick
  teraType?: string
  id: string
  speciesId: string
  at: Position
  direction: -1 | 1
  moving: boolean
  lookAt?: Position
  cycleOffset: number
  scale: number
  defeat?: Effect
}

export const phase = (effect: Effect, ahead = 0) =>
  Math.min(1, Math.max(0, (effect.durationMs - effect.remainingMs + ahead) / Math.max(1, effect.durationMs)))
export function latestEffect(effects: Effect[], matches: (effect: Effect) => boolean) {
  for (let i = effects.length - 1; i >= 0; i--) {
    if (matches(effects[i])) return effects[i]
  }
}
const followerId = (instanceId: string) => 'follower:' + instanceId

export function figures(game: GameSave, evolution?: Effect, capture?: Effect, ahead = 0): Figure[] {
  const player = game.player
  const target = game.wild.find(mon => mon.id === game.runtime.targetId)
  const ally = game.runtime.gimmick?.player?.active ? battleGimmickStatus(game) : null
  const rival = game.runtime.gimmick?.enemy?.active ? battleGimmickStatus(game, 'enemy') : null
  const allyActive = ally?.phase === 'active' ? ally : undefined
  const enemyActive = rival?.phase === 'active' ? rival : undefined
  const observing = ['SEARCH', 'CHASE', 'BATTLE'].includes(player.state)
  const destination = player.state === 'LOOT' ? game.runtime.drop?.position
    : observing ? target?.position : player.state === 'WANDER' ? game.runtime.destination : undefined
  const nearby: Figure[] = game.wild.map(mon => {
    const active = mon === target ? enemyActive : undefined
    const totem = Boolean(mon.trainerId && worldRegions[game.regionId].trainerById[mon.trainerId]?.totemAura)
    return {
      id: String(mon.id), speciesId: mon.speciesId, formId: active?.formId ?? battleForm(mon), at: mon.position, direction: mon.direction,
      lookAt: observing && mon === target ? player.position : undefined, cycleOffset: mon.id % 97, moving: false,
      totem, teraType: active?.kind === 'tera' ? active.teraType : undefined, gimmick: active?.kind,
      scale: game.settings.spriteScale * (active?.kind === 'dynamax' ? DYNAMAX_OPPONENT_SCALE : totem ? 1.18 : 0.84)
    }
  })
  if (capture?.captured && capture.speciesId && capture.target && typeof capture.targetActor === 'number'
      && phase(capture, ahead) < BALL_LAND + 0.1 && !nearby.some(mon => mon.id === String(capture.targetActor))) {
    nearby.push({
      id: String(capture.targetActor), speciesId: capture.speciesId, formId: capture.formId, at: capture.target,
      direction: player.position.x >= capture.target.x ? 1 : -1,
      lookAt: player.position, cycleOffset: capture.targetActor % 97, moving: false, scale: game.settings.spriteScale * 0.84
    })
  }
  const followers = (game.settings.showPartyOnDesktop ? game.followers : []).map(mon => ({
    id: followerId(mon.instanceId), speciesId: mon.speciesId, formId: mon.formId, at: mon.position, direction: mon.direction,
    lookAt: mon.destination ?? undefined, cycleOffset: mon.roamSeed % 97,
    moving: mon.state === 'WANDER' && !!mon.destination, scale: game.settings.spriteScale
  }))
  const partnerId = evolution && phase(evolution, ahead) < 0.54 && evolution.fromSpeciesId
    ? evolution.fromSpeciesId : player.speciesId
  const defeated: Figure[] = []
  for (const effect of game.effects) {
    if (!game.settings.effects || effect.kind !== 'defeat' || typeof effect.actor !== 'number' || !effect.speciesId) continue
    if (nearby.some(mon => mon.id === String(effect.actor))) continue
    defeated.push({
      id: String(effect.actor), speciesId: effect.speciesId, formId: effect.formId, at: effect.position,
      direction: player.position.x >= effect.position.x ? 1 : -1,
      lookAt: player.position, cycleOffset: effect.actor % 97, moving: false, scale: game.settings.spriteScale * 0.84, defeat: effect
    })
  }
  return [{
    id: PARTNER, speciesId: partnerId, formId: partnerId === player.speciesId ? allyActive?.formId ?? player.formId : evolution?.fromFormId, at: player.position, direction: player.direction,
    lookAt: destination ?? undefined, cycleOffset: (player.roamSeed ?? 0) % 97,
    moving: !!destination && (player.state === 'WANDER' || player.state === 'CHASE' ||
      (player.state === 'LOOT' && Math.hypot(destination.x - player.position.x, destination.y - player.position.y) > LOOT_RANGE + .01)),
    teraType: allyActive?.kind === 'tera' ? allyActive.teraType : undefined, gimmick: allyActive?.kind,
    scale: game.settings.spriteScale * (allyActive?.kind === 'dynamax' ? DYNAMAX_PARTNER_SCALE : 1)
  }, ...followers, ...nearby, ...defeated]
}

export function poseFor(figure: Figure, effects: Effect[], ahead: number, evolution?: Effect, capture?: Effect) {
  let x = 0
  let y = 0
  let motion: FieldMotion = figure.moving ? 'walk' : 'idle'
  let lookAt = figure.lookAt
  let progress: number | undefined
  let alpha = 1
  let tint = 0xffffff
  let stretch = 1
  const activeAttack = latestEffect(effects, effect => effect.kind === 'attack' && String(effect.actor) === figure.id)
  const damage = latestEffect(effects, effect => effect.kind === 'damage' && String(effect.actor ?? effect.targetActor) === figure.id)
  if (activeAttack?.target) {
    const kind = arenaMoveProfile({ id: activeAttack.moveId ?? 'tackle' }).kind
    motion = kind === 'dash' || kind === 'cone' ? 'attack' : 'shoot'
    lookAt = activeAttack.target
    progress = phase(activeAttack, ahead)
  }
  if (damage) {
    const t = phase(damage, ahead)
    if (t < 0.43) {
      if (!activeAttack) {
        motion = 'hurt'
        progress = t / .43
      }
      x += Math.sin(t * 50) * (1 - t) * 8 * figure.scale
      tint = 0xffb38f
    }
  }
  if (figure.defeat) {
    const t = phase(figure.defeat, ahead)
    y += t * 12
    stretch = 1 - t * 0.21
    alpha = 1 - t
  }
  if (evolution && figure.id === PARTNER) {
    const t = phase(evolution, ahead)
    const flash = Math.max(0, 1 - Math.abs(t - 0.52) * 11)
    y -= Math.sin(t * Math.PI) * 9 * figure.scale
    stretch = 1 + Math.sin(t * Math.PI) * 0.15
    alpha = 1 - flash * 0.90
    tint = t < 0.54 ? 0xffdf9c : 0xffffff
  }
  if (capture) {
    const t = phase(capture, ahead)
    if (typeof capture.targetActor === 'number' && String(capture.targetActor) === figure.id) {
      const entering = Math.max(0, Math.min(1, (t - BALL_LAND + 0.02) / 0.1))
      const leaving = capture.captured ? 0 : Math.max(0, Math.min(1, (t - BALL_REVEAL) / 0.12))
      const visible = Math.max(1 - entering, leaving)
      alpha *= visible
      stretch *= 0.2 + visible * 0.8
      if (visible < 0.96) tint = 0xffc798
    } else if (capture.caughtInstanceId && figure.id === followerId(capture.caughtInstanceId)) {
      const joining = Math.max(0, Math.min(1, (t - BALL_REVEAL) / 0.14))
      alpha *= joining
      stretch *= 0.35 + joining * 0.65
    }
  }
  return { x, y, alpha, tint, stretch, motion, lookAt, progress }
}

export function fieldFrame(figure: Figure, pose: ReturnType<typeof poseFor>, lastRow: number | undefined, now: number) {
  const key = spriteAtlasKey(species[figure.speciesId].pokedexNumber, figure.formId)
  const atlas = spriteAtlas(key)
  if (!atlas) return undefined
  const dx = (pose.lookAt?.x ?? figure.at.x) - figure.at.x
  const dy = (pose.lookAt?.y ?? figure.at.y) - figure.at.y
  const row = dx || dy ? battleDirectionRow({ x: dx, y: dy }) : lastRow ?? (figure.direction === 1 ? 2 : 6)
  const strip = atlas[pose.motion] ?? atlas.idle
  const [offset, width, height, anchorX, anchorY, rows, durations] = strip
  const period = durations.reduce((sum, ticks) => sum + ticks, 0)
  const tick = pose.progress === undefined ? (now * .06 + figure.cycleOffset) % period : pose.progress * period
  const frame = spriteFrameIndex(durations, tick)
  return { key, row, frame, x: frame * width, y: offset + (rows === 1 ? 0 : row) * height,
    width, height, anchorX, anchorY, extent: spriteExtent(atlas) }
}
